'use strict';
// venue_photos (FR#22, FR#51, FR#52, FR#60). Stores a storage key, never a full URL;
// storageService turns the key into a URL for whichever host we end up on (TBD-2).
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class VenuePhoto extends Model {
    static associate(models) {
      VenuePhoto.belongsTo(models.Venue, { foreignKey: 'venue_id', as: 'venue' });
      VenuePhoto.belongsTo(models.User, { foreignKey: 'uploaded_by', as: 'uploader' });
    }
  }

  VenuePhoto.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      venue_id: { type: DataTypes.INTEGER, allowNull: false },
      storage_key: { type: DataTypes.TEXT, allowNull: false },
      original_filename: { type: DataTypes.TEXT, allowNull: true },
      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      uploaded_by: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      sequelize,
      modelName: 'VenuePhoto',
      tableName: 'venue_photos',
      createdAt: 'created_at',
      updatedAt: false,
    }
  );

  return VenuePhoto;
};
