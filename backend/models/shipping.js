"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Shipping extends Model {
    static associate(models) {
      this.belongsTo(models.Order, {
        foreignKey: "order_id",
      });

      this.belongsTo(models.User, {
        foreignKey: "admin_id",
        as: "admin",
      });

      this.belongsTo(models.DeliveryBatch, {
        foreignKey: "delivery_batch_id",
        as: "deliveryBatch",
      });
    }
  }

  Shipping.init(
    {
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
      admin_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      delivery_batch_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      delivery_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      distance: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      shipping_address: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      longitude: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      latitude: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      shipping_status: {
        type: DataTypes.ENUM(
          "pending",
          "assigned",
          "shipping",
          "delivered",
          "failed"
        ),
        allowNull: false,
        defaultValue: "pending",
      },
      shipped_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      delivered_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Shipping",
      tableName: "Shippings",
      timestamps: true,
    }
  );

  return Shipping;
};
