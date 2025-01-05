import Website from "./website.js";
import 'dotenv/config';
import fetch from 'node-fetch';
import fs from 'fs';
import readline from 'readline';

const MODELS = {
  GPT: 'gpt',
  LLAMA: 'llama'
};


// CLI Input Helper
const askQuestion = (query) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => rl.question(query, (ans) => {
    rl.close();
    resolve(ans);
  }));
};

// System Prompt
const system_prompt = 'You are an assistant that analyzes the contents of a website \
and provides a short summary, ignoring text that might be navigation related. \
Respond in markdown.';

// User Prompt Generator
const user_prompt_for = (website) => {
  let user_prompt = `You are looking at a website titled "${website.title}".`;
  user_prompt += '\nThe contents of this website are as follows; \
    please provide a short summary of this website in markdown. \
    If it includes news or announcements, then summarize these too.\n\n';
  user_prompt += website.text;
  return user_prompt;
};

// Messages for OpenAI
const messages_for = (website) => {
  return [
    { "role": "system", "content": system_prompt },
    { "role": "user", "content": user_prompt_for(website) }
  ];
};

// Fetch Function for Azure OpenAI
const fetchAzureOpenAI = async (deployment, apiVersion, endpoint, apiKey, messages) => {
  const url = `${endpoint}openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
  console.log('🔗 Fetching from Azure OpenAI API:', url);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        model: deployment,
        messages: messages
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`❌ Fetch Error: ${response.status} ${response.statusText}\n${errorBody}`);
    }

    const data = await response.json();
    console.log('✅ API Response:', JSON.stringify(data, null, 2));

    if (!data.choices || data.choices.length === 0) {
      throw new Error('❌ No choices returned from Azure OpenAI API');
    }

    return data.choices[0]?.message?.content || 'No summary available';
  } catch (error) {
    console.error('❌ Azure OpenAI API Error:', error.message);
    throw error;
  }
};

const fetchFromLLaMA = async (messages) => {
  const url = process.env.LLAMA_ENDPOINT || 'http://localhost:11434/api/chat';
  const model = process.env.LLAMA_MODEL || 'llama3.2';
  console.log('🔗 Fetching Summary from LLama Model API:', url);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: messages,
        stream: false
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`❌ Fetch Error: ${response.status} ${response.statusText}\n${errorBody}`);
    }

    const data = await response.json();
    console.log('✅ LLama Response:', JSON.stringify(data, null, 2));

    if (!data.message || data.message.content === 0) {
      throw new Error('❌ No message returned from LLama');
    }

    return data.message?.content || 'No summary available';
  } catch (error) {
    console.error('❌ Local Model API Error:', error.message);
    throw error;
  }
};

const summarize = async (url, modelChoice) => {
  console.log('🔍 Summarizing website...');
  const website = new Website(url);
  await website.fetchWebsite();

  if (modelChoice === MODELS.GPT) {
    const deployment = process.env.OPENAI_MODEL_DEPLOYMENT;
    const apiVersion = process.env.AZURE_API_VERSION;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;

    if (!deployment || !apiVersion || !endpoint || !apiKey) {
      throw new Error('🚨 Azure OpenAI environment variables are not set properly.');
    }

    return await fetchAzureOpenAI(deployment, apiVersion, endpoint, apiKey, messages_for(website));
  } else if (modelChoice === MODELS.LLAMA) {
    return await fetchFromLLaMA(messages_for(website));
  } else {
    throw new Error(`❌ Unsupported model choice. Choose from ${Object.values(MODELS).join(', ')}`);
  }
};

async function main() {
  try {
    const URL_STRING = await askQuestion('🌐 Enter the website URL: ');
    const MODEL_CHOICE = await askQuestion(`🤖 Choose model type ${Object.values(MODELS).join(', ')}: `);

    const url = new URL(URL_STRING);
    const summary = await summarize(URL_STRING, MODEL_CHOICE);
    const outputFileName = `output/summary_${url.host}.md`;
    fs.mkdirSync('output', { recursive: true });
    fs.writeFileSync(outputFileName, summary);

    console.log(`✅ Summary saved to ${outputFileName}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Start Script
main().catch(error => console.error('🚨 Fatal Error in main:', error.message));
