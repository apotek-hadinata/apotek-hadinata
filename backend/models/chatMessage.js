"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ChatMessage extends Model {
    static associate(models) {
      this.belongsTo(models.ChatRoom, { foreignKey: "room_id" });
      this.belongsTo(models.User, { foreignKey: "sender_id" });
    }
  }

  ChatMessage.init(
    {
      room_id: { type: DataTypes.INTEGER, allowNull: false },
      sender_id: { type: DataTypes.INTEGER, allowNull: false },
      message: { type: DataTypes.TEXT, allowNull: false },
      is_read: { type: DataTypes.BOOLEAN,allowNull: false,defaultValue: false,},
    },
    {
      sequelize,
      modelName: "ChatMessage",
      timestamps: true,
      updatedAt: false,
    },
  );

  return ChatMessage;
};
