'use strict';
// categories (FR#34, SQ#6): admin-editable venue categories.
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Category extends Model {
    static associate(models) {
      Category.hasMany(models.Venue, { foreignKey: 'category_id', as: 'venues' });
    }
  }

  Category.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.TEXT, allowNull: false },
    },
    {
      sequelize,
      modelName: 'Category',
      tableName: 'categories',
      createdAt: 'created_at',
      updatedAt: false,
    }
  );

  return Category;
};
