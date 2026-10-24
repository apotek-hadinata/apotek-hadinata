
"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Medicine extends Model {
    static associate(models) {
      this.belongsTo(models.Category, {
        foreignKey: "category_id",
      });

      this.hasMany(models.MedicineBatch, {
        foreignKey: "medicine_id",
        as: "batches",
      });

      this.hasMany(models.CartItem, {
        foreignKey: "medicine_id",
      });

      this.hasMany(models.OrderItem, {
        foreignKey: "medicine_id",
      });

      this.hasMany(models.StockLog, {
        foreignKey: "medicine_id",
      });
    }
  }

  Medicine.init(
    {
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      desc: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      price: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      SKU_code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      image: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("in stock", "low", "out of stock"),
        defaultValue: "in stock",
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "Medicine",
      timestamps: true,
    }
  );

  return Medicine;
};
