"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class OrderItemBatch extends Model {
    static associate(models) {
      this.belongsTo(models.OrderItem, {
        foreignKey: "order_item_id",
      });

      this.belongsTo(models.MedicineBatch, {
        foreignKey: "batch_id",
      });
    }
  }

  OrderItemBatch.init(
    {
      order_item_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      batch_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
        },
      },
    },
    {
      sequelize,
      modelName: "OrderItemBatch",
      timestamps: true,
    }
  );

  return OrderItemBatch;
};
