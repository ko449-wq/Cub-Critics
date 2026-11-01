'use strict';
// reports (FR#31, FR#57). A student can report a given review once.
const { Model } = require('sequelize');
const { REPORT_STATUS, REPORT_REASON, values } = require('../constants/statuses');

module.exports = (sequelize, DataTypes) => {
  class Report extends Model {
    static associate(models) {
      Report.belongsTo(models.Review, { foreignKey: 'review_id', as: 'review' });
      Report.belongsTo(models.User, { foreignKey: 'reporter_id', as: 'reporter' });
    }
  }

  Report.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      review_id: { type: DataTypes.INTEGER, allowNull: false },
      reporter_id: { type: DataTypes.INTEGER, allowNull: false },
      reason: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: { isIn: [values(REPORT_REASON)] },
      },
      comment: { type: DataTypes.TEXT, allowNull: true },
      status: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: REPORT_STATUS.OPEN,
        validate: { isIn: [values(REPORT_STATUS)] },
      },
      closed_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      modelName: 'Report',
      tableName: 'reports',
      createdAt: 'created_at',
      updatedAt: false,
    }
  );

  return Report;
};
