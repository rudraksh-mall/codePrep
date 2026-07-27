const { Pinecone } = require("@pinecone-database/pinecone");
const { PineconeStore } = require("@langchain/pinecone");
const { pineconeApiKey } = require("./env");

const INDEX_NAME = "codeprep";

function getPineconeClient() {
  if (!pineconeApiKey) return null;
  return new Pinecone({ apiKey: pineconeApiKey });
}

async function waitForIndex(client) {
  for (let i = 0; i < 30; i++) {
    const desc = await client.describeIndex(INDEX_NAME);
    if (desc.status?.ready) {
      console.log(`Pinecone index "${INDEX_NAME}" is ready`);
      return;
    }
    console.log(`Waiting for index "${INDEX_NAME}" to be ready... (${i + 1}s)`);
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Index "${INDEX_NAME}" did not become ready in time`);
}

async function getPineconeIndex() {
  const client = getPineconeClient();
  if (!client) return null;
  if (
    !(await client.listIndexes()).indexes?.some((i) => i.name === INDEX_NAME)
  ) {
    await client.createIndex({
      name: INDEX_NAME,
      dimension: 1536,
      metric: "cosine",
      spec: { serverless: { cloud: "aws", region: "us-east-1" } },
    });
    console.log(`Created Pinecone index "${INDEX_NAME}"`);
    await waitForIndex(client);
  }
  return client.Index(INDEX_NAME);
}

async function createVectorStore(embeddings) {
  const index = await getPineconeIndex();
  if (!index) return null;
  return new PineconeStore(embeddings, { pineconeIndex: index });
}

async function deleteAllVectors() {
  const index = await getPineconeIndex();
  if (!index) return;
  try {
    await index.deleteAll();
  } catch {
    console.log("No existing vectors to delete");
  }
}

module.exports = {
  getPineconeClient,
  getPineconeIndex,
  createVectorStore,
  deleteAllVectors,
  INDEX_NAME,
};
