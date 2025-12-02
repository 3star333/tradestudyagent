# 🚀 Tavily Research Integration - Quick Reference

## ✅ What's Done

1. ✅ **Installed Tavily SDK** (`@tavily/core`)
2. ✅ **Created research tools** (`lib/agent/research-tools.ts`)
   - `webSearchTool` - Web search with Tavily
   - `fetchWebContentTool` - Extract content from URLs
   - `researchContextTool` - High-level research orchestrator
3. ✅ **Built research orchestrator** (`lib/agent/research-orchestrator.ts`)
   - 4 new agent goals for research workflows
4. ✅ **API endpoint** (`/api/trade-studies/[id]/research-agent`)
5. ✅ **Documentation** (`TAVILY_SETUP.md`, `RESEARCH_AGENT_GUIDE.md`)
6. ✅ **Test script** (`scripts/test-research.ts`)

## 🎯 Next Steps

### 1. Get Tavily API Key (5 minutes)

```bash
# 1. Go to https://tavily.com/
# 2. Sign up (free tier: 1,000 calls/month)
# 3. Copy your API key
# 4. Add to .env.local:
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxxxxxx
```

### 2. Test Locally

```bash
# Restart your dev server
npm run dev

# Test the research endpoint (in another terminal):
curl -X POST http://localhost:3000/api/trade-studies/YOUR_STUDY_ID/research-agent \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "research_topic",
    "researchParams": {
      "topic": "Cloud provider comparison AWS vs Azure",
      "depth": "standard"
    }
  }'
```

### 3. Deploy to Vercel

```bash
# Add TAVILY_API_KEY to Vercel:
# 1. Go to Vercel dashboard
# 2. Settings → Environment Variables
# 3. Add: TAVILY_API_KEY = tvly-xxx...
# 4. Redeploy
```

---

## 📖 Usage Examples

### Research a Topic
```typescript
POST /api/trade-studies/:id/research-agent
{
  "goal": "research_topic",
  "researchParams": {
    "topic": "Benefits of GraphQL over REST",
    "depth": "standard"  // "quick" | "standard" | "deep"
  }
}
```

### Enrich Study with Research
```typescript
POST /api/trade-studies/:id/research-agent
{
  "goal": "enrich_with_research",
  "researchParams": {
    "topic": "Latest database performance benchmarks",
    "depth": "deep",
    "sources": ["https://specific-benchmark.com"]  // optional
  },
  "extraContext": "Focus on write performance"
}
```

### Validate Assumptions
```typescript
POST /api/trade-studies/:id/research-agent
{
  "goal": "validate_assumptions"
}
```

### Full Workflow
```typescript
POST /api/trade-studies/:id/research-agent
{
  "goal": "full_workflow",
  "researchParams": {
    "topic": "Serverless vs Kubernetes cost comparison",
    "depth": "deep"
  },
  "publishTargets": {
    "doc": true,
    "drive": true
  }
}
```

---

## 🎨 Response Format

```json
{
  "success": true,
  "study": { /* TradeStudyRecord */ },
  "researchFindings": {
    "topic": "Cloud provider comparison",
    "summary": "Research shows AWS leads in market share...",
    "keyFindings": [
      "AWS: 32% market share, strongest in compute",
      "Azure: 23% market share, best for enterprise",
      "GCP: 11% market share, superior ML tools"
    ],
    "sources": [
      {
        "title": "Cloud Market Report 2025",
        "url": "https://...",
        "relevance": "Comprehensive market analysis"
      }
    ],
    "confidence": "high"
  },
  "analysis": { /* GPT-4 analysis */ },
  "steps": [
    { "tool": "load_trade_study", "status": "ok", "message": "..." },
    { "tool": "research_context", "status": "ok", "message": "..." }
  ]
}
```

---

## 🔧 Configuration

### Search Depths
- **`quick`**: 3 results, basic search (~1-2 seconds)
- **`standard`**: 5 results, basic search (~2-3 seconds)
- **`deep`**: 10 results, advanced search (~3-5 seconds)

### API Limits (Free Tier)
- 1,000 calls/month
- ~33 calls/day
- Perfect for development

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "TAVILY_API_KEY not set" | Add key to `.env.local` and restart server |
| "Search failed: 401" | Check API key is correct |
| "Search failed: 429" | Rate limit exceeded, upgrade plan |
| No results | Query too specific, try broader terms |

---

## 📊 What Makes Tavily Special

Compared to regular search APIs:

| Feature | Tavily | Google Search | Bing |
|---------|--------|--------------|------|
| AI-optimized results | ✅ | ❌ | ❌ |
| Built-in answer extraction | ✅ | ❌ | ❌ |
| Source credibility scoring | ✅ | ❌ | ❌ |
| Agent-friendly format | ✅ | ❌ | ❌ |
| No setup complexity | ✅ | ❌ | ❌ |

---

## 🎯 Quick Commands

```bash
# Install dependencies
npm install @tavily/core

# Test research locally
npx tsx scripts/test-research.ts

# Restart dev server
npm run dev

# Check API key is loaded
node -e "require('dotenv').config({path:'.env.local'}); console.log(process.env.TAVILY_API_KEY ? '✅ Key loaded' : '❌ Key missing')"
```

---

## 📚 Resources

- **Tavily Dashboard**: https://app.tavily.com/
- **API Docs**: https://docs.tavily.com/
- **Your Code**: 
  - Tools: `lib/agent/research-tools.ts`
  - Orchestrator: `lib/agent/research-orchestrator.ts`
  - API: `app/api/trade-studies/[id]/research-agent/route.ts`

---

## 💡 Pro Tips

1. **Cache results**: Store research in trade study data to avoid repeated API calls
2. **Use `quick` depth** for real-time UI, `deep` for background jobs
3. **Combine with GPT-4**: Research provides facts, GPT-4 provides analysis
4. **Rate limit wisely**: Use research for important queries, not every action
5. **Validate sources**: Always check credibility scores and URLs

---

## ✨ What's Next?

- [ ] Get Tavily API key
- [ ] Test research endpoint
- [ ] Add research UI to agent runner
- [ ] Deploy to Vercel
- [ ] Monitor API usage in Tavily dashboard

**You're ready to build an AI agent that researches the web!** 🎉
