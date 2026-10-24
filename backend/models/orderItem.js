
"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class OrderItem extends Model {
    static associate(models) {
      this.belongsTo(models.Order, {
        foreignKey: "order_id",
      });

      this.belongsTo(models.Medicine, {
        foreignKey: "medicine_id",
      });

      this.hasMany(models.OrderItemBatch, {
        foreignKey: "order_item_id",
      });
    }
  }

  OrderItem.init(
    {
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      medicine_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      medicine_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      SKU_code: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      price_at_purchase: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      subtotal: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "OrderItem",
      timestamps: false,
    }
  );

  return OrderItem;
};
