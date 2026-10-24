"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ChatRoom extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: "user_id" });
      this.hasMany(models.ChatMessage, { foreignKey: "room_id" });
      this.hasMany(models.Notification, { foreignKey: "chat_id" });
    }
  }

  ChatRoom.init(
    {
      user_id: { type: DataTypes.INTEGER, allowNull: false }
    },
    {
      sequelize,
      modelName: "ChatRoom",
      timestamps: true,
    }
  );

  return ChatRoom;
};