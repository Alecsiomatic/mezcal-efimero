const sequelize = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const ProductImage = require('./ProductImage');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const { Cart, CartItem } = require('./Cart');
const Payment = require('./Payment');
const Coupon = require('./Coupon');
const Setting = require('./Setting');
const Bottle = require('./Bottle')(sequelize);

// Product - Category (Many to One)
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });

// Product - ProductImage (One to Many)
Product.hasMany(ProductImage, { foreignKey: 'productId', as: 'images', onDelete: 'CASCADE' });
ProductImage.belongsTo(Product, { foreignKey: 'productId' });

// User - Order (One to Many)
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Order - OrderItem (One to Many)
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

// OrderItem - Product
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Order - Payment (One to One)
Order.hasOne(Payment, { foreignKey: 'orderId', as: 'payment' });
Payment.belongsTo(Order, { foreignKey: 'orderId' });

// Order - Coupon
Order.belongsTo(Coupon, { foreignKey: 'couponId', as: 'coupon' });

// User - Cart (One to One)
User.hasOne(Cart, { foreignKey: 'userId', as: 'cart' });
Cart.belongsTo(User, { foreignKey: 'userId' });

// Cart - CartItem (One to Many)
Cart.hasMany(CartItem, { foreignKey: 'cartId', as: 'items', onDelete: 'CASCADE' });
CartItem.belongsTo(Cart, { foreignKey: 'cartId' });

// CartItem - Product
CartItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Product.hasMany(CartItem, { foreignKey: 'productId' });

// Address model for users
const { DataTypes } = require('sequelize');
const Address = sequelize.define('Address', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  label: { type: DataTypes.STRING(50), defaultValue: 'Casa' },
  firstName: { type: DataTypes.STRING(100) },
  lastName: { type: DataTypes.STRING(100) },
  phone: { type: DataTypes.STRING(20) },
  address: { type: DataTypes.STRING(255), allowNull: false },
  city: { type: DataTypes.STRING(100), allowNull: false },
  state: { type: DataTypes.STRING(100), allowNull: false },
  zip: { type: DataTypes.STRING(20), allowNull: false },
  country: { type: DataTypes.STRING(100), defaultValue: 'Mexico' },
  isDefault: { type: DataTypes.BOOLEAN, defaultValue: false }
});

User.hasMany(Address, { foreignKey: 'userId', as: 'addresses', onDelete: 'CASCADE' });
Address.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  User,
  Category,
  Product,
  ProductImage,
  Order,
  OrderItem,
  Cart,
  CartItem,
  Payment,
  Coupon,
  Setting,
  Address,
  Bottle
};
