"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Reconcile OrderItems columns (medicine_name, SKU_code, subtotal)
    const orderItemsDesc = await queryInterface.describeTable("OrderItems");

    if (!orderItemsDesc.medicine_name) {
      await queryInterface.addColumn("OrderItems", "medicine_name", {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "Sediaan Obat",
      });
    }

    if (!orderItemsDesc.SKU_code) {
      await queryInterface.addColumn("OrderItems", "SKU_code", {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "MED-OBAT",
      });
    }

    if (!orderItemsDesc.subtotal) {
      await queryInterface.addColumn("OrderItems", "subtotal", {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
      await queryInterface.sequelize.query(
        "UPDATE `OrderItems` SET `subtotal` = `quantity` * `price_at_purchase` WHERE `subtotal` = 0"
      );
    }

    // 2. Reconcile Orders ENUM definitions (order_status & payment_status)
    await queryInterface.changeColumn("Orders", "order_status", {
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
    });

    await queryInterface.changeColumn("Orders", "payment_status", {
      type: Sequelize.ENUM("unpaid", "paid", "failed", "expired", "refunded"),
      allowNull: false,
      defaultValue: "unpaid",
    });

    // 3. Reconcile Payments columns & ENUM definitions
    const paymentsDesc = await queryInterface.describeTable("Payments");

    if (!paymentsDesc.payment_deadline) {
      await queryInterface.addColumn("Payments", "payment_deadline", {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    await queryInterface.changeColumn("Payments", "payment_method", {
      type: Sequelize.ENUM("QRIS", "COD", "CASH"),
      allowNull: false,
      defaultValue: "QRIS",
    });

    await queryInterface.changeColumn("Payments", "payment_status", {
      type: Sequelize.ENUM("pending", "success", "expired", "failed", "refunded"),
      allowNull: false,
      defaultValue: "pending",
    });

    // 4. Reconcile Shippings columns (admin_id, delivery_batch_id, delivery_date) & ENUM
    const shippingsDesc = await queryInterface.describeTable("Shippings");

    if (!shippingsDesc.admin_id) {
      await queryInterface.addColumn("Shippings", "admin_id", {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });

      if (shippingsDesc.courier_id) {
        await queryInterface.sequelize.query(
          "UPDATE `Shippings` SET `admin_id` = `courier_id` WHERE `admin_id` IS NULL AND `courier_id` IS NOT NULL"
        );
      }
    }

    if (!shippingsDesc.delivery_batch_id) {
      await queryInterface.addColumn("Shippings", "delivery_batch_id", {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }

    if (!shippingsDesc.delivery_date) {
      await queryInterface.addColumn("Shippings", "delivery_date", {
        type: Sequelize.DATEONLY,
        allowNull: true,
      });
    }

    await queryInterface.changeColumn("Shippings", "shipping_status", {
      type: Sequelize.ENUM("pending", "assigned", "pickup", "shipping", "delivered", "failed"),
      allowNull: false,
      defaultValue: "pending",
    });
  },

  async down() {
    // Non-destructive reconciliation migration; safe no-op on down to preserve transactional data
  },
};

