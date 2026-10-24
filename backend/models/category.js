
"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Category extends Model {
    static associate(models) {
      this.hasMany(models.Medicine, {
        foreignKey: "category_id",
      });
    }
  }

  Category.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      desc: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Category",
      timestamps: false,
    }
  );

  return Category;
};
