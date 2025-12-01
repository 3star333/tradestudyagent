#!/bin/bash
# Setup script for Trade Study Agent
# Run with: bash setup.sh

set -e  # Exit on error

echo "🚀 Trade Study Agent Setup"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ -f .env.local ]; then
    echo -e "${YELLOW}⚠️  .env.local already exists${NC}"
    read -p "Do you want to overwrite it? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing .env.local"
        ENV_EXISTS=true
    fi
fi

# Create .env.local if needed
if [ -z "$ENV_EXISTS" ]; then
    echo "📝 Creating .env.local..."
    
    # Generate NEXTAUTH_SECRET
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    
    # Get current username for PostgreSQL
    CURRENT_USER=$(whoami)
    
    cat > .env.local << EOF
# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$NEXTAUTH_SECRET"

# Google OAuth (replace with your credentials from Google Cloud Console)
GOOGLE_CLIENT_ID="YOUR_CLIENT_ID.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-YOUR_CLIENT_SECRET"

# Database (local PostgreSQL)
DATABASE_URL="postgresql://$CURRENT_USER@localhost:5432/trade_study_agent"

# OpenAI (get from https://platform.openai.com/api-keys)
OPENAI_API_KEY="sk-proj-YOUR_KEY_HERE"

# Google APIs (optional - for publishing features)
GOOGLE_SERVICE_ACCOUNT_KEY="{}"
GOOGLE_DRIVE_FOLDER_ID=""
EOF
    
    echo -e "${GREEN}✓ Created .env.local with generated NEXTAUTH_SECRET${NC}"
    echo ""
fi

# Check for PostgreSQL
echo "🔍 Checking for PostgreSQL..."
if command -v psql &> /dev/null; then
    echo -e "${GREEN}✓ PostgreSQL found${NC}"
    
    # Check if database exists
    if psql -lqt | cut -d \| -f 1 | grep -qw trade_study_agent; then
        echo -e "${GREEN}✓ Database 'trade_study_agent' exists${NC}"
    else
        echo "📦 Creating database 'trade_study_agent'..."
        createdb trade_study_agent 2>/dev/null || {
            echo -e "${YELLOW}⚠️  Could not create database automatically${NC}"
            echo "Run manually: createdb trade_study_agent"
        }
    fi
else
    echo -e "${YELLOW}⚠️  PostgreSQL not found${NC}"
    echo "Install with: brew install postgresql@15"
    echo "Then run: brew services start postgresql@15"
    echo ""
    echo "Alternatively, use a hosted database (see DATABASE_OAUTH_SETUP.md)"
fi
echo ""

# Install dependencies
echo "📦 Installing npm dependencies..."
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate
echo -e "${GREEN}✓ Prisma client generated${NC}"
echo ""

# Run migrations if database is available
if command -v psql &> /dev/null && psql -lqt | cut -d \| -f 1 | grep -qw trade_study_agent; then
    echo "🗄️  Running database migrations..."
    npx prisma migrate dev --name init --skip-seed 2>/dev/null || {
        echo -e "${YELLOW}⚠️  Migrations may have already been applied${NC}"
    }
    echo -e "${GREEN}✓ Database ready${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping migrations (database not available)${NC}"
    echo "You can run them later with: npx prisma migrate dev"
fi
echo ""

# Summary
echo "=============================="
echo -e "${GREEN}✓ Setup complete!${NC}"
echo "=============================="
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Open .env.local and add your API keys:"
echo "   - OPENAI_API_KEY (from https://platform.openai.com/api-keys)"
echo "   - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET"
echo "     (from Google Cloud Console - see DATABASE_OAUTH_SETUP.md)"
echo ""
echo "2. Start the development server:"
echo "   ${GREEN}npm run dev${NC}"
echo ""
echo "3. Visit http://localhost:3000"
echo ""
echo "📖 For detailed setup instructions, see:"
echo "   - DATABASE_OAUTH_SETUP.md (database & OAuth setup)"
echo "   - QUICK_REFERENCE.md (commands & tips)"
echo "   - AGENT_SETUP.md (full documentation)"
echo ""
echo "🎉 Ready to build!"
