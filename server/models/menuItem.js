'use strict';
// menu_items (FR#20, FR#55). Note: DECIMAL columns come back from pg as strings
// (e.g. "8.50"); services should convert for the API.
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MenuItem extends Model {
    static associate(models) {
      MenuItem.belongsTo(models.Venue, { foreignKey: 'venue_id', as: 'venue' });
    }
  }

  MenuItem.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      venue_id: { type: DataTypes.INTEGER, allowNull: false },
      name: { type: DataTypes.TEXT, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      price: { type: DataTypes.DECIMAL(8, 2), allowNull: false, validate: { min: 0 } },
    },
    {
      sequelize,
      modelName: 'MenuItem',
      tableName: 'menu_items',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return MenuItem;
};
