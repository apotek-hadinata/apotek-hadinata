"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ActivityLog extends Model {
    static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: "admin_id",
        as: "admin",
      });
    }
  }

  ActivityLog.init(
    {
      admin_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      action: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      entity_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      entity_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "ActivityLog",
      timestamps: true,
      createdAt: true,
      updatedAt: false,
    }
  );

  return ActivityLog;
};
