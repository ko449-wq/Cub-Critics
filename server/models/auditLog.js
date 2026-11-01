'use strict';
// audit_log (AL#2, AL#3): admin changes to venues/menus/photos, and login/logout events.
// Never put passwords or session ids in `details`.
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AuditLog extends Model {
    static associate(models) {
      AuditLog.belongsTo(models.User, { foreignKey: 'actor_id', as: 'actor' });
    }
  }

  AuditLog.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      actor_id: { type: DataTypes.INTEGER, allowNull: true },
      event_type: { type: DataTypes.TEXT, allowNull: false },
      entity_type: { type: DataTypes.TEXT, allowNull: true },
      entity_id: { type: DataTypes.INTEGER, allowNull: true },
      ip_address: { type: DataTypes.INET, allowNull: true },
      details: { type: DataTypes.JSONB, allowNull: true },
    },
    {
      sequelize,
      modelName: 'AuditLog',
      tableName: 'audit_log',
      createdAt: 'created_at',
      updatedAt: false,
    }
  );

  return AuditLog;
};
