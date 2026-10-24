"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class OrderStatusHistory extends Model {
    static associate(models) {
      this.belongsTo(models.Order, {
        foreignKey: "order_id",
      });

      this.belongsTo(models.User, {
        foreignKey: "changed_by",
        as: "changed_by_user",
      });
    }
  }

  OrderStatusHistory.init(
    {
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      changed_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      old_status: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      new_status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "OrderStatusHistory",
      timestamps: true,
      createdAt: true,
      updatedAt: false,
    }
  );

  return OrderStatusHistory;
};
