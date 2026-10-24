
"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Payments", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Orders",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      payment_method: {
        type: Sequelize.ENUM("QRIS"),
        allowNull: false,
      },
      amount: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      payment_status: {
        type: Sequelize.ENUM(
          "pending",
          "success",
          "expired",
          "failed",
          "refunded"
        ),
        allowNull: false,
        defaultValue: "pending",
      },
      transaction_reference: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      raw_response: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      qr_string: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      payment_deadline: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Payments");
  },
};
