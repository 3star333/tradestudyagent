import { db } from "../lib/db";

async function testDatabaseWrite() {
  console.log("🧪 Testing database write permissions...\n");

  try {
    // Try to create a test user
    const testUser = await db.user.create({
      data: {
        email: "test@example.com",
        name: "Test User",
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log("✅ Successfully created test user:");
    console.log(`   ID: ${testUser.id}`);
    console.log(`   Email: ${testUser.email}`);

    // Clean up
    await db.user.delete({
      where: { id: testUser.id },
    });

    console.log("✅ Successfully deleted test user");
    console.log("\n✅ Database write permissions are working!");
    
  } catch (error) {
    console.error("❌ Database write failed:");
    console.error(error);
  }
}

testDatabaseWrite()
  .catch(console.error)
  .finally(() => process.exit());
