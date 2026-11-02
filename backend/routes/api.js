"use strict";
const express = require("express");
const router = express.Router();

const { authenticateToken, isAdmin, isCourier } = require("../middleware/authMiddleware");
const { uploadMedicinePhoto } = require("../middleware/uploadMiddleware");

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
const addressController = require("../controllers/addressController");
const settingController = require("../controllers/settingController");
const activityLogController = require("../controllers/activityLogController");
const userController = require("../controllers/userController");

// --- AUTHENTICATION & PROFILE ---
router.post("/auth/register", validateRegister, authController.register);
router.post("/auth/login", validateLogin, authController.login);
router.get("/auth/profile", authenticateToken, authController.getProfile);
router.put("/auth/profile", authenticateToken, authController.updateProfile);
router.put("/auth/password", authenticateToken, authController.changePassword);

// --- USER & STAFF MANAGEMENT (ADMIN) ---
router.get("/users", authenticateToken, isAdmin, userController.getAllUsers);
router.post("/users", authenticateToken, isAdmin, userController.createUserByAdmin);
router.put("/users/:id/role", authenticateToken, isAdmin, userController.updateUserRole);

// --- CUSTOMER ADDRESS BOOK (BUKU ALAMAT PELANGGAN) ---
router.get("/addresses", authenticateToken, addressController.getMyAddresses);
router.post("/addresses", authenticateToken, addressController.createAddress);
router.put("/addresses/:id", authenticateToken, addressController.updateAddress);
router.put("/addresses/:id/default", authenticateToken, addressController.setDefaultAddress);
router.delete("/addresses/:id", authenticateToken, addressController.deleteAddress);

// --- SYSTEM SETTINGS (PENGATURAN OPERASIONAL & TARIF ONGKIR) ---
router.get("/settings", settingController.getPublicSettings);
router.get("/settings/admin", authenticateToken, isAdmin, settingController.getAllSettingsAdmin);
router.put("/settings", authenticateToken, isAdmin, settingController.updateSettings);

// --- AUDIT ACTIVITY LOGS (ADMIN AUDIT TRAIL) ---
router.get("/activity-logs", authenticateToken, isAdmin, activityLogController.getActivityLogs);

// --- CATEGORY (OBAT) ---
router.get("/categories", categoryController.getAllCategories);
router.get("/categories/:id", categoryController.getCategoryById);
router.post("/categories", authenticateToken, isAdmin, validateCategory, categoryController.createCategory);
router.put("/categories/:id", authenticateToken, isAdmin, validateCategory, categoryController.updateCategory);
router.delete("/categories/:id", authenticateToken, isAdmin, categoryController.deleteCategory);

// --- MEDICINE, PHOTO UPLOAD & BATCH STOK FEFO ---
router.get("/medicines", medicineController.getAllMedicines);
router.get("/medicines/stock-logs", authenticateToken, isAdmin, medicineController.getStockLogs);
router.post(
  "/medicines/upload-image",
  authenticateToken,
  isAdmin,
  uploadMedicinePhoto.single("image"),
  medicineController.uploadMedicineImage
);
// Batch Stok Obat (diletakkan sebelum /medicines/:id agar tidak tertangkap sebagai parameter :id)
router.post("/medicines/batches", authenticateToken, isAdmin, validateBatch, medicineController.addMedicineBatch);
router.put("/medicines/batches/:batchId", authenticateToken, isAdmin, medicineController.updateMedicineBatch);
router.delete("/medicines/batches/:batchId", authenticateToken, isAdmin, medicineController.deleteMedicineBatch);

router.get("/medicines/:id", medicineController.getMedicineById);
router.post("/medicines", authenticateToken, isAdmin, validateMedicine, medicineController.createMedicine);
router.put("/medicines/:id", authenticateToken, isAdmin, validateMedicine, medicineController.updateMedicine);
router.delete("/medicines/:id", authenticateToken, isAdmin, medicineController.deleteMedicine);

// --- SHOPPING CART (KERANJANG) ---
router.post("/cart", authenticateToken, validateCart, cartController.addToCart);
router.get("/cart", authenticateToken, cartController.getCart);
router.put("/cart/:id", authenticateToken, cartController.updateCartQuantity);
router.delete("/cart/:id", authenticateToken, cartController.removeFromCart);
router.delete("/cart", authenticateToken, cartController.clearCart);

// --- TRANSACTION & MIDTRANS VERIFICATION / WEBHOOK ---
router.post("/checkout/online", authenticateToken, validateOnlineCheckout, orderController.createOnlineOrder);
router.post("/checkout/offline", authenticateToken, isAdmin, validateOfflineCheckout, orderController.createOfflineOrder);
router.get("/orders", authenticateToken, isAdmin, orderController.getAllOrders);
router.get("/orders/my-history", authenticateToken, orderController.getMyOrders);
router.post("/orders/:id/verify-payment", authenticateToken, orderController.verifyOrderPayment);
router.post("/orders/:id/cancel", authenticateToken, orderController.cancelMyOrder);
router.get("/orders/:id", authenticateToken, orderController.getOrderById);
router.put("/orders/:id/status", authenticateToken, isAdmin, orderController.updateOrderStatus);
// Webhook Midtrans
router.post("/webhooks/midtrans", webhookController.handleMidtransNotification);

// --- SHIPPING LOGISTICS & DELIVERY BATCHES ---
router.get("/shipping/jobs", authenticateToken, isCourier, shippingController.getAvailableJobs);
router.get("/shipping/my-shipments", authenticateToken, isCourier, shippingController.getMyShipments);
router.get("/shipping/delivery-batches", authenticateToken, shippingController.getDeliveryBatches);
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
