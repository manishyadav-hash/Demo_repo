require("dotenv").config();

const { sequelize } = require("./src/config/sequelize.config");
const UserLocationModel = require("./src/models/user-location.model");

async function syncDatabase() {
  try {
    console.log("🔄 Syncing database models...");
    
    // Sync all models with alter: true to modify existing tables
    await sequelize.sync({ alter: true });
    
    console.log("✅ Database synced successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Database sync error:", error);
    process.exit(1);
  }
}

syncDatabase();
