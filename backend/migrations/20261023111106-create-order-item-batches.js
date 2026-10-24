"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("OrderItemBatches", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      order_item_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "OrderItems",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      batch_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "MedicineBatches",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
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

    await queryInterface.sequelize.query(
      "ALTER TABLE `OrderItemBatches` ADD CONSTRAINT `order_item_batches_quantity_min_check` CHECK (`quantity` >= 1)"
    );

    await queryInterface.addIndex("OrderItemBatches", ["order_item_id"]);
    await queryInterface.addIndex("OrderItemBatches", ["batch_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("OrderItemBatches");
  },
};
