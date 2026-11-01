'use strict';
// user_achievements (FR#58): which student earned which badge, and when.
// Composite primary key (user_id, achievement_id), so a badge can only be earned once.
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserAchievement extends Model {
    static associate(models) {
      UserAchievement.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      UserAchievement.belongsTo(models.Achievement, {
        foreignKey: 'achievement_id',
        as: 'achievement',
      });
    }
  }

  UserAchievement.init(
    {
      user_id: { type: DataTypes.INTEGER, primaryKey: true },
      achievement_id: { type: DataTypes.INTEGER, primaryKey: true },
      earned_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      modelName: 'UserAchievement',
      tableName: 'user_achievements',
      timestamps: false,
    }
  );

  return UserAchievement;
};
