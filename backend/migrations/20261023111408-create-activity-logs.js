
"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ActivityLogs", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
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
      action: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      entity_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      entity_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex("ActivityLogs", ["admin_id"]);
    await queryInterface.addIndex("ActivityLogs", ["action"]);
    await queryInterface.addIndex("ActivityLogs", ["createdAt"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("ActivityLogs");
  },
};
