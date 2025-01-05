## ai-summary
Display webpage summary using different LLMs. Currently, supports Azure GPT & LLama models.
Benefit of using LLama models is that it is free to use and can be run locally.

# Setup Instructions
Add .env file in your project root folder and add following configurations.
If you wish to use GPT models deployed in Azure:
```
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_ENDPOINT=https://<host>.cognitiveservices.azure.com/
AZURE_API_VERSION=2024-08-01-preview
OPENAI_MODEL_DEPLOYMENT=gpt-4o-mini
```
If you wish to use LLama models:
```
LLAMA_ENDPOINT=http://localhost:11434/api/chat
LLAMA_MODEL=llama3.2
```

# Download LLama model & run locally
Simply visit ollama.com and install!
Once complete, the ollama server should already be running locally.
If you visit:
http://localhost:11434/

You should see the message Ollama is running.

# Run commands:
```
npm install
node .
```

# Output
Summary is generated in an output folder with file name = summary_<host_name>.md
