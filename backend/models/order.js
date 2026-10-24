
"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "customer",
      });

      this.belongsTo(models.User, {
        foreignKey: "admin_id",
        as: "handled_by",
      });

      this.hasOne(models.Shipping, {
        foreignKey: "order_id",
      });

      this.hasMany(models.OrderItem, {
        foreignKey: "order_id",
        as: "items",
      });

      this.hasMany(models.Payment, {
        foreignKey: "order_id",
      });

      this.hasMany(models.Notification, {
        foreignKey: "order_id",
      });

      this.hasMany(models.OrderStatusHistory, {
        foreignKey: "order_id",
      });
    }
  }

  Order.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      admin_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      total_items_price: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      shipping_cost: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      total_payment: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      order_status: {
        type: DataTypes.ENUM(
          "pending",
          "pending_payment",
          "paid",
          "processing",
          "ready_to_ship",
          "shipping",
          "completed",
          "cancelled",
          "expired",
          "rejected"
        ),
        allowNull: false,
        defaultValue: "pending",
      },
      payment_status: {
        type: DataTypes.ENUM(
          "unpaid",
          "paid",
          "failed",
          "expired",
          "refunded"
        ),
        allowNull: false,
        defaultValue: "unpaid",
      },
      payment_deadline: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      recipient_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      recipient_phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      shipping_address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Order",
      timestamps: true,
    }
  );

  return Order;
};
