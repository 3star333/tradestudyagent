import { z } from "zod";
import { tavily } from "@tavily/core";

/**
 * Research tools for the trade study agent
 * These tools can gather external information to enrich trade studies
 */

// Initialize Tavily client
const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY || "" });

// ==================== Web Search Tool ====================
export const webSearchSchema = z.object({
  query: z.string().describe("The search query"),
  maxResults: z.number().optional().default(5).describe("Maximum number of results to return"),
  searchDepth: z.enum(["basic", "advanced"]).optional().default("basic").describe("Search depth")
});

export async function webSearchTool(
  input: z.infer<typeof webSearchSchema>
): Promise<{ results: Array<{ title: string; url: string; snippet: string; content?: string }> }> {
  if (!process.env.TAVILY_API_KEY) {
    console.warn("[Research] TAVILY_API_KEY not set, returning mock results");
    return {
      results: [
        {
          title: "Research result (API key required)",
          url: "https://tavily.com",
          snippet: `Set TAVILY_API_KEY in .env.local to enable real search. Get your key at https://tavily.com/`
        }
      ]
    };
  }

  console.log(`[Research] Searching with Tavily: ${input.query}`);
  
  try {
    const response = await tavilyClient.search(input.query, {
      max_results: input.maxResults,
      search_depth: input.searchDepth,
      include_answer: true,
      include_raw_content: false
    });

    return {
      results: response.results.map((result: any) => ({
        title: result.title,
        url: result.url,
        snippet: result.content,
        content: result.content
      }))
    };
  } catch (error) {
    console.error("[Research] Tavily search error:", error);
    throw new Error(`Search failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// ==================== Fetch Web Content Tool ====================
export const fetchWebContentSchema = z.object({
  url: z.string().url().describe("The URL to fetch content from"),
  extractText: z.boolean().optional().default(true).describe("Whether to extract plain text")
});

export async function fetchWebContentTool(
  input: z.infer<typeof fetchWebContentSchema>
): Promise<{ content: string; metadata: { title?: string; description?: string } }> {
  // TODO: Integrate with a web scraping service or MCP server
  console.log(`[Research] Fetching content from: ${input.url}`);
  
  // You can use:
  // 1. Cheerio for HTML parsing
  // 2. Puppeteer for dynamic content
  // 3. Fetch MCP Server
  // 4. Jina AI Reader API: https://jina.ai/reader
  
  try {
    const response = await fetch(input.url);
    const html = await response.text();
    
    // Basic HTML to text extraction (simplified)
    const textContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 5000); // Limit to 5000 chars
    
    return {
      content: textContent,
      metadata: {
        title: html.match(/<title>(.*?)<\/title>/i)?.[1] || "Unknown",
        description: html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i)?.[1]
      }
    };
  } catch (error) {
    throw new Error(`Failed to fetch ${input.url}: ${error}`);
  }
}

// ==================== Research Context Tool ====================
export const researchContextSchema = z.object({
  topic: z.string().describe("The topic to research"),
  sources: z.array(z.string().url()).optional().describe("Specific URLs to include in research"),
  depth: z.enum(["quick", "standard", "deep"]).optional().default("standard").describe("Research depth")
});

export type ResearchResult = {
  topic: string;
  summary: string;
  keyFindings: string[];
  sources: Array<{ title: string; url: string; relevance: string }>;
  confidence: "low" | "medium" | "high";
};

export async function researchContextTool(
  input: z.infer<typeof researchContextSchema>
): Promise<ResearchResult> {
  console.log(`[Research] Researching topic: ${input.topic} (depth: ${input.depth})`);
  
  // This would orchestrate multiple research steps:
  // 1. Web search for the topic
  // 2. Fetch and parse relevant URLs
  // 3. Extract key information
  // 4. Synthesize findings with LLM
  
  const searchResults = await webSearchTool({ 
    query: input.topic, 
    maxResults: input.depth === "quick" ? 3 : input.depth === "standard" ? 5 : 10,
    searchDepth: input.depth === "deep" ? "advanced" : "basic"
  });
  
  // Fetch content from top results
  const sources = await Promise.all(
    searchResults.results.slice(0, 3).map(async (result) => {
      try {
        const content = await fetchWebContentTool({ url: result.url, extractText: true });
        return {
          title: result.title,
          url: result.url,
          relevance: result.snippet,
          content: content.content.slice(0, 1000) // First 1000 chars
        };
      } catch {
        return null;
      }
    })
  ).then(results => results.filter(Boolean));
  
  // In a full implementation, you'd use the LLM to synthesize this information
  return {
    topic: input.topic,
    summary: `Research on "${input.topic}" (depth: ${input.depth}). Found ${sources.length} relevant sources.`,
    keyFindings: [
      "Finding 1 (would be extracted from sources)",
      "Finding 2 (would be extracted from sources)",
      "Finding 3 (would be extracted from sources)"
    ],
    sources: sources.map(s => ({
      title: s?.title || "Unknown",
      url: s?.url || "",
      relevance: s?.relevance || ""
    })),
    confidence: sources.length >= 3 ? "high" : sources.length >= 2 ? "medium" : "low"
  };
}

// ==================== Export All Research Tools ====================
export const researchTools = {
  webSearch: { schema: webSearchSchema, execute: webSearchTool },
  fetchWebContent: { schema: fetchWebContentSchema, execute: fetchWebContentTool },
  researchContext: { schema: researchContextSchema, execute: researchContextTool }
};
