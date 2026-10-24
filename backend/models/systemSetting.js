"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class SystemSetting extends Model {
    static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: "updated_by",
        as: "updated_by_user",
      });
    }
  }

  SystemSetting.init(
    {
      setting_key: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      setting_value: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "SystemSetting",
      timestamps: true,
    }
  );

  return SystemSetting;
};
