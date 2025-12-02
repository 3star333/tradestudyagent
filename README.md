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

## 🧪 Autonomous Trade Study Generator (New)

You can now generate a complete trade study from just a topic statement.

### Features
- Automatic criteria (4–10 weighted items)
- Alternative solutions enumeration
- Research pass (web search + source summaries) with selectable depth
- Scoring matrix (0–10 per criterion, weighted total)
- Winner identification and enrichment analysis
- Optional artifact export (Docs / Sheets stubbed)

### How to Use (UI)
1. Navigate to `Create` → `/trade-studies/new`
2. Enter a topic (e.g. "Select a vector database for AI memory")
3. (Optional) Provide a Google Drive folder ID
4. Choose research depth: Quick / Standard / Deep
5. Click `Generate Study`
6. Auto-redirect to the new study once complete

### How to Use (API)
`POST /api/trade-studies/generate`
```json
{
   "topic": "Select a vector database for AI memory",
   "depth": "standard",
   "folderId": "<drive-folder-id-optional>",
   "generateArtifacts": true
}
```
Response:
```json
{
   "ok": true,
   "result": {
      "studyId": "...",
      "criteria": [ { "name": "Cost", "weight": 0.2, "description": "..." } ],
      "alternatives": [ { "name": "Option A", "rationale": "..." } ],
      "scored": [ { "name": "Option A", "scores": { "Cost": 7 }, "weightedTotal": 6.4 } ],
      "winner": { "name": "Option A", "weightedTotal": 6.4, "scores": { "Cost": 7 } },
      "researchSummary": "...",
      "sources": [ { "title": "...", "url": "..." } ]
   }
}
```

### Internal Orchestration
`lib/tradeStudyGenerator.ts` handles:
1. Research (`researchTools.researchContext`)
2. Criteria generation (LLM JSON schema)
3. Alternatives generation (LLM)
4. Scoring (LLM + research context)
5. Persistence (`createTradeStudy`) + enrichment analysis (`analyzeTradeStudy`)
6. Artifact export stubs (`exportToDocs`, `exportToSheets`) + attachment linking

Add your real Google Docs/Sheets integration by replacing stubbed functions in `lib/google.ts` with API calls and capturing returned file IDs.

## 📄 Real Google Integration (Per-User OAuth)

Implemented per-user OAuth using stored tokens in the `Account` table (NextAuth). No service account required.

### Scopes Used
```
openid email profile
https://www.googleapis.com/auth/drive
https://www.googleapis.com/auth/documents
https://www.googleapis.com/auth/spreadsheets
https://www.googleapis.com/auth/presentations.readonly
```

### Key Files
- `lib/googleClient.ts` – Creates OAuth2 client, auto refreshes access tokens (< 2 min to expiry)
- `lib/google.ts` – Real implementations for exporting Docs & Sheets and listing Drive files
- `lib/tradeStudyGenerator.ts` – Passes `userId` & `folderId` for artifact creation

### How It Works
1. User links Google via NextAuth (refresh + access tokens saved in `Account` row).
2. When generating a study, the generator calls `exportToDocs` / `exportToSheets` with `userId`.
3. A new Google Doc and Sheet are created in Drive (optionally inside provided folder).
4. Content inserted (criteria, alternatives, scoring matrix).
5. File IDs attached to the trade study.
6. Token refresh occurs automatically when approaching expiry.

### Environment Variables Needed
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_URL` (for OAuth redirect in production)

### Future Enhancements
- Slides export
- Rich formatting (headings, tables, conditional formatting)
- Folder picker UI
- Retry + exponential backoff for API rate limits

## 🎨 Fighter Jet HUD Theme

The UI uses a dark slate cockpit palette with radar green (`--primary`) and afterburner amber (`--accent`).

Key tokens in `app/globals.css`:
```
--background: Cockpit dark slate
--primary: Radar green
--accent: Afterburner amber
--glow-green / --glow-amber: HUD glow shadows
```

Tailwind extensions (`tailwind.config.ts`): custom `hud` font stack (Rajdhani), glow shadows, jet grid backgrounds.

Button variants:
- `variant="hud"` – subtle outlined radar style
- `variant="warning"` – amber alert/glow

Add scanline overlay via `.hud-scanlines` class on `<body>`.



### CLI Script
Run quick generation without UI:
```bash
ts-node scripts/generate-trade-study.ts "Select a vector database for AI memory"
```
Set `DEMO_USER_ID` to control the user id used when no auth session is present.


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
 ✅ **Publish** results to Google Docs / Sheets / Slides (real per-user OAuth)
- PostgreSQL (optional - falls back to demo data)
- OpenAI API key
- Google OAuth credentials
Real Google Docs/Sheets/Slides integration implemented via per-user OAuth (`exportToDocs`, `exportToSheets`, `exportToSlides`). Each export returns a status object and fileId.

### Setup
### Setup
 https://www.googleapis.com/auth/presentations
1. **Install dependencies:**
   ```bash
 `lib/google.ts` – Implements `exportToDocs`, `exportToSheets`, `exportToSlides`, `uploadToDrive`
2. **Configure environment:**
   ```bash
### Future Enhancements
- Rich Docs/Sheets formatting (tables, conditional formatting)
- Slide content enrichment (bullet points, charts)
   
 **Integrations**: Google Docs/Sheets/Slides/Drive (per-user OAuth)
   - `OPENAI_API_KEY` - Get from https://platform.openai.com/api-keys (REQUIRED for agent)
   - `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
### Google Publishing Details

Already enabled via per-user OAuth. Ensure tokens exist in the `Account` table after Google sign-in. Exports create real files and attach IDs.

If you need service-account based batch operations for shared team drives, you can add a parallel implementation; current code prefers user ownership for clarity/auditing.

See detailed instructions in [AGENT_SETUP.md](./AGENT_SETUP.md) for extending artifact content.
   ```bash
Real export logic implemented; extend formatting/Slides content as needed.
   npx prisma migrate dev --name init
   ```

## 🔧 Troubleshooting Google Exports

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Status shows `skipped` | Missing Google tokens | Re-link Google account (logout/login) |
| Status `error` with 403 | Insufficient scopes / revoked consent | Verify scopes in `lib/auth.ts`, re-consent |
| Status `error` with 401 | Expired token & refresh failed | Re-link Google account |
| No `Account` row | User never completed OAuth | Click "Link Google" button in header |
| Slides export fails | Presentations scope missing | Add presentations scope & re-auth |
| Docs created but empty | API write partial failure | Check server logs; retry export |

Additional debug: inspect server logs for `[exportToDocs]`, `[exportToSheets]`, `[exportToSlides]` prefixes.

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
