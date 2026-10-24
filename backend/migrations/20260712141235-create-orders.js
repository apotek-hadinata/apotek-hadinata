
"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Orders", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      admin_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      total_items_price: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      shipping_cost: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      total_payment: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      order_status: {
        type: Sequelize.ENUM(
          "pending",
          "pending_payment",
          "paid",
          "processing",
          "ready_to_ship",
          "shipping",
          "completed",
          "cancelled",
          "expired",
          "rejected"
        ),
        allowNull: false,
        defaultValue: "pending",
      },
      payment_status: {
        type: Sequelize.ENUM(
          "unpaid",
          "paid",
          "failed",
          "expired",
          "refunded"
        ),
        allowNull: false,
        defaultValue: "unpaid",
      },
      payment_deadline: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      recipient_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      recipient_phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      shipping_address: {
        type: Sequelize.TEXT,
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
    await queryInterface.dropTable("Orders");
  },
};
