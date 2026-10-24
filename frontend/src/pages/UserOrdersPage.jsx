import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  Truck, 
  AlertCircle, 
  CreditCard, 
  ExternalLink, 
  ShoppingBag,
  ArrowRight,
  Receipt
} from "lucide-react";

export const UserOrdersPage = ({ onBackToCatalog }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.getMyOrders();
      if (res?.data && Array.isArray(res.data)) {
        setOrders(res.data);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Gagal mengambil riwayat pesanan:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusBadge = (orderStatus) => {
    switch (orderStatus) {
      case "pending":
      case "pending_payment":
        return <span className="badge badge-admin"><Clock size={12} /> Menunggu Pembayaran</span>;
      case "paid":
        return <span className="badge badge-user"><CheckCircle2 size={12} /> Sudah Dibayar</span>;
      case "processing":
        return <span className="badge badge-user"><Package size={12} /> Sedang Disiapkan</span>;
      case "ready_to_ship":
        return <span className="badge badge-kurir"><Truck size={12} /> Siap Diantar Kurir</span>;
      case "shipping":
        return <span className="badge badge-kurir"><Truck size={12} /> Sedang Diantar Kurir</span>;
      case "completed":
        return <span className="badge badge-user" style={{ background: "#dcfce7", color: "#15803d" }}><CheckCircle2 size={12} /> Selesai</span>;
      case "cancelled":
      case "rejected":
        return <span className="badge badge-admin" style={{ background: "#fee2e2", color: "#991b1b" }}><AlertCircle size={12} /> Dibatalkan</span>;
      default:
        return <span className="badge">{orderStatus}</span>;
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: "60px 20px", textAlign: "center", maxWidth: "800px", margin: "0 auto" }}>
        <div className="spinner" style={{ margin: "0 auto 16px" }}></div>
        <p style={{ color: "var(--color-text-muted)", fontWeight: 600 }}>Memuat riwayat pesanan Anda...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="card animate-fade-in" style={{ padding: "60px 24px", textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
        <div style={{ 
          width: "80px", 
          height: "80px", 
          borderRadius: "50%", 
          background: "var(--color-surface-hover)", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          margin: "0 auto 20px",
          color: "var(--color-text-muted)"
        }}>
          <Receipt size={40} />
        </div>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "8px" }}>Belum Ada Riwayat Pesanan</h2>
        <p style={{ color: "var(--color-text-muted)", marginBottom: "24px" }}>
          Anda belum pernah melakukan pemesanan obat online. Mulai belanja sekarang untuk mendapatkan pelayanan terbaik Apotek Hadinata.
        </p>
        <button className="btn btn-primary" onClick={onBackToCatalog}>
          Mulai Belanja Obat
          <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem" }}>📦 Riwayat & Status Pesanan Saya</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
            Pantau status pesanan dan pelacakan pengantaran obat Anda secara realtime.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={onBackToCatalog}>
          Belanja Lagi
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {orders.map((order) => {
          const dateStr = new Date(order.createdAt).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          const items = order.OrderItems || [];
          const payment = (order.Payments && order.Payments[0]) || null;
          const shipping = order.Shipping || null;

          return (
            <div key={order.id} className="card order-card-item">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-border)", paddingBottom: "12px", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontWeight: 700, fontSize: "1.05rem" }}>Nota #{order.id}</span>
                  <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>• {dateStr}</span>
                </div>
                <div>{getStatusBadge(order.order_status)}</div>
              </div>

              {/* Items in this order */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px" }}>
                {items.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.95rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span className="order-item-qty">{item.quantity}x</span>
                      <span style={{ fontWeight: 600 }}>{item.Medicine?.name || "Obat"}</span>
                    </div>
                    <span style={{ color: "var(--color-text-muted)" }}>
                      Rp {((item.price_at_purchase || item.Medicine?.price || 0) * item.quantity).toLocaleString("id-ID")}
                    </span>
                  </div>
                ))}
              </div>

              {/* Shipping info */}
              {shipping && (
                <div style={{ background: "var(--color-bg)", padding: "10px 14px", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <Truck size={14} color="var(--color-primary)" />
                    <strong style={{ color: "var(--color-text-main)" }}>Pengiriman:</strong> {shipping.shipping_status === "delivered" ? "Tiba di tujuan" : shipping.shipping_status === "in_transit" ? "Sedang dalam perjalanan oleh kurir" : "Menunggu penugasan kurir"}
                  </div>
                  <div>Alamat: {shipping.shipping_address}</div>
                </div>
              )}

              {/* Order Footer & Actions */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid var(--color-border)", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginRight: "8px" }}>Total Tagihan:</span>
                  <strong style={{ fontSize: "1.15rem", color: "var(--color-primary)" }}>
                    Rp {(order.total_payment || 0).toLocaleString("id-ID")}
                  </strong>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  {payment && payment.qr_string && (order.order_status === "pending" || order.order_status === "pending_payment") && (
                    <a 
                      href={payment.qr_string} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn btn-primary btn-sm"
                    >
                      <CreditCard size={14} />
                      Bayar Sekarang
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
