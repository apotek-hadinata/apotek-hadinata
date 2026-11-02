import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { printOrderReceipt } from "../utils/printReceipt";
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  CreditCard,
  ExternalLink,
  ArrowRight,
  Receipt,
  RefreshCw,
  Printer,
  ShieldCheck,
} from "lucide-react";

const getPaymentMethodInfo = (payment) => {
  if (!payment) return { isCod: false, label: "Midtrans / QRIS" };
  if (payment.transaction_reference?.startsWith("COD-")) {
    return { isCod: true, label: "Bayar di Tempat (COD)" };
  }
  if (payment.raw_response) {
    try {
      const parsed = JSON.parse(payment.raw_response);
      if (parsed.method === "COD") {
        return { isCod: true, label: "Bayar di Tempat (COD)" };
      }
    } catch {
      // ignore
    }
  }
  return { isCod: false, label: "Midtrans / QRIS" };
};

export const UserOrdersPage = ({ onBackToCatalog }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [verifyFeedback, setVerifyFeedback] = useState({ type: "", text: "" });

  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.getMyOrders();
      if (res?.data && Array.isArray(res.data)) {
        setOrders(res.data);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Gagal mengambil riwayat pesanan:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    const confirmCancel = window.confirm(
      "Apakah Anda yakin ingin membatalkan pesanan ini? Sediaan obat akan otomatis dikembalikan ke stok fisik apotek."
    );
    if (!confirmCancel) return;

    const reason = window.prompt("Alasan pembatalan (opsional):", "Ingin mengubah daftar obat / alamat");
    if (reason === null) return;

    try {
      setCancellingId(orderId);
      setVerifyFeedback({ type: "", text: "" });
      const res = await api.cancelMyOrder(orderId, reason);
      setVerifyFeedback({
        type: "info",
        text: res?.message || "Pesanan berhasil dibatalkan dan reservasi stok telah dipulihkan ke rak apotek.",
      });
      await fetchOrders(true);
    } catch (err) {
      setVerifyFeedback({
        type: "error",
        text: err.message || "Gagal membatalkan pesanan.",
      });
    } finally {
      setCancellingId(null);
    }
  };

  const handleVerifyMidtrans = async (orderId, simulateSandbox = false) => {
    try {
      setVerifyingId(orderId);
      setVerifyFeedback({ type: "", text: "" });
      const res = await api.verifyOrderPayment(orderId, simulateSandbox);
      setVerifyFeedback({
        type: res?.payment_status === "paid" ? "success" : "info",
        text: res?.message || "Status pembayaran diperbarui.",
      });
      await fetchOrders(true);
    } catch (err) {
      setVerifyFeedback({
        type: "error",
        text: err.message || "Gagal memverifikasi status pembayaran.",
      });
    } finally {
      setVerifyingId(null);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusBadge = (orderStatus, isCod = false) => {
    switch (orderStatus) {
      case "pending":
      case "pending_payment":
        return (
          <span className="badge badge-admin">
            <Clock size={12} /> {isCod ? "Menunggu Konfirmasi Apotek" : "Menunggu Pembayaran / ACC"}
          </span>
        );
      case "paid":
        return (
          <span className="badge badge-user">
            <CheckCircle2 size={12} /> Sudah Dibayar
          </span>
        );
      case "processing":
      case "ready_to_ship":
        return (
          <span className="badge badge-kurir">
            <Package size={12} /> Disiapkan untuk Kurir
          </span>
        );
      case "shipping":
        return (
          <span className="badge badge-kurir">
            <Truck size={12} /> Sedang Diantar Kurir
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
            <AlertCircle size={12} /> Dibatalkan
          </span>
        );
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
      <div className="card animate-fade-in" style={{ padding: "52px 24px", textAlign: "center", maxWidth: "560px", margin: "0 auto" }}>
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "var(--radius-md)",
            background: "var(--color-bg)",
            border: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            color: "var(--color-text-muted)",
          }}
        >
          <Receipt size={22} />
        </div>
        <h2 style={{ fontSize: "1.35rem", marginBottom: "8px" }}>Belum Ada Riwayat Pesanan</h2>
        <p style={{ color: "var(--color-text-muted)", marginBottom: "24px", fontSize: "0.9rem" }}>
          Anda belum melakukan pemesanan obat online. Telusuri katalog kami untuk memesan sediaan farmasi resmi.
        </p>
        <button className="btn btn-primary" onClick={onBackToCatalog}>
          Mulai Belanja Obat
          <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h1 style={{ fontSize: "1.55rem" }}>Riwayat & Pelacakan Pesanan</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
            Pantau status validasi apotek dan pelacakan pengantaran kurir internal secara langsung.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn btn-secondary btn-sm" onClick={() => fetchOrders(false)}>
            <RefreshCw size={14} /> Segarkan
          </button>
          <button className="btn btn-primary btn-sm" onClick={onBackToCatalog}>
            Belanja Lagi
          </button>
        </div>
      </div>

      {verifyFeedback.text && (
        <div
          className={`alert alert-${
            verifyFeedback.type === "error"
              ? "danger"
              : verifyFeedback.type === "success"
              ? "success"
              : "info"
          }`}
        >
          {verifyFeedback.type === "error" ? <AlertCircle size={17} /> : <CheckCircle2 size={17} />}
          <span>{verifyFeedback.text}</span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {orders.map((order) => {
          const dateStr = new Date(order.createdAt).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          const items = order.items || order.OrderItems || [];
          const payment = (order.Payments && order.Payments[0]) || null;
          const payInfo = getPaymentMethodInfo(payment);
          const shipping = order.Shipping || null;

          let shippingText = "Menunggu konfirmasi Admin & penugasan kurir";
          if (shipping) {
            if (shipping.shipping_status === "delivered") {
              shippingText = "Tiba di tujuan";
            } else if (shipping.shipping_status === "shipping" || shipping.shipping_status === "in_transit") {
              shippingText = `Sedang diantar oleh kurir${shipping.admin?.name ? ` (${shipping.admin.name})` : ""}`;
            } else if (shipping.shipping_status === "failed") {
              shippingText = "Pengantaran terkendala / gagal";
            } else if (order.order_status === "processing") {
              shippingText = "Pesanan telah di-ACC, menunggu pickup kurir apotek";
            }
          }

          return (
            <div key={order.id} className="card order-card-item">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid var(--color-border)",
                  paddingBottom: "12px",
                  marginBottom: "14px",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: "1.05rem" }}>Nota #{order.id}</span>
                  <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>• {dateStr}</span>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "4px",
                      background: "var(--color-bg)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    {payInfo.label}
                  </span>
                </div>
                <div>{getStatusBadge(order.order_status, payInfo.isCod)}</div>
              </div>

              {/* Items in this order */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px" }}>
                {items.map((item, idx) => {
                  const fefoBatches = (item.OrderItemBatches || [])
                    .map((b) => b.MedicineBatch?.batch_number)
                    .filter(Boolean);
                  return (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontSize: "0.95rem", gap: "10px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                        <span className="order-item-qty">{item.quantity}x</span>
                        <div>
                          <div style={{ fontWeight: 600 }}>{item.medicine_name || item.Medicine?.name || "Obat"}</div>
                          {fefoBatches.length > 0 && (
                            <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                              Batch FEFO: <code>{fefoBatches.join(", ")}</code>
                            </div>
                          )}
                        </div>
                      </div>
                      <span style={{ color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                        Rp {(item.subtotal || (item.price_at_purchase || item.Medicine?.price || 0) * item.quantity).toLocaleString("id-ID")}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Shipping info */}
              {shipping && (
                <div
                  style={{
                    background: "var(--color-bg)",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.85rem",
                    color: "var(--color-text-muted)",
                    marginBottom: "14px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <Truck size={14} color="var(--color-primary)" />
                    <strong style={{ color: "var(--color-text-main)" }}>Pengiriman:</strong> {shippingText}
                  </div>
                  <div>Alamat: {order.shipping_address || shipping.shipping_address}</div>
                </div>
              )}

              {/* Order Footer & Actions */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: "12px",
                  borderTop: "1px solid var(--color-border)",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginRight: "8px" }}>
                    Total Tagihan:
                  </span>
                  <strong style={{ fontSize: "1.15rem", fontFamily: "var(--font-display)", color: "var(--accent-price)" }}>
                    Rp {(order.total_payment || 0).toLocaleString("id-ID")}
                  </strong>
                  <span
                    style={{
                      marginLeft: "8px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: order.payment_status === "paid" ? "var(--color-primary)" : "var(--color-warning)",
                    }}
                  >
                    ({order.payment_status === "paid" ? "LUNAS" : payInfo.isCod ? "BAYAR TUNAI KURIR" : "MENUNGGU BAYAR"})
                  </span>
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => printOrderReceipt(order, payInfo.label)}
                  >
                    <Printer size={14} />
                    Cetak Nota
                  </button>

                  {(order.order_status === "pending" || order.order_status === "pending_payment") &&
                    order.payment_status !== "paid" && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ color: "var(--color-danger)", borderColor: "rgba(220, 38, 38, 0.3)" }}
                        disabled={cancellingId === order.id}
                        onClick={() => handleCancelOrder(order.id)}
                        title="Batalkan pesanan dan pulihkan stok obat ke apotek"
                      >
                        <AlertCircle size={13} />
                        {cancellingId === order.id ? "Membatalkan..." : "Batalkan Pesanan"}
                      </button>
                    )}

                  {!payInfo.isCod &&
                    (order.order_status === "pending" || order.order_status === "pending_payment") &&
                    order.payment_status !== "paid" && (
                      <>
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm"
                          disabled={verifyingId === order.id}
                          onClick={() => handleVerifyMidtrans(order.id, false)}
                          title="Sinkronkan status pembayaran langsung dari Midtrans API"
                        >
                          <RefreshCw size={13} />
                          {verifyingId === order.id ? "Mengecek..." : "Cek Status Bayar"}
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          disabled={verifyingId === order.id}
                          onClick={() => handleVerifyMidtrans(order.id, true)}
                          title="Simulasi pelunasan Midtrans Sandbox untuk demo lokal tanpa ngrok"
                        >
                          <ShieldCheck size={14} />
                          Simulasi Lunas
                        </button>

                        {payment && payment.qr_string && (
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
                      </>
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
