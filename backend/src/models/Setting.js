const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Setting = sequelize.define('Setting', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  key: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
    defaultValue: 'string'
  },
  group: {
    type: DataTypes.STRING(50),
    defaultValue: 'general'
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
});

module.exports = Setting;
