// Unified API Client Service for Apotek Hadinata

export const API_BASE_URL = "http://localhost:3000/api";

export const getToken = () => localStorage.getItem("apotek_token");
export const setToken = (token) => localStorage.setItem("apotek_token", token);
export const removeToken = () => localStorage.removeItem("apotek_token");

export const getUser = () => {
  const userStr = localStorage.getItem("apotek_user");
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};
export const setUser = (user) => localStorage.setItem("apotek_user", JSON.stringify(user));
export const removeUser = () => localStorage.removeItem("apotek_user");

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `HTTP Error ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  register: (body) => request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  getProfile: () => request("/auth/profile"),
  updateProfile: (body) => request("/auth/profile", { method: "PUT", body: JSON.stringify(body) }),

  // Categories
  getCategories: () => request("/categories"),
  getCategoryById: (id) => request(`/categories/${id}`),
  createCategory: (body) => request("/categories", { method: "POST", body: JSON.stringify(body) }),
  updateCategory: (id, body) => request(`/categories/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: "DELETE" }),

  // Medicines & Batches
  getMedicines: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/medicines${query ? `?${query}` : ""}`);
  },
  getMedicineById: (id) => request(`/medicines/${id}`),
  createMedicine: (body) => request("/medicines", { method: "POST", body: JSON.stringify(body) }),
  updateMedicine: (id, body) => request(`/medicines/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteMedicine: (id) => request(`/medicines/${id}`, { method: "DELETE" }),

  addMedicineBatch: (body) => request("/medicines/batches", { method: "POST", body: JSON.stringify(body) }),
  updateMedicineBatch: (batchId, body) => request(`/medicines/batches/${batchId}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteMedicineBatch: (batchId) => request(`/medicines/batches/${batchId}`, { method: "DELETE" }),

  // Cart
  getCart: () => request("/cart"),
  addToCart: (medicine_id, quantity) => request("/cart", { method: "POST", body: JSON.stringify({ medicine_id, quantity }) }),
  updateCart: (id, quantity) => request(`/cart/${id}`, { method: "PUT", body: JSON.stringify({ quantity }) }),
  removeFromCart: (id) => request(`/cart/${id}`, { method: "DELETE" }),
  clearCart: () => request("/cart", { method: "DELETE" }),

  // Orders
  checkoutOnline: (body) => request("/checkout/online", { method: "POST", body: JSON.stringify(body) }),
  getMyOrders: () => request("/orders/my-history"),
  getAllOrders: () => request("/orders"),
  getOrderById: (id) => request(`/orders/${id}`),
  updateOrderStatus: (id, order_status) => request(`/orders/${id}/status`, { method: "PUT", body: JSON.stringify({ order_status }) }),

  // Shipping
  getAvailableJobs: () => request("/shipping/jobs"),
  getMyShipments: () => request("/shipping/my-shipments"),
  pickupShipping: (id) => request(`/shipping/${id}/pickup`, { method: "PUT" }),
  updateShippingStatus: (id, shipping_status) => request(`/shipping/${id}/status`, { method: "PUT", body: JSON.stringify({ shipping_status }) }),

  // Chat
  sendMessage: (body) => request("/chats/message", { method: "POST", body: JSON.stringify(body) }),
  getChatHistory: () => request("/chats/history"),
  getAdminChatRooms: () => request("/chats/admin/rooms"),
  getAdminChatHistory: (roomId) => request(`/chats/admin/history/${roomId}`),

  // Notifications
  getNotifications: () => request("/notifications"),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: "PUT" }),
  markAllNotificationsRead: () => request("/notifications/read-all", { method: "PUT" }),
  deleteNotification: (id) => request(`/notifications/${id}`, { method: "DELETE" }),
};
