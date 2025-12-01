# Trade Study Agent Setup Guide

This guide walks you through setting up the MCP-style AI agent for trade studies.

## What You Just Built

You now have an **in-app agent** using MCP-style architecture:

- **Model**: OpenAI GPT-4 for structured analysis
- **Tools**: Load, update, analyze, and publish trade studies
- **Orchestrator**: Coordinates tool execution based on goals
- **API**: Single endpoint at `/api/trade-studies/[id]/agent`
- **UI**: AgentRunner component with live feedback

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js App Router                      │
├─────────────────────────────────────────────────────────────┤
│  UI Layer: AgentRunner Component (client)                   │
│    ↓ POST /api/trade-studies/:id/agent                      │
├─────────────────────────────────────────────────────────────┤
│  API Layer: app/api/trade-studies/[id]/agent/route.ts       │
│    ↓ calls runAgent()                                        │
├─────────────────────────────────────────────────────────────┤
│  Orchestrator: lib/agent/orchestrator.ts                    │
│    ↓ coordinates tool execution                             │
├─────────────────────────────────────────────────────────────┤
│  Tools: lib/agent/tools.ts                                  │
│    • load_trade_study                                        │
│    • update_trade_study                                      │
│    • analyze_with_llm → OpenAI GPT-4                        │
│    • publish_to_google → Docs/Sheets/Slides/Drive           │
├─────────────────────────────────────────────────────────────┤
│  Services:                                                   │
│    • lib/openai.ts (OpenAI SDK)                             │
│    • lib/google.ts (Google APIs - stubbed)                  │
│    • lib/studies.ts (Prisma DB layer)                       │
└─────────────────────────────────────────────────────────────┘
```

## Setup Steps

### 1. Environment Configuration

Create `.env.local` in the project root:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your OpenAI API key:

```env
# OpenAI (REQUIRED for agent)
OPENAI_API_KEY=sk-proj-...

# NextAuth (REQUIRED)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here-generate-with-openssl-rand-base64-32

# Google OAuth (REQUIRED for auth)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database (REQUIRED for persistence)
DATABASE_URL=postgresql://user:password@localhost:5432/trade_study_agent

# Google APIs (OPTIONAL - for publishing)
GOOGLE_SERVICE_ACCOUNT_KEY="{}"
GOOGLE_DRIVE_FOLDER_ID=optional-folder-id
```

### 2. Database Setup

If you don't have PostgreSQL yet, install it:

```bash
# macOS with Homebrew
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb trade_study_agent
```

Set `DATABASE_URL` in `.env.local`, then run migrations:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable APIs:
   - Google+ API
   - Google Drive API
   - Google Docs API
   - Google Sheets API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. Copy Client ID and Secret to `.env.local`

### 4. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Using the Agent

### Via UI

1. Sign in with Google
2. Navigate to Dashboard → Create or open a trade study
3. Scroll to the "AI Agent" card
4. Select a goal:
   - **Analyze**: Identify gaps and improvements
   - **Summarize**: Generate high-level summary
   - **Score Options**: Evaluate options against criteria
   - **Publish**: Export to Google services (stub)
   - **Full Workflow**: Complete analysis + proposal
5. Click "Run Agent"
6. View execution steps and analysis results

### Via API

```bash
curl -X POST http://localhost:3000/api/trade-studies/YOUR_STUDY_ID/agent \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  -d '{
    "goal": "analyze",
    "extraContext": "Focus on cost and scalability"
  }'
```

## Agent Goals Explained

| Goal | Description | What It Does |
|------|-------------|--------------|
| `analyze` | Identify gaps | Finds missing requirements, unclear criteria, options to consider |
| `summarize` | Generate summary | Creates clear overview of study, requirements, and options |
| `score` | Score options | Evaluates each option against criteria with ratings |
| `publish` | Export to Google | Pushes artifacts to Docs/Sheets/Slides/Drive (currently stubbed) |
| `full_workflow` | Complete analysis | Drafts proposal, updates status to "in_review", optionally publishes |

## MCP-Style Tools

Your agent has 4 tools (defined in `lib/agent/tools.ts`):

### 1. `load_trade_study`
```typescript
Input: { tradeStudyId: string }
Output: TradeStudyRecord (with attachments)
```

### 2. `update_trade_study`
```typescript
Input: { 
  tradeStudyId: string;
  title?: string;
  summary?: string;
  status?: "draft" | "in_review" | "published" | "archived";
  data?: Record<string, unknown>;
}
Output: Updated TradeStudyRecord
```

### 3. `analyze_with_llm`
```typescript
Input: {
  tradeStudyId: string;
  goal: "summarize" | "score" | "draft_proposal" | "identify_gaps";
  extraContext?: string;
}
Output: {
  summary: string;
  recommendations: string[];
  nextSteps: string[];
  updatedData?: Record<string, unknown>;
}
```

### 4. `publish_to_google`
```typescript
Input: {
  tradeStudyId: string;
  targets: {
    doc?: boolean;
    sheet?: boolean;
    slides?: boolean;
    drive?: boolean;
  }
}
Output: PublishResult[]
```

## Extending the Agent

### Add a New Tool

1. **Define schema and function in `lib/agent/tools.ts`:**

```typescript
export const myNewToolSchema = z.object({
  tradeStudyId: z.string(),
  someParam: z.string()
});

export async function myNewToolExecute(
  input: z.infer<typeof myNewToolSchema>
) {
  // Your implementation
  return { status: "ok", data: {} };
}

// Add to tools registry
export const tools = {
  // ...existing tools,
  myNewTool: {
    name: "my_new_tool",
    description: "What this tool does",
    schema: myNewToolSchema,
    execute: myNewToolExecute
  }
};
```

2. **Use in orchestrator (`lib/agent/orchestrator.ts`):**

```typescript
case "my_custom_goal": {
  const result = await tools.myNewTool.execute({
    tradeStudyId,
    someParam: "value"
  });
  steps.push({
    tool: "my_new_tool",
    status: "ok",
    message: "Tool executed"
  });
  break;
}
```

3. **Add to UI (`components/trade-studies/agent-runner.tsx`):**

```typescript
const goals = [
  // ...existing goals,
  {
    value: "my_custom_goal",
    label: "My Goal",
    description: "What it does"
  }
];
```

### Upgrade Google Publishing (Real APIs)

Currently `lib/google.ts` returns stub responses. To enable real publishing:

1. **Install googleapis:**
```bash
npm install googleapis
```

2. **Set up service account:**
   - In Google Cloud Console, create a service account
   - Download JSON key
   - Set `GOOGLE_SERVICE_ACCOUNT_KEY` in `.env.local` (base64 or inline JSON)

3. **Replace stubs in `lib/google.ts`:**

```typescript
import { google } from "googleapis";

export async function exportToDocs({ tradeStudyId, payload }: ExportPayload) {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "{}"),
    scopes: ["https://www.googleapis.com/auth/documents"]
  });
  
  const docs = google.docs({ version: "v1", auth });
  
  // Create document
  const doc = await docs.documents.create({
    requestBody: {
      title: `Trade Study: ${tradeStudyId}`
    }
  });
  
  // Add content...
  
  return { status: "ok", documentId: doc.data.documentId };
}
```

### Add Streaming Responses

For real-time progress updates, upgrade to streaming:

1. **In API route (`app/api/trade-studies/[id]/agent/route.ts`):**

```typescript
import { OpenAIStream, StreamingTextResponse } from "ai";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  // ...auth and validation
  
  const stream = await runAgentStreaming(agentRequest);
  return new StreamingTextResponse(stream);
}
```

2. **In UI component:**

```typescript
import { useChat } from "ai/react";

const { messages, append, isLoading } = useChat({
  api: `/api/trade-studies/${tradeStudyId}/agent`
});
```

## Framework Recommendations

You're currently using a **lightweight custom orchestrator**. Here are alternatives:

### Current Setup (What You Have)
- ✅ No heavy dependencies
- ✅ Full control over flow
- ✅ Easy to debug
- ❌ Manual planning logic
- ❌ No built-in retry/error handling

**Good for:** Most trade study workflows, rapid iteration

### LangChain JS
```bash
npm install langchain @langchain/openai
```
- ✅ Batteries-included (agents, chains, retrievers)
- ✅ Large ecosystem of integrations
- ❌ Heavier bundle size
- ❌ More abstraction

**Good for:** Complex multi-step workflows, RAG, vector search

### LangGraph JS
```bash
npm install @langchain/langgraph
```
- ✅ State machine workflows
- ✅ Branching logic, human-in-loop
- ✅ Built on LangChain
- ❌ Learning curve

**Good for:** Multi-stage approvals, long-running workflows

### Vercel AI SDK (ai package)
```bash
# Already installed
```
- ✅ Streaming by default
- ✅ Next.js optimized
- ✅ Tool calling support
- ❌ Less orchestration features

**Good for:** Chat interfaces, streaming responses

## Standalone MCP Server (Optional)

If you want a **separate MCP server** for external agents (Claude Desktop, etc.):

1. **Create `mcp-server/` directory:**

```bash
mkdir mcp-server
cd mcp-server
npm init -y
npm install @modelcontextprotocol/sdk
```

2. **Implement MCP server (`mcp-server/index.ts`):**

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server({
  name: "trade-study-agent",
  version: "1.0.0"
});

server.setRequestHandler("tools/list", async () => ({
  tools: [
    {
      name: "load_trade_study",
      description: "Load a trade study by ID",
      inputSchema: {
        type: "object",
        properties: {
          tradeStudyId: { type: "string" }
        }
      }
    }
    // ...other tools
  ]
}));

server.setRequestHandler("tools/call", async (request) => {
  // Route to your existing lib/agent/tools.ts
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

3. **Configure in Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`):**

```json
{
  "mcpServers": {
    "trade-study-agent": {
      "command": "node",
      "args": ["/path/to/mcp-server/index.js"]
    }
  }
}
```

## Testing

### Test OpenAI Integration

```bash
# In your project root
node -e "
const { analyzeTradeStudy } = require('./lib/openai.ts');
analyzeTradeStudy({
  studyTitle: 'Test Study',
  studyData: { options: ['A', 'B'] },
  goal: 'summarize'
}).then(console.log);
"
```

### Test Agent Endpoint

```bash
# Start dev server
npm run dev

# In another terminal
curl -X POST http://localhost:3000/api/trade-studies/YOUR_ID/agent \
  -H "Content-Type: application/json" \
  -d '{"goal":"summarize"}' \
  --cookie "your-session-cookie"
```

## Troubleshooting

### "OPENAI_API_KEY not set"
- Check `.env.local` exists and has `OPENAI_API_KEY=sk-...`
- Restart dev server after changing env vars

### "Trade study not found"
- Ensure `DATABASE_URL` is set
- Run `npx prisma migrate dev`
- Create a study via UI first

### "Unauthorized" on API call
- Sign in via Google OAuth
- Check session cookie is being sent

### Google publish always returns "stubbed"
- This is expected! Real Google API integration requires service account setup
- See "Upgrade Google Publishing" section above

## Production Deployment

### Vercel (Recommended)

1. **Push to GitHub**
2. **Import in Vercel:**
   - Connect repository
   - Add environment variables (all from `.env.local`)
   - Deploy
3. **Run migrations:**
   ```bash
   npx prisma migrate deploy
   ```

### Environment Variables for Production

Required:
- `OPENAI_API_KEY`
- `NEXTAUTH_URL` (your domain)
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `DATABASE_URL` (Vercel Postgres, Supabase, Neon, etc.)

Optional:
- `GOOGLE_SERVICE_ACCOUNT_KEY`
- `GOOGLE_DRIVE_FOLDER_ID`

## Next Steps

1. **Try the agent**: Create a trade study and run "Analyze"
2. **Customize prompts**: Edit `lib/openai.ts` to tune analysis
3. **Add your domain logic**: Modify tools in `lib/agent/tools.ts`
4. **Enable real Google publishing**: Follow Google APIs setup
5. **Add more goals**: Extend orchestrator with custom workflows

## Resources

- [OpenAI API Docs](https://platform.openai.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Prisma Docs](https://www.prisma.io/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Model Context Protocol](https://modelcontextprotocol.io)

---

**Questions?** Check the inline code comments in:
- `lib/agent/tools.ts` – Tool definitions
- `lib/agent/orchestrator.ts` – Workflow logic
- `lib/openai.ts` – LLM integration
- `app/api/trade-studies/[id]/agent/route.ts` – API handler
