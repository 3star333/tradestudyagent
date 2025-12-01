# Quick Reference Card 📇

## 🚀 Getting Started

### Quick Setup (Automated)

```bash
# Run setup script
bash setup.sh

# Edit .env.local with your API keys
nano .env.local

# Start server
npm run dev
```

### Manual Setup (3 Steps)

```bash
# 1. Install
npm install

# 2. Configure (minimum)
echo 'OPENAI_API_KEY=sk-your-key-here' >> .env.local

# 3. Run
npm run dev
```

**For detailed database & OAuth setup:** See [DATABASE_OAUTH_SETUP.md](./DATABASE_OAUTH_SETUP.md)

## 🎯 Agent Goals

| Goal | Command | What It Does |
|------|---------|--------------|
| `analyze` | UI or API | Identifies gaps, missing requirements, improvements |
| `summarize` | UI or API | Generates high-level overview of the study |
| `score` | UI or API | Evaluates each option against defined criteria |
| `publish` | UI or API | Exports to Google Docs/Sheets/Slides (stub) |
| `full_workflow` | UI or API | Complete: analyze → score → draft → publish |

## 📂 Key Files

```
lib/
  agent/
    tools.ts           ← 4 MCP-style tools (load, update, analyze, publish)
    orchestrator.ts    ← Workflow coordinator
  openai.ts            ← OpenAI GPT-4 integration
  google.ts            ← Google APIs (stubbed)
  studies.ts           ← Database layer (Prisma)

app/api/trade-studies/[id]/agent/route.ts  ← Agent API endpoint

components/trade-studies/agent-runner.tsx   ← UI component
```

## 🔧 Environment Variables

### Required
```env
OPENAI_API_KEY=sk-...                    # Get from platform.openai.com
NEXTAUTH_SECRET=your-secret              # openssl rand -base64 32
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=...
```

### Optional
```env
DATABASE_URL=postgresql://...            # Falls back to demo data
GOOGLE_SERVICE_ACCOUNT_KEY={}            # For real Google API publishing
GOOGLE_DRIVE_FOLDER_ID=...               # Target folder for exports
```

## 🛠️ Common Tasks

### Test Agent Locally
```bash
npm run dev
# Visit http://localhost:3000
# Sign in → Dashboard → Create/Open Study → Run Agent
```

### Call Agent API Directly
```bash
curl -X POST http://localhost:3000/api/trade-studies/STUDY_ID/agent \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{"goal":"analyze"}'
```

### Add a New Tool
1. Edit `lib/agent/tools.ts`:
   ```typescript
   export const myToolSchema = z.object({ ... });
   export async function myToolExecute(input) { ... }
   export const tools = { ...existing, myTool: {...} };
   ```
2. Use in `lib/agent/orchestrator.ts`:
   ```typescript
   case "my_goal": {
     await tools.myTool.execute({ ... });
   }
   ```
3. Add to UI in `components/trade-studies/agent-runner.tsx`

### Change LLM Provider
Edit `lib/openai.ts` → replace OpenAI client with Anthropic, Gemini, etc.

### Enable Real Google Publishing
1. `npm install googleapis`
2. Get service account JSON from Google Cloud
3. Set `GOOGLE_SERVICE_ACCOUNT_KEY` in `.env.local`
4. Replace stubs in `lib/google.ts` with real API calls

### Deploy to Vercel
```bash
git push origin main
# In Vercel dashboard:
# - Import repo
# - Add all env vars from .env.local
# - Deploy
# - Run: npx prisma migrate deploy
```

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "OPENAI_API_KEY not set" | Add key to `.env.local`, restart server |
| "Trade study not found" | Create a study via UI first, or set DATABASE_URL |
| "Unauthorized" on API | Sign in via Google OAuth |
| Build errors | `npm run build` to see details |
| Agent returns stubs | Check API key is valid, check network |

## 📊 Agent Response Structure

```typescript
{
  success: boolean;
  study: TradeStudyRecord | null;
  analysis?: {
    summary: string;
    recommendations: string[];
    nextSteps: string[];
    updatedData?: Record<string, unknown>;
  };
  publishResults?: Array<{
    target: string;
    status: "ok" | "error" | "skipped";
    message: string;
  }>;
  steps: Array<{
    tool: string;
    status: "ok" | "error" | "skipped";
    message: string;
  }>;
  error?: string;
}
```

## 🔗 Useful Links

- **Full Setup Guide**: [AGENT_SETUP.md](./AGENT_SETUP.md)
- **Implementation Details**: [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
- **Project Overview**: [README.md](./README.md)
- **OpenAI API Docs**: https://platform.openai.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs

## 💡 Pro Tips

1. **Start simple**: Test with "analyze" goal first
2. **Check steps**: UI shows each tool execution - useful for debugging
3. **Customize prompts**: Edit `lib/openai.ts` for domain-specific language
4. **Use demo data**: Skip DATABASE_URL for quick local testing
5. **Read AGENT_SETUP.md**: 400+ lines of detailed guidance

## 🎯 Next Level

- [ ] Add streaming responses (Vercel AI SDK)
- [ ] Enable real Google publishing (googleapis)
- [ ] Build standalone MCP server (for Claude Desktop)
- [ ] Add vector search (Pinecone/pgvector)
- [ ] Implement multi-agent workflows (LangGraph)
- [ ] Add human-in-the-loop approval steps
- [ ] Create custom scoring algorithms
- [ ] Export to PDF/Markdown

---

**Ready to build?** → `npm run dev` and visit http://localhost:3000 🚀
