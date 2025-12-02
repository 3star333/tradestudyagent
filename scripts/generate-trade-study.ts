#!/usr/bin/env ts-node
import { generateTradeStudy } from "../lib/tradeStudyGenerator";

async function main() {
  const topic = process.argv.slice(2).join(" ") || "Select a vector database for AI memory";
  const userId = process.env.DEMO_USER_ID || "demo-user";
  const result = await generateTradeStudy(userId, { topic, depth: "quick", generateArtifacts: false });
  console.log("Generated study:");
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
