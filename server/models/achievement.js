'use strict';
// achievements (FR#16, FR#58): badge definitions. Names/thresholds are data (TBD-4).
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Achievement extends Model {
    static associate(models) {
      Achievement.belongsToMany(models.User, {
        through: models.UserAchievement,
        foreignKey: 'achievement_id',
        otherKey: 'user_id',
        as: 'holders',
      });
      Achievement.hasMany(models.UserAchievement, { foreignKey: 'achievement_id', as: 'awards' });
    }
  }

  Achievement.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.TEXT, allowNull: false },
      review_threshold: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
    },
    {
      sequelize,
      modelName: 'Achievement',
      tableName: 'achievements',
      timestamps: false,
    }
  );

  return Achievement;
};
