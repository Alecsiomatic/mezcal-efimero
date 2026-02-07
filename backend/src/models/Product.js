const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const slugify = require('slugify');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  sku: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING(220),
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  shortDescription: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  comparePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lowStockThreshold: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  weight: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true
  },
  volume: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  alcoholContent: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  agaveType: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  region: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  maestroMezcalero: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  tastingNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isNew: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  metaTitle: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  metaDescription: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  salesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  hooks: {
    beforeValidate: (product) => {
      if (product.name) {
        product.slug = slugify(product.name, { lower: true, strict: true });
      }
    }
  }
});

module.exports = Product;
