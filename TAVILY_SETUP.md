# Setting Up Tavily for Research

## Quick Start

Tavily is now integrated! Follow these steps to enable real research capabilities:

### Step 1: Get Your Tavily API Key

1. Go to **https://tavily.com/**
2. Click **"Get Started"** or **"Sign Up"**
3. Create an account (free tier available)
4. Go to your dashboard
5. Copy your **API Key**

### Step 2: Add API Key to Your Environment

Open `.env.local` and replace the placeholder:

```bash
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxxxxxx
```

**Important:** Also add this to:
- `.env` (for Prisma compatibility)
- **Vercel Environment Variables** (for production)

### Step 3: Restart Your Dev Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### Step 4: Test It!

Now you can use research-enabled agent goals:

```bash
POST http://localhost:3000/api/trade-studies/YOUR_STUDY_ID/research-agent
Content-Type: application/json

{
  "goal": "enrich_with_research",
  "researchParams": {
    "topic": "Latest GPU benchmarks for ML workloads",
    "depth": "standard"
  }
}
```

---

## Tavily Features

Tavily is specifically designed for AI agents and provides:

- ✅ **AI-optimized results** - Pre-processed for LLM consumption
- ✅ **Answer extraction** - Direct answers to queries
- ✅ **Source credibility** - Scored and ranked sources
- ✅ **Fast performance** - Optimized for real-time applications
- ✅ **Context preservation** - Maintains semantic meaning

---

## Pricing

**Free Tier:**
- 1,000 API calls/month
- Basic search depth
- Perfect for development and testing

**Pro Tier ($49/month):**
- 10,000 API calls/month
- Advanced search depth
- Priority support

---

## Research Agent Goals

Once your API key is set up, you can use these goals:

### 1. Research a Topic
```json
{
  "goal": "research_topic",
  "researchParams": {
    "topic": "Benefits of microservices architecture",
    "depth": "standard"
  }
}
```

### 2. Enrich with Research
```json
{
  "goal": "enrich_with_research",
  "researchParams": {
    "topic": "Cloud provider pricing comparison 2025",
    "depth": "deep"
  }
}
```

### 3. Validate Assumptions
```json
{
  "goal": "validate_assumptions"
}
```

### 4. Full Workflow
```json
{
  "goal": "full_workflow",
  "researchParams": {
    "topic": "Kubernetes vs Docker Swarm performance",
    "depth": "deep"
  },
  "publishTargets": {
    "doc": true,
    "drive": true
  }
}
```

---

## Search Depths

- **`quick`** (3 results, basic search) - Fast, surface-level research
- **`standard`** (5 results, basic search) - Balanced speed and depth
- **`deep`** (10 results, advanced search) - Comprehensive research with more context

---

## Example Response

```json
{
  "success": true,
  "study": { ... },
  "researchFindings": {
    "topic": "Latest GPU benchmarks",
    "summary": "Based on recent benchmarks, NVIDIA H100 leads in training performance...",
    "keyFindings": [
      "H100 achieves 2.5x speedup over A100",
      "AMD MI300X shows competitive pricing",
      "Memory bandwidth is the key bottleneck"
    ],
    "sources": [
      {
        "title": "GPU Benchmark Results 2025",
        "url": "https://...",
        "relevance": "Comprehensive comparison of latest GPUs"
      }
    ],
    "confidence": "high"
  },
  "steps": [
    { "tool": "load_trade_study", "status": "ok", "message": "..." },
    { "tool": "research_context", "status": "ok", "message": "..." },
    { "tool": "analyze_with_llm", "status": "ok", "message": "..." }
  ]
}
```

---

## Troubleshooting

### "TAVILY_API_KEY not set"
- Make sure you added the key to `.env.local`
- Restart your dev server after adding the key
- Check that there are no extra spaces or quotes

### "Search failed: API rate limit"
- You've exceeded your monthly quota
- Upgrade to a paid tier or wait until next month
- Use `depth: "quick"` to reduce API calls

### "Search results are empty"
- Query might be too specific or unusual
- Try broader search terms
- Check Tavily dashboard for API status

---

## Next Steps

1. ✅ Get Tavily API key
2. ✅ Add to `.env.local`
3. ✅ Restart dev server
4. Test research endpoint
5. Add research UI to the agent runner component
6. Deploy to Vercel with `TAVILY_API_KEY` env var

---

## Resources

- **Tavily Docs**: https://docs.tavily.com/
- **API Reference**: https://docs.tavily.com/api-reference
- **Pricing**: https://tavily.com/pricing
- **Dashboard**: https://app.tavily.com/

---

## Files Created

- `lib/agent/research-tools.ts` - Tavily integration
- `lib/agent/research-orchestrator.ts` - Research workflows
- `app/api/trade-studies/[id]/research-agent/route.ts` - API endpoint
- `RESEARCH_AGENT_GUIDE.md` - Complete documentation
- `TAVILY_SETUP.md` - This file

Enjoy your research-powered AI agent! 🚀
