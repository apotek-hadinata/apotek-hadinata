
"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      this.hasMany(models.Order, {
        foreignKey: "user_id",
        as: "customer_orders",
      });

      this.hasMany(models.Order, {
        foreignKey: "admin_id",
        as: "handled_orders",
      });

      this.hasMany(models.Shipping, {
        foreignKey: "admin_id",
        as: "deliveries",
      });

      this.hasOne(models.ChatRoom, {
        foreignKey: "user_id",
      });

      this.hasMany(models.ChatMessage, {
        foreignKey: "sender_id",
      });

      this.hasMany(models.Notification, {
        foreignKey: "user_id",
      });
    }
  }

  User.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM("admin", "user", "kurir", "pelanggan"),
        allowNull: false,
        defaultValue: "user",
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "User",
      timestamps: true,
    }
  );

  return User;
};
