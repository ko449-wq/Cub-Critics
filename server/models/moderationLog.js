'use strict';
// moderation_log (FR#59, AL#1): one row per approve/flag/remove decision.
// review_author_id / review_venue_id / review_rating / review_text are a snapshot
// taken when the action happened, so the record survives if the review is deleted.
const { Model } = require('sequelize');
const { MODERATION_ACTION, values } = require('../constants/statuses');

module.exports = (sequelize, DataTypes) => {
  class ModerationLog extends Model {
    static associate(models) {
      ModerationLog.belongsTo(models.User, { foreignKey: 'admin_id', as: 'admin' });
      ModerationLog.belongsTo(models.Review, { foreignKey: 'review_id', as: 'review' });
    }
  }

  ModerationLog.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      admin_id: { type: DataTypes.INTEGER, allowNull: false },
      review_id: { type: DataTypes.INTEGER, allowNull: true },
      action: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: { isIn: [values(MODERATION_ACTION)] },
      },
      reason: { type: DataTypes.TEXT, allowNull: true },
      review_author_id: { type: DataTypes.INTEGER, allowNull: true },
      review_venue_id: { type: DataTypes.INTEGER, allowNull: true },
      review_rating: { type: DataTypes.SMALLINT, allowNull: true },
      review_text: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      sequelize,
      modelName: 'ModerationLog',
      tableName: 'moderation_log',
      createdAt: 'created_at',
      updatedAt: false,
      validate: {
        // FR#44: removing a review requires a recorded reason (also enforced in the database).
        removeNeedsReason() {
          if (this.action === MODERATION_ACTION.REMOVE && !(this.reason || '').trim()) {
            throw new Error('A reason is required when removing a review');
          }
        },
      },
    }
  );

  return ModerationLog;
};
