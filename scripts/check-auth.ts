import { db } from "../lib/db";

async function checkAuthData() {
  console.log("🔍 Checking authentication data...\n");

  // Check users
  const users = await db.user.findMany({
    include: {
      Account: true,
      Session: true,
    },
  });

  console.log(`📊 Found ${users.length} user(s):\n`);
  
  for (const user of users) {
    console.log(`User: ${user.email}`);
    console.log(`  - ID: ${user.id}`);
    console.log(`  - Name: ${user.name}`);
    console.log(`  - Accounts: ${user.Account.length}`);
    console.log(`  - Sessions: ${user.Session.length}`);
    
    if (user.Account.length === 0) {
      console.log(`  ⚠️  WARNING: User has no linked OAuth accounts!`);
    }
    
    user.Account.forEach((account: any) => {
      console.log(`  - OAuth Provider: ${account.provider}`);
      console.log(`    Provider Account ID: ${account.providerAccountId}`);
    });
    
    console.log("");
  }

  // Check orphaned accounts
  const accounts = await db.account.findMany();
  console.log(`📊 Total accounts: ${accounts.length}`);

  // Check orphaned sessions
  const sessions = await db.session.findMany();
  console.log(`📊 Total sessions: ${sessions.length}`);

  console.log("\n✅ Diagnostic complete!");
}

checkAuthData()
  .catch(console.error)
  .finally(() => process.exit());
