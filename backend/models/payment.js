
"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    static associate(models) {
      this.belongsTo(models.Order, {
        foreignKey: "order_id",
      });
    }
  }

  Payment.init(
    {
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      payment_method: {
        type: DataTypes.ENUM("QRIS"),
        allowNull: false,
      },
      amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      payment_status: {
        type: DataTypes.ENUM(
          "pending",
          "success",
          "expired",
          "failed",
          "refunded"
        ),
        allowNull: false,
        defaultValue: "pending",
      },
      transaction_reference: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      raw_response: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      qr_string: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      payment_deadline: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Payment",
      timestamps: true,
    }
  );

  return Payment;
};
