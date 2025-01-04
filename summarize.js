import Website from "./website.js";
import 'dotenv/config';
import fetch from 'node-fetch';
import { marked } from 'marked';
import fs from 'fs';

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

// Summarize Function
const summarize = async (url) => {
  const website = new Website(url);
  await website.fetchWebsite();

  const deployment = process.env.OPENAI_MODEL_DEPLOYMENT;
  const apiVersion = process.env.AZURE_API_VERSION;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;

  if (!deployment || !apiVersion || !endpoint || !apiKey) {
    throw new Error('🚨 Azure OpenAI environment variables are not set properly.');
  }

  console.log('🔗 Connecting to Azure OpenAI with Fetch:');
  console.log(`📍 Endpoint: ${endpoint}`);
  console.log(`🚀 Deployment: ${deployment}`);
  console.log(`📅 API Version: ${apiVersion}`);

  const summary = await fetchAzureOpenAI(deployment, apiVersion, endpoint, apiKey, messages_for(website));
  return summary;
};

/**
 * Converts Markdown summary to HTML format.
 * @param {string} summaryMarkdown - The summary in Markdown format.
 * @returns {string} - The summary converted to HTML.
 */
const renderSummaryAsHTML = (summaryMarkdown) => {
  if (!summaryMarkdown) {
    console.log('❌ No summary provided to render.');
    return '';
  }

  console.log('📝 Rendering Summary as HTML:\n');

  // Convert Markdown to HTML
  const html = marked.parse(summaryMarkdown, {
    mangle: false,
    headerIds: false
  });

  console.log(html); // Display the raw HTML if needed for debugging

  return html;
};

async function main() {
  console.log('🔍 Summarizing website...');
  try {
    const URL_STRING = 'https://edwarddonner.com';
    const url = new URL(URL_STRING);
    const summary = await summarize(URL_STRING);
    const htmlSummary = renderSummaryAsHTML(summary);
    const outputFileName = `output/summary_${url.host}.html`;
    fs.writeFileSync(outputFileName, `<html><body>${htmlSummary}</body></html>`);
    console.log(`✅ HTML Summary saved to ${outputFileName}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Start Script
main().catch(error => console.error('🚨 Fatal Error in main:', error.message));
