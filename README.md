## ai-summary
Using Azure Open AI gpt-4o-mini to summarize web pages

# Setup

Add .env file with the following configuration and update the values accordingly:
```
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_ENDPOINT=https://<host>.cognitiveservices.azure.com/
AZURE_API_VERSION=2024-08-01-preview
OPENAI_MODEL_DEPLOYMENT=gpt-4o-mini
```

# Run commands:
```
npm install
node .
```

# Output
Summary is generated in a output folder with name summary_<host_name>.html
