"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("StockLogs", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      medicine_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Medicines",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      batch_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "MedicineBatches",
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
      activity_type: {
        type: Sequelize.ENUM(
          "stock_in",
          "stock_out",
          "adjustment",
          "reservation",
          "release_reservation"
        ),
        allowNull: false,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      stock_before: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      stock_after: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex("StockLogs", ["medicine_id"]);
    await queryInterface.addIndex("StockLogs", ["batch_id"]);
    await queryInterface.addIndex("StockLogs", ["admin_id"]);
    await queryInterface.addIndex("StockLogs", ["createdAt"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("StockLogs");
  },
};
