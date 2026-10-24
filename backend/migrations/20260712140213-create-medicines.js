
"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Medicines", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Categories",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      desc: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      price: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      SKU_code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      image: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("in stock", "low", "out of stock"),
        defaultValue: "in stock",
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
    await queryInterface.dropTable("Medicines");
  },
};
