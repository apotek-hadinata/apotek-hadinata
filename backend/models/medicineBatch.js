
"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class MedicineBatch extends Model {
    static associate(models) {
      this.belongsTo(models.Medicine, {
        foreignKey: "medicine_id",
      });

      this.hasMany(models.Notification, {
        foreignKey: "batch_id",
      });

      this.hasMany(models.OrderItemBatch, {
        foreignKey: "batch_id",
      });

      this.hasMany(models.StockLog, {
        foreignKey: "batch_id",
      });
    }
  }

  MedicineBatch.init(
    {
      medicine_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      batch_number: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      expiry_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      reserved_stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: "MedicineBatch",
      timestamps: true,
    }
  );

  return MedicineBatch;
};
