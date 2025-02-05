const { Sequelize } = require("sequelize");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./database.sqlite", // SQLite database file
  pool: {
    max: 200, // Increase the maximum number of connections
    min: 0,
    acquire: 30000, // Increase the timeout for acquiring a connection
    idle: 10000,
  },
  logging: false, // Disable logging for better performance
});

// Enable WAL mode
sequelize.query("PRAGMA journal_mode=WAL;").then(() => {
  console.log("WAL mode enabled");
});

module.exports = sequelize;