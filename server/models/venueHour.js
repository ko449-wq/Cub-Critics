'use strict';
// venue_hours: weekly opening periods in Eastern local time (FR#21, FR#54).
// day_of_week 0 = Sunday ... 6 = Saturday. closes_at < opens_at means past midnight.
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class VenueHour extends Model {
    static associate(models) {
      VenueHour.belongsTo(models.Venue, { foreignKey: 'venue_id', as: 'venue' });
    }
  }

  VenueHour.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      venue_id: { type: DataTypes.INTEGER, allowNull: false },
      day_of_week: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        validate: { min: 0, max: 6 },
      },
      opens_at: { type: DataTypes.TIME, allowNull: true },
      closes_at: { type: DataTypes.TIME, allowNull: true },
      is_closed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    {
      sequelize,
      modelName: 'VenueHour',
      tableName: 'venue_hours',
      timestamps: false,
    }
  );

  return VenueHour;
};
