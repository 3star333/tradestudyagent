# Database & Google OAuth Setup Guide

Complete step-by-step instructions for setting up PostgreSQL and Google authentication.

---

## Part 1: PostgreSQL Database Setup

### Option A: Local PostgreSQL (macOS)

#### 1. Install PostgreSQL

```bash
# Using Homebrew
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Verify it's running
psql --version
```

#### 2. Create Database

```bash
# Create database
createdb trade_study_agent

# Test connection
psql trade_study_agent
# You should see: trade_study_agent=#
# Type \q to exit
```

#### 3. Get Connection String

Your local connection string:
```
postgresql://YOUR_USERNAME@localhost:5432/trade_study_agent
```

To find your username:
```bash
whoami
```

Example: If your username is `raiikee`:
```
DATABASE_URL="postgresql://raiikee@localhost:5432/trade_study_agent"
```

### Option B: Hosted PostgreSQL (Recommended for Production)

Choose one of these providers:

#### **Vercel Postgres** (Easiest with Vercel deployment)
1. Go to https://vercel.com/dashboard
2. Select your project → Storage tab
3. Click "Create Database" → Choose "Postgres"
4. Copy the `DATABASE_URL` connection string

#### **Supabase** (Free tier available)
1. Go to https://supabase.com
2. Create new project
3. Wait for database to provision (~2 minutes)
4. Go to Project Settings → Database
5. Copy "Connection string" (URI format)
6. Replace `[YOUR-PASSWORD]` with your database password

Example:
```
postgresql://postgres.xxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

#### **Neon** (Serverless Postgres)
1. Go to https://neon.tech
2. Create account and new project
3. Copy connection string from dashboard
4. Choose "Pooled connection" for better performance

#### **Railway** (Simple setup)
1. Go to https://railway.app
2. New Project → Deploy PostgreSQL
3. Click PostgreSQL service → Connect tab
4. Copy "Postgres Connection URL"

### 4. Add to Environment

```bash
# Open .env.local
nano .env.local

# Add this line:
DATABASE_URL="your-connection-string-here"
```

### 5. Run Migrations

```bash
# Generate Prisma client
npx prisma generate

# Create database tables
npx prisma migrate dev --name init
```

You should see output like:
```
✔ Generated Prisma Client
✔ Applied migration(s)
```

### 6. Verify Database

```bash
# Open Prisma Studio to view database
npx prisma studio
```

Browser opens at http://localhost:5555 showing your tables.

---

## Part 2: Google OAuth Setup

### Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create New Project**
   - Click project dropdown (top left)
   - Click "New Project"
   - Name: `trade-study-agent` (or your choice)
   - Click "Create"
   - Wait for project to be created
   - Select the new project from dropdown

### Step 2: Enable Required APIs

1. **Go to APIs & Services**
   - Left menu → "APIs & Services" → "Library"

2. **Enable these APIs** (search and click "Enable" for each):
   - ✅ **Google+ API** (for basic profile)
   - ✅ **Google Drive API** (for file access)
   - ✅ **Google Docs API** (for document creation)
   - ✅ **Google Sheets API** (for spreadsheet creation)
   - ✅ **Google Slides API** (optional - for presentations)

### Step 3: Configure OAuth Consent Screen

1. **Go to OAuth consent screen**
   - Left menu → "APIs & Services" → "OAuth consent screen"

2. **Choose User Type**
   - Select "External" (unless you have Google Workspace)
   - Click "Create"

3. **Fill App Information**
   - **App name**: `Trade Study Agent`
   - **User support email**: Your email
   - **Developer contact**: Your email
   - **App logo**: (Optional - skip for now)
   - Click "Save and Continue"

4. **Scopes**
   - Click "Add or Remove Scopes"
   - Select these scopes:
     ```
     ✅ .../auth/userinfo.email
     ✅ .../auth/userinfo.profile
     ✅ openid
     ✅ .../auth/drive (if you want Drive access)
     ✅ .../auth/documents (if you want Docs access)
     ✅ .../auth/spreadsheets (if you want Sheets access)
     ```
   - Click "Update" → "Save and Continue"

5. **Test Users** (for development)
   - Click "Add Users"
   - Add your email address
   - Click "Save and Continue"

6. **Summary**
   - Review and click "Back to Dashboard"

### Step 4: Create OAuth Credentials

1. **Go to Credentials**
   - Left menu → "APIs & Services" → "Credentials"

2. **Create OAuth Client ID**
   - Click "+ Create Credentials" → "OAuth client ID"
   - **Application type**: Web application
   - **Name**: `Trade Study Agent Web`

3. **Configure Authorized URLs**

   **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   https://yourdomain.com (add after deployment)
   ```

   **Authorized redirect URIs:**
   ```
   http://localhost:3000/api/auth/callback/google
   https://yourdomain.com/api/auth/callback/google (add after deployment)
   ```

4. **Create**
   - Click "Create"
   - You'll see a modal with your credentials

5. **Save Credentials**
   - **Client ID**: Looks like `123456789-abc123.apps.googleusercontent.com`
   - **Client Secret**: Looks like `GOCSPX-abc123xyz...`
   - **⚠️ Keep these secret!**

### Step 5: Add to Environment

```bash
# Open .env.local
nano .env.local

# Add these lines:
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-client-secret"
```

---

## Part 3: Complete .env.local File

Here's what your final `.env.local` should look like:

```env
# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret-here"

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID="123456789-abc123.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-abc123xyz..."

# Database (from PostgreSQL setup)
DATABASE_URL="postgresql://username:password@host:5432/database"

# OpenAI (REQUIRED for agent)
OPENAI_API_KEY="sk-proj-abc123..."

# Google APIs (OPTIONAL - for publishing features)
GOOGLE_SERVICE_ACCOUNT_KEY="{}"
GOOGLE_DRIVE_FOLDER_ID=""
```

### Generate NEXTAUTH_SECRET

```bash
# Run this command:
openssl rand -base64 32

# Copy output and paste into .env.local
```

---

## Part 4: Test Your Setup

### Test 1: Database Connection

```bash
# Start dev server
npm run dev

# In another terminal, check database
npx prisma studio

# You should see your tables (User, Account, Session, TradeStudy, etc.)
```

### Test 2: Google OAuth

1. **Start server:**
   ```bash
   npm run dev
   ```

2. **Open browser:**
   - Go to http://localhost:3000
   - Click "Sign in with Google"

3. **You should see:**
   - Google sign-in popup
   - Permission request for email, profile, Drive, Docs, Sheets
   - Click "Allow"
   - Redirect back to app
   - See your name/email in header

4. **Verify in database:**
   ```bash
   npx prisma studio
   ```
   - Click "User" table → See your user
   - Click "Account" table → See Google OAuth tokens

### Test 3: Agent (with all setup complete)

1. Go to Dashboard
2. Create or open a trade study
3. Scroll to "AI Agent" card
4. Select "Analyze" goal
5. Click "Run Agent"

You should see:
- ✅ Loading spinner
- ✅ Execution steps
- ✅ AI analysis with recommendations
- ✅ Updated study data

---

## Troubleshooting

### Database Issues

**❌ "Can't reach database server"**
```bash
# Check PostgreSQL is running
brew services list | grep postgresql

# If not running:
brew services start postgresql@15

# Test connection manually:
psql $DATABASE_URL
```

**❌ "Authentication failed"**
- Check username/password in DATABASE_URL
- For local: remove password (e.g., `postgresql://username@localhost:5432/db`)
- For hosted: verify password is correct

**❌ "Database does not exist"**
```bash
# Create it:
createdb trade_study_agent

# Or for hosted, check database name in provider dashboard
```

**❌ "Schema not created"**
```bash
# Run migrations:
npx prisma migrate dev --name init

# If stuck, reset:
npx prisma migrate reset
```

### Google OAuth Issues

**❌ "Redirect URI mismatch"**
1. Go to Google Cloud Console → Credentials
2. Click your OAuth client
3. Verify "Authorized redirect URIs" includes:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
4. Save and wait 5 minutes for changes to propagate

**❌ "Access blocked: This app's request is invalid"**
- Make sure OAuth consent screen is configured
- Add your email to "Test users" if using External user type
- Wait 5-10 minutes after saving consent screen

**❌ "Error 400: redirect_uri_mismatch"**
- Check your NEXTAUTH_URL in .env.local matches exactly:
  ```env
  NEXTAUTH_URL="http://localhost:3000"
  ```
- No trailing slash!

**❌ "No refresh token"**
- This is normal first time
- Sign out and sign in again
- Check Account table in database for refresh_token

**❌ "Insufficient permissions"**
- Go to OAuth consent screen
- Add required scopes (userinfo.email, userinfo.profile, openid)
- Add Drive/Docs/Sheets scopes if you want those features

### Agent Issues

**❌ "OPENAI_API_KEY not set"**
```bash
# Add to .env.local:
OPENAI_API_KEY="sk-proj-..."

# Restart server:
# Ctrl+C then npm run dev
```

**❌ "Trade study not found"**
- Make sure DATABASE_URL is set
- Run migrations: `npx prisma migrate dev`
- Create a study via the UI first

**❌ "Unauthorized"**
- Sign in via Google OAuth
- Check session cookie exists (dev tools → Application → Cookies)

---

## Quick Checklist

Use this to verify everything is set up:

- [ ] PostgreSQL installed and running
- [ ] Database created: `trade_study_agent`
- [ ] DATABASE_URL in .env.local
- [ ] Prisma migrations run: `npx prisma migrate dev`
- [ ] Google Cloud project created
- [ ] Google APIs enabled (Drive, Docs, Sheets)
- [ ] OAuth consent screen configured
- [ ] OAuth credentials created
- [ ] GOOGLE_CLIENT_ID in .env.local
- [ ] GOOGLE_CLIENT_SECRET in .env.local
- [ ] NEXTAUTH_SECRET generated and in .env.local
- [ ] OPENAI_API_KEY in .env.local
- [ ] Server starts: `npm run dev`
- [ ] Can sign in with Google
- [ ] Can create trade study
- [ ] Agent runs successfully

---

## Example Complete Setup Commands

Run these in order:

```bash
# 1. Install PostgreSQL (if needed)
brew install postgresql@15
brew services start postgresql@15

# 2. Create database
createdb trade_study_agent

# 3. Create .env.local
cat > .env.local << 'EOF'
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="REPLACE_WITH_GENERATED_SECRET"
GOOGLE_CLIENT_ID="REPLACE_WITH_YOUR_CLIENT_ID"
GOOGLE_CLIENT_SECRET="REPLACE_WITH_YOUR_CLIENT_SECRET"
DATABASE_URL="postgresql://$(whoami)@localhost:5432/trade_study_agent"
OPENAI_API_KEY="REPLACE_WITH_YOUR_OPENAI_KEY"
GOOGLE_SERVICE_ACCOUNT_KEY="{}"
GOOGLE_DRIVE_FOLDER_ID=""
EOF

# 4. Generate NEXTAUTH_SECRET
echo "Your NEXTAUTH_SECRET:"
openssl rand -base64 32

# 5. Setup Prisma
npx prisma generate
npx prisma migrate dev --name init

# 6. Start server
npm run dev
```

Then:
1. Replace placeholders in .env.local with real values
2. Restart server: Ctrl+C then `npm run dev`
3. Visit http://localhost:3000
4. Sign in with Google
5. Test the agent!

---

## Need Help?

- **Database**: Check [Prisma Docs](https://www.prisma.io/docs)
- **Google OAuth**: Check [NextAuth Docs](https://next-auth.js.org/providers/google)
- **OpenAI**: Check [OpenAI Platform](https://platform.openai.com/docs)
- **General**: See [AGENT_SETUP.md](./AGENT_SETUP.md) troubleshooting section

---

**Ready?** Run through the checklist above and you'll be set up in ~15 minutes! 🚀
