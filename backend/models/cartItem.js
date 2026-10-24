
"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class CartItem extends Model {
    static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: "user_id",
      });

      this.belongsTo(models.Medicine, {
        foreignKey: "medicine_id",
      });
    }
  }

  CartItem.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      medicine_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      is_selected: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "CartItem",
      timestamps: false,
    }
  );

  return CartItem;
};
