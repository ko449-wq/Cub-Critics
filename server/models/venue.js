'use strict';
// venues (FR#54). Venues are deactivated, never deleted (FR#47).
const { Model } = require('sequelize');
const { VENUE_STATUS, values } = require('../constants/statuses');

module.exports = (sequelize, DataTypes) => {
  class Venue extends Model {
    static associate(models) {
      Venue.belongsTo(models.Category, { foreignKey: 'category_id', as: 'category' });
      Venue.hasMany(models.VenueHour, { foreignKey: 'venue_id', as: 'hours' });
      Venue.hasMany(models.VenueSpecialHour, { foreignKey: 'venue_id', as: 'specialHours' });
      Venue.hasMany(models.VenuePhoto, { foreignKey: 'venue_id', as: 'photos' });
      Venue.hasMany(models.MenuItem, { foreignKey: 'venue_id', as: 'menuItems' });
      Venue.hasMany(models.Review, { foreignKey: 'venue_id', as: 'reviews' });
    }
  }

  Venue.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.TEXT, allowNull: false },
      category_id: { type: DataTypes.INTEGER, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      location: { type: DataTypes.TEXT, allowNull: true },
      status: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: VENUE_STATUS.ACTIVE,
        validate: { isIn: [values(VENUE_STATUS)] },
      },
    },
    {
      sequelize,
      modelName: 'Venue',
      tableName: 'venues',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return Venue;
};
