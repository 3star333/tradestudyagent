# Trade Study Agent

Next.js 14 (App Router) + TypeScript scaffold for an AI-assisted trade study workspace with **MCP-style agent** powered by OpenAI.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local and add your OPENAI_API_KEY

# 3. Set up database (optional - works with stubs if skipped)
# Set DATABASE_URL in .env.local, then:
npx prisma generate
npx prisma migrate dev --name init

# 4. Start development server
npm run dev
```

Visit http://localhost:3000, sign in, create a trade study, and click "Run Agent"!

## 🤖 What's New: AI Agent with MCP-Style Tools

This repo now includes a **working AI agent** that can:
- ✅ **Analyze** trade studies to identify gaps and improvements
- ✅ **Summarize** requirements and options
- ✅ **Score** options against criteria with AI-generated ratings
- ✅ **Publish** results to Google services (stub - ready for real APIs)
- ✅ **Run workflows** combining multiple steps

### Architecture

```
UI → API Endpoint → Orchestrator → Tools → Services
     /api/.../agent   runAgent()    4 tools  OpenAI/Google/DB
```

**Tools (MCP-style):**
1. `load_trade_study` - Fetch study data
2. `update_trade_study` - Persist changes
3. `analyze_with_llm` - OpenAI GPT-4 analysis
4. `publish_to_google` - Export to Docs/Sheets/Slides/Drive

See **[AGENT_SETUP.md](./AGENT_SETUP.md)** for detailed documentation.

## Stack

- **Framework**: Next.js 14 + App Router + TypeScript
- **Styling**: Tailwind CSS + ShadCN UI + Lucide icons
- **Auth**: NextAuth.js (Google OAuth)
- **Database**: Prisma ORM → PostgreSQL
- **AI**: OpenAI SDK (GPT-4) with structured outputs
- **Agent**: Custom MCP-style orchestrator with tools
- **Integrations**: Google Docs/Sheets/Slides/Drive (stubs ready for real APIs)

## Getting started

### Prerequisites
- Node.js 18+ (20+ recommended)
- PostgreSQL (optional - falls back to demo data)
- OpenAI API key
- Google OAuth credentials

### Setup
### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and set:
   - `OPENAI_API_KEY` - Get from https://platform.openai.com/api-keys (REQUIRED for agent)
   - `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
   - `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
   - `DATABASE_URL` - PostgreSQL connection string (optional - uses demo data if not set)

3. **Set up database (optional):**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. **Start dev server:**
   ```bash
   npm run dev
   ```
   
   Visit http://localhost:3000

## Using the AI Agent

1. Sign in with Google
2. Create a new trade study (or open an existing one)
3. In the trade study detail page, find the **AI Agent** card
4. Select a goal:
   - **Analyze** - Identify gaps, missing requirements, improvements
   - **Summarize** - Generate overview of study
   - **Score Options** - AI evaluates each option against criteria
   - **Publish** - Export to Google services (stub)
   - **Full Workflow** - Complete analysis + proposal
5. Click "Run Agent"
6. View results: execution steps, analysis, and recommendations

The agent will update the `TradeStudy.data` JSON field with structured results.

## Key Files for Agent

| File | Purpose |
|------|---------|
| `lib/agent/tools.ts` | 4 MCP-style tools (load, update, analyze, publish) |
| `lib/agent/orchestrator.ts` | Workflow coordinator - routes goals to tools |
| `lib/openai.ts` | OpenAI SDK integration with structured outputs |
| `app/api/trade-studies/[id]/agent/route.ts` | API endpoint for agent execution |
| `components/trade-studies/agent-runner.tsx` | UI component with goal selector |

## Key locations

### Core App Structure
- Auth config: `lib/auth.ts`, route `app/api/auth/[...nextauth]/route.ts`
- Prisma schema: `prisma/schema.prisma`
- UI shell: `app/layout.tsx`, `components/layout/site-header.tsx`
- Google OAuth redirect helper: `/auth/google` + `components/layout/link-google-button.tsx`
- Dashboard + trade study pages: `app/(dashboard)/dashboard`, `app/trade-studies/*`
- API routes: `app/api/openai`, `app/api/google`, `app/api/trade-studies`
- Service layers: `lib/openai.ts`, `lib/google.ts`, `lib/studies.ts`

### Agent Infrastructure (New!)
- **Tools**: `lib/agent/tools.ts` - 4 MCP-style tools with Zod schemas
- **Orchestrator**: `lib/agent/orchestrator.ts` - Coordinates tool execution
- **OpenAI Service**: `lib/openai.ts` - GPT-4 with structured JSON responses
- **Agent API**: `app/api/trade-studies/[id]/agent/route.ts`
- **Agent UI**: `components/trade-studies/agent-runner.tsx`

## Extending the Agent

### Add a New Tool

See examples in `lib/agent/tools.ts`. Each tool needs:
1. Zod schema for input validation
2. Execute function that returns structured data
3. Registration in the `tools` object

Example:
```typescript
export const myToolSchema = z.object({
  tradeStudyId: z.string(),
  param: z.string()
});

export async function myToolExecute(input: z.infer<typeof myToolSchema>) {
  // Your logic here
  return { success: true, data: {} };
}

export const tools = {
  // ...existing,
  myTool: {
    name: "my_tool",
    description: "What it does",
    schema: myToolSchema,
    execute: myToolExecute
  }
};
```

Then use it in `lib/agent/orchestrator.ts` for your custom workflow.

### Customize AI Prompts

Edit `lib/openai.ts` → `analyzeTradeStudy()` function. The system and user prompts can be tuned for your domain.

### Enable Real Google Publishing

1. Install googleapis: `npm install googleapis`
2. Set up service account in Google Cloud Console
3. Set `GOOGLE_SERVICE_ACCOUNT_KEY` environment variable
4. Replace stub functions in `lib/google.ts` with real API calls

See detailed instructions in [AGENT_SETUP.md](./AGENT_SETUP.md).

## Framework Alternatives

Current setup uses a **lightweight custom orchestrator**. If you need more:

- **LangChain JS**: For complex chains, retrievers, vector search
- **LangGraph JS**: For state machines, branching workflows
- **Vercel AI SDK**: For streaming responses (already installed)

See [AGENT_SETUP.md](./AGENT_SETUP.md) section "Framework Recommendations" for migration paths.

## MCP Server (Optional)

To expose these tools as a **standalone MCP server** for external agents (Claude Desktop, etc.), see the "Standalone MCP Server" section in [AGENT_SETUP.md](./AGENT_SETUP.md).

Replace stubbed logic with real API calls and Prisma queries to complete the application.

## Database setup (PostgreSQL via Prisma)
1. Provision Postgres and set `DATABASE_URL` in `.env.local` (example already in `.env.example`).
2. Run Prisma migrations: `npx prisma migrate dev --name init` (first time) or `npx prisma migrate dev --name add-attachments` if you already applied init and are adding attachments.
3. Generate client (postinstall already does this): `npx prisma generate`.
4. Deploy migrations in CI/CD: `npx prisma migrate deploy`.

Models include:
- NextAuth tables: `User`, `Account`, `Session`, `VerificationToken`
- Trade study tables: `TradeStudy`, `TradeStudyMember`, `TradeStudyAttachment`

When database is unavailable, trade study helpers fall back to stub data. Once `DATABASE_URL` is set and migrations run, endpoints write/read from Postgres.
