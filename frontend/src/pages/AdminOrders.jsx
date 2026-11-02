import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { printOrderReceipt, printPosReceipt } from "../utils/printReceipt";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  Package,
  Eye,
  X,
  RefreshCw,
  CreditCard,
  MapPin,
  Phone,
  User,
  Plus,
  Minus,
  Receipt,
  AlertTriangle,
  Calculator,
  Banknote,
  Printer,
  Download,
} from "lucide-react";

// Helper untuk membaca metode pembayaran asli dari Payment.raw_response / transaction_reference
const extractPaymentMethodLabel = (order) => {
  const payment = (order?.Payments && order.Payments[0]) || null;
  if (!payment) return "QRIS / Midtrans";

  if (payment.raw_response) {
    try {
      const parsed = JSON.parse(payment.raw_response);
      if (parsed.source === "POS_OFFLINE") {
        return `POS (${parsed.method || "CASH"})`;
      }
      if (parsed.method === "COD") {
        return "COD (Bayar di Tempat)";
      }
      if (parsed.method) {
        return parsed.method === "QRIS" ? "Midtrans / QRIS" : parsed.method;
      }
    } catch {
      // ignore JSON parse error
    }
  }

  if (payment.transaction_reference?.startsWith("COD-")) return "COD (Bayar di Tempat)";
  if (payment.transaction_reference?.startsWith("POS-")) return "POS Kasir";
  return "Midtrans / QRIS";
};

const isPosOrder = (order) => {
  const payment = (order?.Payments && order.Payments[0]) || null;
  if (payment?.transaction_reference?.startsWith("POS-")) return true;
  return (order?.shipping_address || "").includes("POS Offline");
};

export const AdminOrders = ({ onBack, initialMode = "online_orders" }) => {
  const [activeMode, setActiveMode] = useState(initialMode); // 'online_orders' | 'pos_cashier'
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [notification, setNotification] = useState({ type: "", message: "" });

  // POS Kasir Offline State
  const [medicines, setMedicines] = useState([]);
  const [posSearch, setPosSearch] = useState("");
  const [posCart, setPosCart] = useState([]);
  const [posCustomerName, setPosCustomerName] = useState("Pelanggan Umum");
  const [posPaymentMethod, setPosPaymentMethod] = useState("CASH");
  const [posAmountPaid, setPosAmountPaid] = useState("");
  const [posSubmitting, setPosSubmitting] = useState(false);
  const [posReceipt, setPosReceipt] = useState(null);

  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: "", message: "" }), 4000);
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await api.getAllOrders();
      if (res?.data && Array.isArray(res.data)) {
        setOrders(res.data);
      } else {
        setOrders([]);
      }
    } catch (err) {
      notify("error", err.message || "Gagal memuat daftar pesanan");
    } finally {
      setLoading(false);
    }
  };

  const loadMedicinesForPos = async () => {
    try {
      const res = await api.getMedicines();
      if (res?.data && Array.isArray(res.data)) {
        setMedicines(res.data);
      }
    } catch (err) {
      console.error("Gagal memuat katalog POS:", err);
    }
  };

  useEffect(() => {
    loadOrders();
    loadMedicinesForPos();
  }, []);

  const handleUpdateStatus = async (orderId, newStatus, paymentStatus) => {
    const confirmLabels = {
      processing: `Setujui (ACC) Pesanan #${orderId} dan teruskan ke Pool Kurir Internal?`,
      completed: `Tandai Pesanan #${orderId} sebagai Selesai & Lunas?`,
      cancelled: `Batalkan Pesanan #${orderId}? Stok batch obat akan dikembalikan secara otomatis.`,
    };

    if (confirmLabels[newStatus] && !window.confirm(confirmLabels[newStatus])) {
      return;
    }

    try {
      setActionId(orderId);
      await api.updateOrderStatus(orderId, newStatus, paymentStatus);

      const successLabels = {
        processing: `Pesanan #${orderId} berhasil di-ACC dan masuk antrean tugas Kurir!`,
        completed: `Pesanan #${orderId} telah ditandai selesai.`,
        cancelled: `Pesanan #${orderId} dibatalkan dan stok FEFO telah dikembalikan.`,
      };
      notify("success", successLabels[newStatus] || `Status pesanan #${orderId} diperbarui.`);

      await loadOrders();
      await loadMedicinesForPos();

      if (selectedOrder && selectedOrder.id === orderId) {
        const detail = await api.getOrderById(orderId);
        if (detail?.data) setSelectedOrder(detail.data);
      }
    } catch (err) {
      notify("error", err.message || "Gagal memperbarui status pesanan");
    } finally {
      setActionId(null);
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case "pending":
      case "pending_payment":
        return (
          <span className="badge badge-admin">
            <Clock size={12} /> Menunggu ACC
          </span>
        );
      case "paid":
        return (
          <span className="badge badge-user">
            <CheckCircle2 size={12} /> Dibayar (Siap ACC)
          </span>
        );
      case "processing":
      case "ready_to_ship":
        return (
          <span className="badge badge-kurir">
            <Package size={12} /> Menunggu Pickup Kurir
          </span>
        );
      case "shipping":
        return (
          <span className="badge badge-kurir" style={{ background: "#dbeafe", color: "#1d4ed8", borderColor: "#93c5fd" }}>
            <Truck size={12} /> Sedang Diantar
          </span>
        );
      case "completed":
        return (
          <span className="badge badge-user">
            <CheckCircle2 size={12} /> Selesai
          </span>
        );
      case "cancelled":
      case "rejected":
        return (
          <span className="badge badge-danger">
            <XCircle size={12} /> Dibatalkan
          </span>
        );
      default:
        return <span className="badge">{status}</span>;
    }
  };

  // Filtered Orders
  const filteredOrders = orders.filter((ord) => {
    if (statusFilter !== "all") {
      if (statusFilter === "pending" && !["pending", "pending_payment", "paid"].includes(ord.order_status)) {
        return false;
      }
      if (statusFilter === "processing" && !["processing", "ready_to_ship"].includes(ord.order_status)) {
        return false;
      }
      if (statusFilter === "shipping" && ord.order_status !== "shipping") {
        return false;
      }
      if (statusFilter === "completed" && ord.order_status !== "completed") {
        return false;
      }
      if (statusFilter === "cancelled" && !["cancelled", "rejected"].includes(ord.order_status)) {
        return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const customerName = (ord.recipient_name || ord.customer?.name || ord.User?.name || "").toLowerCase();
      const addr = (ord.shipping_address || ord.Shipping?.shipping_address || "").toLowerCase();
      const idMatch = String(ord.id).includes(q);
      return idMatch || customerName.includes(q) || addr.includes(q);
    }

    return true;
  });

  // KPI Metrics
  const waitingAccCount = orders.filter((o) => ["pending", "pending_payment", "paid"].includes(o.order_status)).length;
  const activeDeliveryCount = orders.filter((o) =>
    ["processing", "ready_to_ship", "shipping"].includes(o.order_status)
  ).length;
  const completedOrders = orders.filter((o) => o.order_status === "completed");
  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total_payment || 0), 0);

  // ==========================================
  // POS KASIR OFFLINE HANDLERS
  // ==========================================
  const getMedTotalStock = (med) =>
    (med.batches || []).reduce((sum, b) => sum + (b.stock || 0), 0);

  const handleAddPosItem = (med) => {
    const maxStock = getMedTotalStock(med);
    if (maxStock <= 0) {
      notify("error", `Stok obat "${med.name}" habis.`);
      return;
    }

    setPosCart((prev) => {
      const existing = prev.find((i) => i.medicine_id === med.id);
      if (existing) {
        if (existing.quantity + 1 > maxStock) {
          notify("error", `Stok "${med.name}" hanya tersisa ${maxStock} unit.`);
          return prev;
        }
        return prev.map((i) =>
          i.medicine_id === med.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          medicine_id: med.id,
          name: med.name,
          SKU_code: med.SKU_code,
          price: med.price,
          maxStock,
          quantity: 1,
        },
      ];
    });
  };

  const handlePosQtyDelta = (medicineId, delta) => {
    setPosCart((prev) =>
      prev
        .map((item) => {
          if (item.medicine_id !== medicineId) return item;
          const nextQty = item.quantity + delta;
          if (nextQty <= 0) return null;
          if (nextQty > item.maxStock) {
            notify("error", `Maksimal stok tersedia: ${item.maxStock} unit`);
            return item;
          }
          return { ...item, quantity: nextQty };
        })
        .filter(Boolean)
    );
  };

  const posTotal = posCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const numericPaid = Number(posAmountPaid) || 0;
  const posChange = numericPaid - posTotal;

  const handleSubmitPosCheckout = async (e) => {
    e.preventDefault();
    if (posCart.length === 0) {
      notify("error", "Tambahkan minimal 1 obat ke keranjang kasir.");
      return;
    }
    const effectivePaid = posPaymentMethod === "QRIS" ? posTotal : numericPaid;
    if (effectivePaid < posTotal) {
      notify("error", "Uang tunai yang diterima kurang dari total tagihan.");
      return;
    }

    try {
      setPosSubmitting(true);
      const res = await api.checkoutOffline({
        customer_name: posCustomerName.trim() || "Pelanggan Umum",
        payment_method: posPaymentMethod,
        amount_paid: effectivePaid,
        items: posCart.map((i) => ({
          medicine_id: i.medicine_id,
          quantity: i.quantity,
        })),
      });

      setPosReceipt({
        order_id: res.order_id,
        customer_name: posCustomerName.trim() || "Pelanggan Umum",
        payment_method: posPaymentMethod,
        items: [...posCart],
        total: posTotal,
        amount_paid: effectivePaid,
        change: effectivePaid - posTotal,
        timestamp: new Date().toLocaleString("id-ID"),
      });

      setPosCart([]);
      setPosAmountPaid("");
      setPosCustomerName("Pelanggan Umum");
      notify("success", `Transaksi Kasir POS #${res.order_id} berhasil disimpan & stok FEFO terpotong!`);

      await loadOrders();
      await loadMedicinesForPos();
    } catch (err) {
      notify("error", err.message || "Gagal memproses transaksi kasir POS");
    } finally {
      setPosSubmitting(false);
    }
  };

  const handleExportOrdersCsv = () => {
    if (orders.length === 0) {
      alert("Belum ada data transaksi untuk diekspor.");
      return;
    }
    const headers = ["No Nota", "Waktu", "Kanal", "Pelanggan", "Metode Pembayaran", "Status Bayar", "Status Pesanan", "Total (Rp)"];
    const rows = orders.map((o) => [
      `#${o.id}`,
      o.createdAt ? new Date(o.createdAt).toLocaleString("id-ID") : "-",
      isPosOrder(o) ? "POS Kasir" : "Online",
      (o.recipient_name || o.customer?.name || o.User?.name || "-").replace(/"/g, '""'),
      extractPaymentMethodLabel(o),
      o.payment_status,
      o.order_status,
      o.total_payment || 0,
    ]);
    const csvContent =
      "\uFEFF" +
      [headers, ...rows]
        .map((r) => r.map((v) => `"${v}"`).join(","))
        .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `laporan-transaksi-apotek-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredPosMedicines = medicines.filter((m) => {
    const q = posSearch.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      m.SKU_code?.toLowerCase().includes(q) ||
      m.Category?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onBack}
            style={{ marginBottom: "8px" }}
          >
            <ArrowLeft size={14} /> Kembali ke Dashboard
          </button>
          <h1>Manajemen Pesanan & Kasir POS Apotek</h1>
          <p style={{ color: "var(--color-text-muted)" }}>
            Setujui (ACC) pesanan online untuk diteruskan ke kurir internal, atau layani pembelian langsung di kasir.
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button className="btn btn-secondary btn-sm" onClick={handleExportOrdersCsv} disabled={orders.length === 0}>
            <Download size={14} /> Export CSV Transaksi
          </button>
          <button className="btn btn-secondary btn-sm" onClick={loadOrders} disabled={loading}>
            <RefreshCw size={15} /> Segarkan Data
          </button>
        </div>
      </div>

      {notification.message && (
        <div
          className={`alert alert-${notification.type === "error" ? "error" : "success"} animate-fade-in`}
        >
          {notification.type === "error" ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Mode Switcher Tabs */}
      <div className="auth-tabs" style={{ maxWidth: "520px", marginBottom: "24px" }}>
        <button
          className={`auth-tab-btn ${activeMode === "online_orders" ? "active" : ""}`}
          onClick={() => setActiveMode("online_orders")}
        >
          <Package size={15} />
          Antrean & ACC Pesanan ({orders.length})
        </button>
        <button
          className={`auth-tab-btn ${activeMode === "pos_cashier" ? "active" : ""}`}
          onClick={() => setActiveMode("pos_cashier")}
        >
          <Calculator size={15} />
          Kasir POS Gerai
        </button>
      </div>

      {activeMode === "online_orders" ? (
        <>
          {/* Typographic KPI Summary Cards (Linear / Shadcn Enterprise Style) */}
          <div className="stats-grid" style={{ marginBottom: "24px" }}>
            <div className="stat-card">
              <div className="stat-card-top">
                <span>Menunggu Validasi (ACC)</span>
                <Clock size={15} />
              </div>
              <div className="stat-val" style={{ color: waitingAccCount > 0 ? "var(--color-warning)" : "var(--color-text-main)" }}>
                {waitingAccCount}
              </div>
              <div className="stat-lbl">Pesanan online baru masuk</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <span>Diproses & Diantar Kurir</span>
                <Truck size={15} />
              </div>
              <div className="stat-val">{activeDeliveryCount}</div>
              <div className="stat-lbl">Dalam antrean logistik apotek</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <span>Transaksi Selesai</span>
                <CheckCircle2 size={15} />
              </div>
              <div className="stat-val">{completedOrders.length}</div>
              <div className="stat-lbl">Online & kasir gerai tuntas</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <span>Omzet Pesanan Selesai</span>
                <Receipt size={15} />
              </div>
              <div className="stat-val" style={{ fontSize: "1.35rem" }}>
                Rp {totalRevenue.toLocaleString("id-ID")}
              </div>
              <div className="stat-lbl">Akumulasi pembayaran lunas</div>
            </div>
          </div>

          {/* Filter & Search Toolbar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              marginBottom: "16px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {[
                { key: "all", label: "Semua" },
                { key: "pending", label: `Menunggu ACC (${waitingAccCount})` },
                { key: "processing", label: "Siap Pickup Kurir" },
                { key: "shipping", label: "Sedang Diantar" },
                { key: "completed", label: "Selesai" },
                { key: "cancelled", label: "Dibatalkan" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  className={`btn btn-sm ${statusFilter === tab.key ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setStatusFilter(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ minWidth: "250px", flex: "0 1 320px" }}>
              <input
                type="text"
                className="form-input"
                placeholder="Cari No. Nota, nama pembeli, alamat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Orders Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nota & Waktu</th>
                  <th>Pelanggan / Penerima</th>
                  <th>Rincian Obat</th>
                  <th>Pembayaran</th>
                  <th>Status & Kurir</th>
                  <th>Total</th>
                  <th style={{ textAlign: "right" }}>Tindakan Admin</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "var(--color-text-muted)" }}>
                      Memuat daftar pesanan masuk...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "var(--color-text-muted)" }}>
                      Tidak ada pesanan pada filter ini.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => {
                    const items = ord.items || ord.OrderItems || [];
                    const buyerName = ord.recipient_name || ord.customer?.name || ord.User?.name || "Pelanggan";
                    const buyerPhone = ord.recipient_phone || ord.customer?.phone || ord.User?.phone || "-";
                    const payMethod = extractPaymentMethodLabel(ord);
                    const posFlag = isPosOrder(ord);
                    const courierName = ord.Shipping?.admin?.name || null;
                    const isBusy = actionId === ord.id;

                    return (
                      <tr key={ord.id}>
                        <td>
                          <div style={{ fontWeight: 800, color: "var(--color-text-main)" }}>
                            #{ord.id}{" "}
                            <span
                              style={{
                                fontSize: "0.68rem",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                background: posFlag ? "var(--color-bg)" : "var(--color-primary-light)",
                                color: posFlag ? "var(--color-text-muted)" : "var(--color-primary)",
                                border: posFlag ? "1px solid var(--color-border)" : "1px solid var(--color-primary-border)",
                                fontWeight: 700,
                              }}
                            >
                              {posFlag ? "POS" : "ONLINE"}
                            </span>
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                            {new Date(ord.createdAt).toLocaleString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>

                        <td>
                          <strong>{buyerName}</strong>
                          {!posFlag && (
                            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                              {buyerPhone}
                            </div>
                          )}
                        </td>

                        <td>
                          {items.length === 0 ? (
                            <span style={{ color: "var(--color-text-muted)" }}>-</span>
                          ) : (
                            <div style={{ fontSize: "0.82rem" }}>
                              <div>
                                <strong>{items[0].quantity}x</strong>{" "}
                                {items[0].medicine_name || items[0].Medicine?.name || "Obat"}
                              </div>
                              {items.length > 1 && (
                                <span style={{ fontSize: "0.73rem", color: "var(--color-primary)", fontWeight: 600 }}>
                                  +{items.length - 1} produk lainnya
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        <td>
                          <div style={{ fontWeight: 600, fontSize: "0.82rem" }}>{payMethod}</div>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              color: ord.payment_status === "paid" ? "var(--color-success)" : "var(--color-warning)",
                            }}
                          >
                            <span className={`status-dot ${ord.payment_status === "paid" ? "status-dot-active" : "status-dot-warning"}`} />
                            {ord.payment_status === "paid" ? "LUNAS" : "BELUM LUNAS"}
                          </span>
                        </td>

                        <td>
                          <div>{renderStatusBadge(ord.order_status)}</div>
                          {courierName && (
                            <div style={{ fontSize: "0.73rem", color: "var(--color-text-muted)", marginTop: "4px" }}>
                              Kurir: <strong>{courierName}</strong>
                            </div>
                          )}
                        </td>

                        <td>
                          <strong style={{ color: "var(--color-primary)" }}>
                            Rp {(ord.total_payment || 0).toLocaleString("id-ID")}
                          </strong>
                        </td>

                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                            {["pending", "pending_payment", "paid"].includes(ord.order_status) && (
                              <>
                                <button
                                  className="btn btn-sm btn-primary"
                                  disabled={isBusy}
                                  onClick={() => handleUpdateStatus(ord.id, "processing")}
                                  title="Setujui pesanan & kirim ke antrean kurir"
                                >
                                  <CheckCircle2 size={14} /> ACC
                                </button>
                                <button
                                  className="btn btn-sm btn-secondary"
                                  disabled={isBusy}
                                  onClick={() => handleUpdateStatus(ord.id, "cancelled")}
                                  title="Tolak / Batalkan Pesanan"
                                  style={{ color: "var(--color-danger)" }}
                                >
                                  <XCircle size={14} />
                                </button>
                              </>
                            )}

                            {["processing", "ready_to_ship", "shipping"].includes(ord.order_status) && (
                              <button
                                className="btn btn-sm btn-outline-primary"
                                disabled={isBusy}
                                onClick={() => handleUpdateStatus(ord.id, "completed", "paid")}
                                title="Selesaikan pesanan secara manual"
                              >
                                <CheckCircle2 size={14} /> Selesai
                              </button>
                            )}

                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => setSelectedOrder(ord)}
                              title="Lihat Detail Nota"
                            >
                              <Eye size={14} /> Detail
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* ==========================================
           SUB-TAB 2: KASIR POS TRANSAKSI OFFLINE
           ========================================== */
        <div className="cart-layout-grid">
          {/* Left: Medicine Quick Picker */}
          <div className="cart-left-col">
            <div className="card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", gap: "12px", flexWrap: "wrap" }}>
                <h3 style={{ fontSize: "1.1rem" }}>Pilih Obat (Stok Otomatis FEFO)</h3>
                <div style={{ flex: "1 1 240px", maxWidth: "340px" }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Cari nama obat / kode SKU..."
                    value={posSearch}
                    onChange={(e) => setPosSearch(e.target.value)}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: "12px",
                  maxHeight: "540px",
                  overflowY: "auto",
                  paddingRight: "4px",
                }}
              >
                {filteredPosMedicines.map((med) => {
                  const stock = getMedTotalStock(med);
                  const inCart = posCart.find((c) => c.medicine_id === med.id);
                  return (
                    <div
                      key={med.id}
                      style={{
                        border: inCart ? "1.5px solid var(--color-primary)" : "1px solid var(--color-border)",
                        background: inCart ? "var(--color-primary-light)" : "white",
                        borderRadius: "var(--radius-md)",
                        padding: "12px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        gap: "10px",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--color-text-muted)", marginBottom: "4px" }}>
                          <code>{med.SKU_code}</code>
                          <span style={{ fontWeight: 700, color: stock > 0 ? "var(--color-primary)" : "var(--color-danger)" }}>
                            Stok: {stock}
                          </span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: "0.92rem", lineHeight: 1.3 }}>{med.name}</div>
                        <div style={{ fontWeight: 800, color: "var(--color-primary)", marginTop: "4px" }}>
                          Rp {Number(med.price).toLocaleString("id-ID")}
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`btn btn-sm ${stock > 0 ? "btn-primary" : "btn-secondary"}`}
                        disabled={stock <= 0}
                        onClick={() => handleAddPosItem(med)}
                      >
                        <Plus size={14} /> {inCart ? `Tambah (${inCart.quantity})` : "Masukkan Nota"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: POS Checkout Calculator */}
          <div className="cart-right-col">
            <form onSubmit={handleSubmitPosCheckout} className="card" style={{ padding: "20px" }}>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "14px", paddingBottom: "10px", borderBottom: "1px solid var(--color-border)" }}>
                Nota Kasir Gerai
              </h3>

              <div className="form-group" style={{ marginBottom: "12px" }}>
                <label className="form-label" style={{ fontSize: "0.8rem" }}>Nama Pembeli</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={posCustomerName}
                  onChange={(e) => setPosCustomerName(e.target.value)}
                  placeholder="Contoh: Pelanggan Umum / Ibu Sari"
                />
              </div>

              {/* Cart Items List */}
              <div
                style={{
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "10px",
                  marginBottom: "14px",
                  maxHeight: "230px",
                  overflowY: "auto",
                  background: "var(--color-bg)",
                }}
              >
                {posCart.length === 0 ? (
                  <p style={{ textAlign: "center", fontSize: "0.82rem", color: "var(--color-text-muted)", padding: "18px 6px" }}>
                    Belum ada item dipilih. Klik obat di panel kiri.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {posCart.map((item) => (
                      <div
                        key={item.medicine_id}
                        style={{
                          background: "white",
                          padding: "8px 10px",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--color-border)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: "0.82rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                            Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                          </div>
                        </div>

                        <div className="qty-control-pill">
                          <button
                            type="button"
                            className="qty-btn"
                            style={{ width: "24px", height: "24px" }}
                            onClick={() => handlePosQtyDelta(item.medicine_id, -1)}
                          >
                            <Minus size={12} />
                          </button>
                          <span className="qty-value" style={{ fontSize: "0.82rem", minWidth: "18px" }}>
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            className="qty-btn"
                            style={{ width: "24px", height: "24px" }}
                            onClick={() => handlePosQtyDelta(item.medicine_id, 1)}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: "12px" }}>
                <label className="form-label" style={{ fontSize: "0.8rem" }}>Metode Pembayaran Kasir</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${posPaymentMethod === "CASH" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setPosPaymentMethod("CASH")}
                  >
                    <Banknote size={14} /> Tunai
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${posPaymentMethod === "QRIS" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => {
                      setPosPaymentMethod("QRIS");
                      setPosAmountPaid(String(posTotal));
                    }}
                  >
                    <CreditCard size={14} /> QRIS Gerai
                  </button>
                </div>
              </div>

              {posPaymentMethod === "CASH" && (
                <div className="form-group" style={{ marginBottom: "14px" }}>
                  <label className="form-label" style={{ fontSize: "0.8rem" }}>Uang Tunai Diterima (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    className="form-input"
                    placeholder="Masukkan nominal uang pelanggan"
                    value={posAmountPaid}
                    onChange={(e) => setPosAmountPaid(e.target.value)}
                  />
                  {posTotal > 0 && (
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                      {[posTotal, 50000, 100000].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: "0.72rem", padding: "3px 8px" }}
                          onClick={() => setPosAmountPaid(String(preset))}
                        >
                          {idx === 0 ? "Uang Pas" : `Rp ${preset.toLocaleString("id-ID")}`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div style={{ borderTop: "2px dashed var(--color-border)", paddingTop: "12px", marginBottom: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontWeight: 700 }}>Total Belanja</span>
                  <span style={{ fontWeight: 800, fontSize: "1.2rem", color: "var(--color-primary)" }}>
                    Rp {posTotal.toLocaleString("id-ID")}
                  </span>
                </div>
                {posPaymentMethod === "CASH" && posTotal > 0 && numericPaid >= posTotal && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "var(--color-primary)", fontWeight: 700 }}>
                    <span>Uang Kembalian</span>
                    <span>Rp {posChange.toLocaleString("id-ID")}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={posSubmitting || posCart.length === 0}
              >
                <CheckCircle2 size={16} />
                {posSubmitting ? "Memproses Transaksi..." : "Selesaikan & Cetak Struk"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: ORDER DETAIL & APPROVAL
          ========================================== */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-container" style={{ maxWidth: "660px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: "1.15rem" }}>Detail Nota Pesanan #{selectedOrder.id}</h3>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                  Dibuat pada {new Date(selectedOrder.createdAt).toLocaleString("id-ID")}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
                <div>{renderStatusBadge(selectedOrder.order_status)}</div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                  Metode: <span style={{ color: "var(--color-primary)" }}>{extractPaymentMethodLabel(selectedOrder)}</span>{" "}
                  ({selectedOrder.payment_status === "paid" ? "LUNAS" : "BELUM LUNAS"})
                </div>
              </div>

              {/* Recipient & Shipping Box */}
              <div
                style={{
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "14px 16px",
                  marginBottom: "16px",
                  fontSize: "0.88rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <User size={15} color="var(--color-primary)" />
                  <strong>Penerima:</strong>{" "}
                  {selectedOrder.recipient_name || selectedOrder.customer?.name || selectedOrder.User?.name || "Pelanggan"}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <Phone size={15} color="var(--color-primary)" />
                  <strong>Kontak:</strong>{" "}
                  {selectedOrder.recipient_phone || selectedOrder.customer?.phone || selectedOrder.User?.phone || "-"}
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                  <MapPin size={15} color="var(--color-danger)" style={{ marginTop: "3px", flexShrink: 0 }} />
                  <div>
                    <strong>Alamat Pengiriman:</strong>
                    <div style={{ color: "var(--color-text-muted)" }}>
                      {selectedOrder.shipping_address || selectedOrder.Shipping?.shipping_address || "-"}
                    </div>
                  </div>
                </div>
                {selectedOrder.Shipping?.admin && (
                  <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed var(--color-border)" }}>
                    <Truck size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "6px" }} />
                    Kurir Pengantar: <strong>{selectedOrder.Shipping.admin.name}</strong> ({selectedOrder.Shipping.shipping_status})
                  </div>
                )}
              </div>

              {/* Items Table */}
              <h4 style={{ fontSize: "0.95rem", marginBottom: "8px" }}>Daftar Obat yang Dipesan</h4>
              <div className="table-container" style={{ marginBottom: "16px" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nama Obat</th>
                      <th>Harga</th>
                      <th>Qty</th>
                      <th style={{ textAlign: "right" }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.items || selectedOrder.OrderItems || []).map((it, i) => {
                      const unitPrice = it.price_at_purchase || it.Medicine?.price || 0;
                      const sub = it.subtotal || unitPrice * it.quantity;
                      const fefoBatches = (it.OrderItemBatches || [])
                        .map((b) =>
                          b.MedicineBatch
                            ? `${b.MedicineBatch.batch_number} (${b.quantity}x)`
                            : null
                        )
                        .filter(Boolean);
                      return (
                        <tr key={i}>
                          <td>
                            <strong>{it.medicine_name || it.Medicine?.name || "Obat"}</strong>
                            {it.SKU_code && (
                              <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>{it.SKU_code}</div>
                            )}
                            {fefoBatches.length > 0 && (
                              <div style={{ fontSize: "0.7rem", color: "var(--color-primary)", marginTop: "2px" }}>
                                Kloter FEFO: <code>{fefoBatches.join(", ")}</code>
                              </div>
                            )}
                          </td>
                          <td>Rp {unitPrice.toLocaleString("id-ID")}</td>
                          <td>{it.quantity}</td>
                          <td style={{ textAlign: "right", fontWeight: 700 }}>
                            Rp {sub.toLocaleString("id-ID")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Financial Summary */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.9rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-text-muted)" }}>
                  <span>Subtotal Produk</span>
                  <span>Rp {(selectedOrder.total_items_price || 0).toLocaleString("id-ID")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-text-muted)" }}>
                  <span>Ongkos Kirim Kurir</span>
                  <span>Rp {(selectedOrder.shipping_cost || 0).toLocaleString("id-ID")}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: 800,
                    fontSize: "1.1rem",
                    color: "var(--color-primary)",
                    paddingTop: "8px",
                    borderTop: "1px solid var(--color-border)",
                  }}
                >
                  <span>Total Tagihan</span>
                  <span>Rp {(selectedOrder.total_payment || 0).toLocaleString("id-ID")}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ flexWrap: "wrap", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedOrder(null)}>
                  Tutup
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() =>
                    printOrderReceipt(selectedOrder, extractPaymentMethodLabel(selectedOrder))
                  }
                >
                  <Printer size={14} /> Cetak Nota
                </button>
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {selectedOrder.payment_status !== "paid" &&
                  !["cancelled", "rejected"].includes(selectedOrder.order_status) && (
                    <button
                      className="btn btn-outline-primary btn-sm"
                      disabled={actionId === selectedOrder.id}
                      onClick={() =>
                        handleUpdateStatus(selectedOrder.id, selectedOrder.order_status, "paid")
                      }
                    >
                      <CreditCard size={14} /> Tandai Sudah Lunas
                    </button>
                  )}

                {["pending", "pending_payment", "paid"].includes(selectedOrder.order_status) && (
                  <>
                    <button
                      className="btn btn-danger btn-sm"
                      disabled={actionId === selectedOrder.id}
                      onClick={() => handleUpdateStatus(selectedOrder.id, "cancelled")}
                    >
                      <XCircle size={14} /> Batalkan Pesanan
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={actionId === selectedOrder.id}
                      onClick={() => handleUpdateStatus(selectedOrder.id, "processing")}
                    >
                      <CheckCircle2 size={14} /> ACC & Teruskan ke Kurir
                    </button>
                  </>
                )}

                {["processing", "ready_to_ship", "shipping"].includes(selectedOrder.order_status) && (
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={actionId === selectedOrder.id}
                    onClick={() => handleUpdateStatus(selectedOrder.id, "completed", "paid")}
                  >
                    <CheckCircle2 size={14} /> Tandai Selesai
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: POS RECEIPT STRUK
          ========================================== */}
      {posReceipt && (
        <div className="modal-overlay" onClick={() => setPosReceipt(null)}>
          <div className="modal-container" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: "1.05rem" }}>Struk Pembelian Apotek Hadinata</h3>
              <button
                onClick={() => setPosReceipt(null)}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ fontSize: "0.86rem" }}>
              <div style={{ textAlign: "center", marginBottom: "14px", paddingBottom: "10px", borderBottom: "1px dashed var(--color-border)" }}>
                <strong style={{ fontSize: "1rem", color: "var(--color-primary)" }}>APOTEK HADINATA</strong>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>SIPA: 446/SIPA-120/2024</div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "4px" }}>
                  No. Struk: <strong>#POS-{posReceipt.order_id}</strong> • {posReceipt.timestamp}
                </div>
                <div style={{ fontSize: "0.78rem", marginTop: "2px" }}>
                  Pembeli: <strong>{posReceipt.customer_name}</strong> ({posReceipt.payment_method})
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
                {posReceipt.items.map((it, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>
                      {it.quantity}x {it.name}
                    </span>
                    <strong>Rp {(it.price * it.quantity).toLocaleString("id-ID")}</strong>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: "1px dashed var(--color-border)", paddingTop: "10px", display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1rem" }}>
                  <span>TOTAL</span>
                  <span>Rp {posReceipt.total.toLocaleString("id-ID")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-text-muted)" }}>
                  <span>Dibayar</span>
                  <span>Rp {posReceipt.amount_paid.toLocaleString("id-ID")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-primary)", fontWeight: 700 }}>
                  <span>Kembalian</span>
                  <span>Rp {posReceipt.change.toLocaleString("id-ID")}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => printPosReceipt(posReceipt)}>
                <Printer size={14} /> Cetak Struk
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => setPosReceipt(null)}>
                Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
