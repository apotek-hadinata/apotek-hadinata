"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("DeliveryBatches", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      delivery_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      batch_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 2,
        },
      },
      capacity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 10,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex(
      "DeliveryBatches",
      ["delivery_date", "batch_number"],
      {
        name: "delivery_batches_date_batch_unique",
        unique: true,
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("DeliveryBatches");
  },
};
