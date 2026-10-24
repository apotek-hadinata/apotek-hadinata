"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Shippings", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: "Orders",
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
      delivery_batch_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "DeliveryBatches",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      delivery_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      distance: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      shipping_address: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      longitude: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      latitude: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      shipping_status: {
        type: Sequelize.ENUM(
          "pending",
          "assigned",
          "shipping",
          "delivered",
          "failed"
        ),
        allowNull: false,
        defaultValue: "pending",
      },
      shipped_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      delivered_at: {
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

  async down(queryInterface) {
    await queryInterface.dropTable("Shippings");
  },
};
