'use strict';
// users (FR#53). password_hash is excluded from every query by default (SC#2, SC#9);
// call User.scope('withPassword') only inside the login / password-check code.
const { Model } = require('sequelize');
const { ROLE } = require('../constants/roles');
const { USER_STATUS, values } = require('../constants/statuses');
const { BIO_MAX_LENGTH } = require('../constants/limits');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Review, { foreignKey: 'user_id', as: 'reviews' });
      User.hasMany(models.Report, { foreignKey: 'reporter_id', as: 'reportsFiled' });
      User.hasMany(models.VenuePhoto, { foreignKey: 'uploaded_by', as: 'uploadedPhotos' });
      User.belongsToMany(models.Achievement, {
        through: models.UserAchievement,
        foreignKey: 'user_id',
        otherKey: 'achievement_id',
        as: 'achievements',
      });
      User.hasMany(models.UserAchievement, { foreignKey: 'user_id', as: 'userAchievements' });
    }
  }

  User.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      email: { type: DataTypes.TEXT, allowNull: false, validate: { isEmail: true } },
      username: { type: DataTypes.TEXT, allowNull: false },
      password_hash: { type: DataTypes.TEXT, allowNull: false },
      role: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ROLE.STUDENT,
        validate: { isIn: [values(ROLE)] },
      },
      bio: { type: DataTypes.STRING(BIO_MAX_LENGTH), allowNull: true },
      profile_picture_key: { type: DataTypes.TEXT, allowNull: true },
      tos_version: { type: DataTypes.TEXT, allowNull: false },
      tos_accepted_at: { type: DataTypes.DATE, allowNull: false },
      status: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: USER_STATUS.ACTIVE,
        validate: { isIn: [values(USER_STATUS)] },
      },
      failed_login_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      locked_until: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      defaultScope: { attributes: { exclude: ['password_hash'] } },
      scopes: {
        withPassword: { attributes: { include: ['password_hash'] } },
        // What other people may see (FR#15, SF#4): never email, role, hash or lockout data.
        publicProfile: {
          attributes: ['id', 'username', 'bio', 'profile_picture_key', 'created_at'],
        },
      },
    }
  );

  return User;
};
