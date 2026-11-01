'use strict';
// venue_special_hours: date-specific overrides, e.g. holidays (FR#54).
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class VenueSpecialHour extends Model {
    static associate(models) {
      VenueSpecialHour.belongsTo(models.Venue, { foreignKey: 'venue_id', as: 'venue' });
    }
  }

  VenueSpecialHour.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      venue_id: { type: DataTypes.INTEGER, allowNull: false },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      opens_at: { type: DataTypes.TIME, allowNull: true },
      closes_at: { type: DataTypes.TIME, allowNull: true },
      is_closed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      note: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      sequelize,
      modelName: 'VenueSpecialHour',
      tableName: 'venue_special_hours',
      timestamps: false,
    }
  );

  return VenueSpecialHour;
};
