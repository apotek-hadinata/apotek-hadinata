"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex("Users", ["role"], {
      name: "idx_users_role",
    });

    await queryInterface.addIndex("Medicines", ["category_id"], {
      name: "idx_medicines_category",
    });

    await queryInterface.addIndex("MedicineBatches", ["medicine_id"], {
      name: "idx_batches_medicine",
    });

    await queryInterface.addIndex("MedicineBatches", ["expiry_date"], {
      name: "idx_batches_expiry",
    });

    await queryInterface.addIndex("CartItems", ["user_id"], {
      name: "idx_cartitems_user",
    });

    await queryInterface.addIndex("Orders", ["user_id"], {
      name: "idx_orders_user",
    });

    await queryInterface.addIndex("Orders", ["order_status"], {
      name: "idx_orders_status",
    });

    await queryInterface.addIndex("Orders", ["payment_status"], {
      name: "idx_orders_payment_status",
    });

    await queryInterface.addIndex("Shippings", ["admin_id"], {
      name: "idx_shippings_admin",
    });

    await queryInterface.addIndex(
      "Shippings",
      ["delivery_date", "delivery_batch_id"],
      {
        name: "idx_shippings_delivery_batch",
      }
    );

    await queryInterface.addIndex("OrderItems", ["order_id"], {
      name: "idx_orderitems_order",
    });

    await queryInterface.addIndex("Payments", ["order_id"], {
      name: "idx_payments_order",
    });

    await queryInterface.addIndex("ChatRooms", ["user_id"], {
      name: "idx_chatrooms_user",
    });

    await queryInterface.addIndex("ChatMessages", ["room_id"], {
      name: "idx_messages_room",
    });

    await queryInterface.addIndex(
      "Notifications",
      ["user_id", "is_read"],
      {
        name: "idx_notifications_user_unread",
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("Users", "idx_users_role");
    await queryInterface.removeIndex("Medicines", "idx_medicines_category");
    await queryInterface.removeIndex("MedicineBatches", "idx_batches_medicine");
    await queryInterface.removeIndex("MedicineBatches", "idx_batches_expiry");
    await queryInterface.removeIndex("CartItems", "idx_cartitems_user");
    await queryInterface.removeIndex("Orders", "idx_orders_user");
    await queryInterface.removeIndex("Orders", "idx_orders_status");
    await queryInterface.removeIndex("Orders", "idx_orders_payment_status");
    await queryInterface.removeIndex("Shippings", "idx_shippings_admin");
    await queryInterface.removeIndex("Shippings", "idx_shippings_delivery_batch");
    await queryInterface.removeIndex("OrderItems", "idx_orderitems_order");
    await queryInterface.removeIndex("Payments", "idx_payments_order");
    await queryInterface.removeIndex("ChatRooms", "idx_chatrooms_user");
    await queryInterface.removeIndex("ChatMessages", "idx_messages_room");
    await queryInterface.removeIndex("Notifications", "idx_notifications_user_unread");
  },
};
