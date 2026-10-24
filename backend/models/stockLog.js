"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class StockLog extends Model {
    static associate(models) {
      this.belongsTo(models.Medicine, {
        foreignKey: "medicine_id",
      });

      this.belongsTo(models.MedicineBatch, {
        foreignKey: "batch_id",
      });

      this.belongsTo(models.User, {
        foreignKey: "admin_id",
        as: "admin",
      });
    }
  }

  StockLog.init(
    {
      medicine_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      batch_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      admin_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      activity_type: {
        type: DataTypes.ENUM(
          "stock_in",
          "stock_out",
          "adjustment",
          "reservation",
          "release_reservation"
        ),
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      stock_before: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      stock_after: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "StockLog",
      timestamps: true,
      updatedAt: false,
    }
  );

  return StockLog;
};
