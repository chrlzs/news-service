const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const RequestLog = sequelize.define("RequestLog", {
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
});

module.exports = RequestLog;