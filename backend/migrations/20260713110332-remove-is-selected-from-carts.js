module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("CartItems", "is_selected");
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("CartsItems", "is_selected", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
  },
};
