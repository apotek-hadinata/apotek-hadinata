"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: "user_id" });
      this.belongsTo(models.Order, { foreignKey: "order_id" });
      this.belongsTo(models.ChatRoom, { foreignKey: "chat_id" });
      this.belongsTo(models.MedicineBatch, { foreignKey: "batch_id" });
    }
  }

  Notification.init(
    {
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      title: { type: DataTypes.STRING, allowNull: false },
      message: { type: DataTypes.TEXT, allowNull: false },
      type: {
        type: DataTypes.ENUM("new_order", "stock", "near_expiry", "chat", "order_status"),
        allowNull: false,
      },
      is_read: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,},
      order_id: { type: DataTypes.INTEGER, allowNull: true },
      chat_id: { type: DataTypes.INTEGER, allowNull: true },
      batch_id: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      sequelize,
      modelName: "Notification",
      timestamps: true,
      updatedAt: false,
    },
  );

  return Notification;
};
