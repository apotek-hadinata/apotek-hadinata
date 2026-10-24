"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class DeliveryBatch extends Model {}

  DeliveryBatch.init(
    {
      delivery_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      batch_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 2,
          isInt: true,
        },
      },
      capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10,
        validate: {
          min: 1,
          isInt: true,
        },
      },
    },
    {
      sequelize,
      modelName: "DeliveryBatch",
      tableName: "DeliveryBatches",
      timestamps: true,
    }
  );

  return DeliveryBatch;
};
