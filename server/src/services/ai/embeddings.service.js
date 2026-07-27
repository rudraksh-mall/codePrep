const { ChatOpenAI, OpenAIEmbeddings } = require("@langchain/openai");
const { openrouterApiKey } = require("../../config/env");

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

function getEmbeddings() {
  if (!openrouterApiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not configured. Set it in .env to use AI features.",
    );
  }

  return new OpenAIEmbeddings({
    model: "text-embedding-3-small",
    apiKey: openrouterApiKey,
    configuration: { baseURL: OPENROUTER_BASE_URL },
  });
}

function getLLM() {
  if (!openrouterApiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not configured. Set it in .env to use AI features.",
    );
  }

  return new ChatOpenAI({
    model: "deepseek/deepseek-chat-v3-0324",
    apiKey: openrouterApiKey,
    temperature: 0.7,
    maxTokens: 1024,
    configuration: { baseURL: OPENROUTER_BASE_URL },
  });
}

module.exports = { getEmbeddings, getLLM };
