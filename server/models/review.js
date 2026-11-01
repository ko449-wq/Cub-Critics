'use strict';
// reviews (FR#24-FR#30, FR#56). One per student per venue is enforced by the database.
// edited_at is set by the review service when a student edits (FR#28); there is no
// updated_at, so status changes by moderators do not look like edits.
const { Model } = require('sequelize');
const { REVIEW_STATUS, values } = require('../constants/statuses');
const { RATING_MIN, RATING_MAX, REVIEW_MAX_LENGTH } = require('../constants/limits');

module.exports = (sequelize, DataTypes) => {
  class Review extends Model {
    static associate(models) {
      Review.belongsTo(models.User, { foreignKey: 'user_id', as: 'author' });
      Review.belongsTo(models.Venue, { foreignKey: 'venue_id', as: 'venue' });
      Review.hasMany(models.Report, { foreignKey: 'review_id', as: 'reports' });
      Review.hasMany(models.ModerationLog, { foreignKey: 'review_id', as: 'moderationEntries' });
    }
  }

  Review.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      venue_id: { type: DataTypes.INTEGER, allowNull: false },
      rating: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        validate: { min: RATING_MIN, max: RATING_MAX, isInt: true },
      },
      body: { type: DataTypes.STRING(REVIEW_MAX_LENGTH), allowNull: true },
      status: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: REVIEW_STATUS.PUBLISHED,
        validate: { isIn: [values(REVIEW_STATUS)] },
      },
      edited_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      modelName: 'Review',
      tableName: 'reviews',
      createdAt: 'created_at',
      updatedAt: false,
    }
  );

  return Review;
};
