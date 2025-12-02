# Research-Enabled AI Agent

## Overview

The trade study agent now supports **research capabilities** to gather external information and enrich your trade studies with real-world data.

## Current vs. Enhanced Agent

### Current Agent (Basic)
- ✅ Analyzes existing trade study data
- ✅ Scores options based on provided information
- ✅ Identifies gaps in existing data
- ❌ Cannot research new information

### Enhanced Agent (With Research)
- ✅ Everything the basic agent does
- ✅ **Web search** for relevant information
- ✅ **Fetch and parse** web content
- ✅ **Research specific topics** in depth
- ✅ **Validate assumptions** with external sources
- ✅ **Enrich studies** with real-world data

---

## Research Tools

### 1. Web Search Tool
Search the web for information on a topic.

```typescript
const results = await webSearchTool({
  query: "lithium-ion vs solid-state batteries",
  maxResults: 5
});
```

**Returns:**
```typescript
{
  results: [
    {
      title: "Battery Technology Comparison",
      url: "https://example.com/batteries",
      snippet: "Key differences between lithium-ion and solid-state..."
    }
  ]
}
```

### 2. Fetch Web Content Tool
Extract content from a specific URL.

```typescript
const content = await fetchWebContentTool({
  url: "https://example.com/article",
  extractText: true
});
```

**Returns:**
```typescript
{
  content: "Full text content of the page...",
  metadata: {
    title: "Article Title",
    description: "Article description"
  }
}
```

### 3. Research Context Tool
High-level research that combines search + content fetching + synthesis.

```typescript
const research = await researchContextTool({
  topic: "Benefits of microservices architecture",
  depth: "standard", // "quick" | "standard" | "deep"
  sources: ["https://specific-source.com"] // optional
});
```

**Returns:**
```typescript
{
  topic: "Benefits of microservices architecture",
  summary: "Comprehensive summary of findings...",
  keyFindings: [
    "Finding 1...",
    "Finding 2...",
    "Finding 3..."
  ],
  sources: [
    {
      title: "Source Title",
      url: "https://...",
      relevance: "Why this source is relevant"
    }
  ],
  confidence: "high" // "low" | "medium" | "high"
}
```

---

## Research Agent Goals

The research orchestrator supports these new goals:

### 1. `research_topic`
Research a specific topic without modifying the trade study.

```typescript
const result = await runResearchAgent({
  tradeStudyId: "123",
  goal: "research_topic",
  researchParams: {
    topic: "Cloud provider pricing models",
    depth: "standard"
  }
});
```

### 2. `enrich_with_research`
Research a topic and update the trade study with findings.

```typescript
const result = await runResearchAgent({
  tradeStudyId: "123",
  goal: "enrich_with_research",
  researchParams: {
    topic: "Latest GPU performance benchmarks",
    depth: "deep",
    sources: ["https://benchmark-site.com"] // optional
  }
});
```

**What it does:**
1. 🔍 Searches for information on the topic
2. 📄 Fetches content from top sources
3. 🤖 Analyzes findings with GPT-4
4. 💾 Updates the trade study with enriched data

### 3. `validate_assumptions`
Validate assumptions in your trade study with external research.

```typescript
const result = await runResearchAgent({
  tradeStudyId: "123",
  goal: "validate_assumptions"
});
```

**What it does:**
1. 📋 Extracts assumptions from study data
2. 🔍 Researches each assumption
3. ✅ Provides validation results with sources

### 4. `full_workflow`
Research → Analyze → Update → Publish (optional)

```typescript
const result = await runResearchAgent({
  tradeStudyId: "123",
  goal: "full_workflow",
  researchParams: {
    topic: "Best practices for API design",
    depth: "deep"
  },
  publishTargets: {
    doc: true,
    drive: true
  }
});
```

---

## Integrating External MCP Servers

To enable real research capabilities, integrate with these APIs:

### Option 1: Brave Search API (Recommended)
Fast, privacy-focused search.

```bash
# Get API key from: https://brave.com/search/api/
npm install brave-search
```

**Update `research-tools.ts`:**
```typescript
import BraveSearch from 'brave-search';

const brave = new BraveSearch(process.env.BRAVE_API_KEY);

export async function webSearchTool(input) {
  const results = await brave.search(input.query, {
    count: input.maxResults
  });
  
  return {
    results: results.web.results.map(r => ({
      title: r.title,
      url: r.url,
      snippet: r.description
    }))
  };
}
```

### Option 2: Tavily Search API
AI-optimized search results.

```bash
# Get API key from: https://tavily.com/
npm install @tavily/core
```

### Option 3: Jina AI Reader
Convert any URL to LLM-friendly markdown.

```typescript
export async function fetchWebContentTool(input) {
  const response = await fetch(`https://r.jina.ai/${input.url}`);
  const content = await response.text();
  
  return {
    content,
    metadata: { title: "Extracted content" }
  };
}
```

**No API key needed!** Just prepend `https://r.jina.ai/` to any URL.

### Option 4: Use MCP Servers Directly

Install community MCP servers:

```bash
# Brave Search MCP
npm install @modelcontextprotocol/server-brave-search

# Fetch MCP
npm install @modelcontextprotocol/server-fetch

# Filesystem MCP (for local documents)
npm install @modelcontextprotocol/server-filesystem
```

---

## Example: Full Research Workflow

```typescript
// 1. Create a trade study
const study = await createTradeStudy({
  title: "Cloud Provider Comparison",
  summary: "Compare AWS, Azure, and GCP for our use case"
});

// 2. Run research agent with full workflow
const result = await runResearchAgent({
  tradeStudyId: study.id,
  goal: "full_workflow",
  researchParams: {
    topic: "AWS vs Azure vs GCP pricing and performance 2025",
    depth: "deep",
    sources: [
      "https://aws.amazon.com/pricing",
      "https://azure.microsoft.com/pricing",
      "https://cloud.google.com/pricing"
    ]
  },
  extraContext: "Focus on compute and storage costs for ML workloads",
  publishTargets: {
    doc: true,
    sheet: true
  }
});

// 3. Check results
console.log(result.researchFindings);
// {
//   topic: "AWS vs Azure vs GCP...",
//   summary: "Research found...",
//   keyFindings: ["AWS is 20% cheaper for...", "Azure has better..."],
//   sources: [...]
// }

console.log(result.analysis);
// {
//   summary: "Based on research, GCP is the best option because...",
//   findings: [...],
//   recommendations: [...]
// }
```

---

## API Endpoint Usage

### Basic Endpoint (No Research)
```bash
POST /api/trade-studies/:id/agent
{
  "goal": "summarize",
  "extraContext": "Focus on cost"
}
```

### Research Endpoint (New)
```bash
POST /api/trade-studies/:id/research-agent
{
  "goal": "enrich_with_research",
  "researchParams": {
    "topic": "Latest database benchmarks",
    "depth": "deep"
  }
}
```

---

## Next Steps

1. **Choose a search API** (Brave, Tavily, or Jina)
2. **Add API key** to `.env.local`
3. **Update `research-tools.ts`** with real implementations
4. **Create research agent API endpoint**
5. **Add research UI** to the agent runner component

---

## Environment Variables

Add to `.env.local`:

```bash
# Research APIs (choose one or more)
BRAVE_API_KEY=your_brave_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here

# Optional: Custom search endpoint
CUSTOM_SEARCH_ENDPOINT=https://your-search-api.com
```

---

## Benefits

- **Real-time information**: Get the latest data, not outdated knowledge
- **Source verification**: All findings include source URLs
- **Assumption validation**: Verify your assumptions with real data
- **Automated research**: Save hours of manual research time
- **Better decisions**: Make informed trade-offs with comprehensive data

---

## Limitations & Future Improvements

**Current Limitations:**
- ⚠️ Web search uses stubs (needs API integration)
- ⚠️ Basic HTML parsing (upgrade to Cheerio/Puppeteer)
- ⚠️ No rate limiting on API calls
- ⚠️ Fixed research depth (quick/standard/deep)

**Future Improvements:**
- [ ] Advanced web scraping with Puppeteer
- [ ] PDF and document parsing
- [ ] Knowledge graph for context tracking
- [ ] Cached research results
- [ ] Custom research strategies
- [ ] Multi-language support
- [ ] Image and chart analysis

---

## Questions?

- Check the code: `lib/agent/research-tools.ts`
- See orchestrator: `lib/agent/research-orchestrator.ts`
- API reference: `/api/trade-studies/:id/research-agent`
