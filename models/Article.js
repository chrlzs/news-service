const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Article = sequelize.define("Article", {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // Ensure no duplicate articles
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
});

module.exports = Article;