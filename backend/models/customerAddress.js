"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class CustomerAddress extends Model {
    static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "customer",
      });
    }
  }

  CustomerAddress.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      label: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Rumah",
      },
      recipient_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      recipient_phone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      address: {
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
      is_default: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "CustomerAddress",
      tableName: "CustomerAddresses",
      timestamps: true,
    }
  );

  return CustomerAddress;
};
