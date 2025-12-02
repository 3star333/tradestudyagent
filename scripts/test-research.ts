/**
 * Test script for Tavily research integration
 * Run with: npx tsx scripts/test-research.ts
 */

import { webSearchTool, researchContextTool } from "../lib/agent/research-tools";

async function testTavilyIntegration() {
  console.log("🔬 Testing Tavily Research Integration\n");
  console.log("=" .repeat(60));

  // Test 1: Simple web search
  console.log("\n📍 Test 1: Web Search");
  console.log("-".repeat(60));
  try {
    const searchResults = await webSearchTool({
      query: "latest GPU benchmarks for machine learning 2025",
      maxResults: 3,
      searchDepth: "basic"
    });

    console.log(`✅ Found ${searchResults.results.length} results\n`);
    searchResults.results.forEach((result, i) => {
      console.log(`${i + 1}. ${result.title}`);
      console.log(`   URL: ${result.url}`);
      console.log(`   Snippet: ${result.snippet.slice(0, 150)}...`);
      console.log();
    });
  } catch (error) {
    console.error("❌ Search failed:", error);
  }

  // Test 2: Research context (comprehensive)
  console.log("\n📍 Test 2: Research Context");
  console.log("-".repeat(60));
  try {
    const research = await researchContextTool({
      topic: "Benefits of Kubernetes over Docker Swarm",
      depth: "standard"
    });

    console.log(`✅ Research completed with ${research.confidence} confidence\n`);
    console.log(`Topic: ${research.topic}`);
    console.log(`\nSummary:\n${research.summary}`);
    console.log(`\nKey Findings:`);
    research.keyFindings.forEach((finding, i) => {
      console.log(`  ${i + 1}. ${finding}`);
    });
    console.log(`\nSources:`);
    research.sources.forEach((source, i) => {
      console.log(`  ${i + 1}. ${source.title}`);
      console.log(`     ${source.url}`);
    });
  } catch (error) {
    console.error("❌ Research failed:", error);
  }

  console.log("\n" + "=".repeat(60));
  console.log("🎉 Testing complete!\n");
  
  if (!process.env.TAVILY_API_KEY || process.env.TAVILY_API_KEY === "your_tavily_api_key_here") {
    console.log("⚠️  Note: Set TAVILY_API_KEY in .env.local for real results");
    console.log("   Get your key at: https://tavily.com/\n");
  }
}

// Run the test
testTavilyIntegration().catch(console.error);
