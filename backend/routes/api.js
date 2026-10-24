"use strict";
const express = require("express");
const router = express.Router();

const { authenticateToken, isAdmin, isCourier } = require("../middleware/authMiddleware");

const { validateRegister, validateLogin } = require("../middleware/validators/authValidator");
const { validateCategory } = require("../middleware/validators/categoryValidator");
const { validateMedicine, validateBatch } = require("../middleware/validators/medicineValidator");
const { validateCart } = require("../middleware/validators/cartValidator");
const { validateOnlineCheckout, validateOfflineCheckout } = require("../middleware/validators/orderValidator");

const authController = require("../controllers/authController");
const categoryController = require("../controllers/categoryController");
const medicineController = require("../controllers/medicineController");
const cartController = require("../controllers/cartController");
const orderController = require("../controllers/orderController");
const webhookController = require("../controllers/webhookController");
const shippingController = require("../controllers/shippingController");
const chatController = require("../controllers/chatController");
const notificationController = require("../controllers/notificationController");

// --- AUTHENTICATION & PROFILE ---
router.post("/auth/register", validateRegister, authController.register);
router.post("/auth/login", validateLogin, authController.login);
router.get("/auth/profile", authenticateToken, authController.getProfile);
router.put("/auth/profile", authenticateToken, authController.updateProfile);

// --- CATEGORY (OBAT) ---
router.get("/categories", categoryController.getAllCategories);
router.get("/categories/:id", categoryController.getCategoryById);
router.post("/categories", authenticateToken, isAdmin, validateCategory, categoryController.createCategory);
router.put("/categories/:id", authenticateToken, isAdmin, validateCategory, categoryController.updateCategory);
router.delete("/categories/:id", authenticateToken, isAdmin, categoryController.deleteCategory);

// --- MEDICINE & BATCH STOK ---
router.get("/medicines", medicineController.getAllMedicines);
router.get("/medicines/:id", medicineController.getMedicineById);
router.post("/medicines", authenticateToken, isAdmin, validateMedicine, medicineController.createMedicine);
router.put("/medicines/:id", authenticateToken, isAdmin, medicineController.updateMedicine);
router.delete("/medicines/:id", authenticateToken, isAdmin, medicineController.deleteMedicine);
// Batch Stok Obat
router.post("/medicines/batches", authenticateToken, isAdmin, validateBatch, medicineController.addMedicineBatch);
router.put("/medicines/batches/:batchId", authenticateToken, isAdmin, medicineController.updateMedicineBatch);
router.delete("/medicines/batches/:batchId", authenticateToken, isAdmin, medicineController.deleteMedicineBatch);

// --- SHOPPING CART (KERANJANG) ---
router.post("/cart", authenticateToken, validateCart, cartController.addToCart);
router.get("/cart", authenticateToken, cartController.getCart);
router.put("/cart/:id", authenticateToken, cartController.updateCartQuantity);
router.delete("/cart/:id", authenticateToken, cartController.removeFromCart);
router.delete("/cart", authenticateToken, cartController.clearCart);

// --- TRANSACTION & MIDTRANS WEBHOOK ---
router.post("/checkout/online", authenticateToken, validateOnlineCheckout, orderController.createOnlineOrder);
router.post("/checkout/offline", authenticateToken, isAdmin, validateOfflineCheckout, orderController.createOfflineOrder);
router.get("/orders", authenticateToken, isAdmin, orderController.getAllOrders);
router.get("/orders/my-history", authenticateToken, orderController.getMyOrders);
router.get("/orders/:id", authenticateToken, orderController.getOrderById);
router.put("/orders/:id/status", authenticateToken, isAdmin, orderController.updateOrderStatus);
// Webhook Midtrans
router.post("/webhooks/midtrans", webhookController.handleMidtransNotification);

// --- SHIPPING LOGISTICS ---
router.get("/shipping/jobs", authenticateToken, isCourier, shippingController.getAvailableJobs);
router.get("/shipping/my-shipments", authenticateToken, isCourier, shippingController.getMyShipments);
router.put("/shipping/:id/pickup", authenticateToken, isCourier, shippingController.pickupOrder);
router.put("/shipping/:id/status", authenticateToken, isCourier, shippingController.updateShippingStatus);

// --- CUSTOMER SERVICE CHAT ---
router.post("/chats/message", authenticateToken, chatController.sendMessage);
router.get("/chats/history", authenticateToken, chatController.getChatHistory);
router.get("/chats/admin/rooms", authenticateToken, isAdmin, chatController.getAdminChatRooms);
router.get("/chats/admin/history/:roomId", authenticateToken, isAdmin, chatController.getChatHistory);

// --- NOTIFICATIONS SYSTEM ---
router.get("/notifications", authenticateToken, notificationController.getMyNotifications);
router.put("/notifications/:id/read", authenticateToken, notificationController.markAsRead);
router.put("/notifications/read-all", authenticateToken, notificationController.markAllAsRead);
router.delete("/notifications/:id", authenticateToken, notificationController.deleteNotification);

module.exports = router;
