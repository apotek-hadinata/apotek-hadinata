import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import {
  Truck,
  Package,
  MapPin,
  Phone,
  CheckCircle2,
  Clock,
  ExternalLink,
  Navigation,
  RefreshCw,
  XCircle,
  Banknote,
} from "lucide-react";

const checkIsCod = (order) => {
  const payment = (order?.Payments && order.Payments[0]) || null;
  if (!payment) return false;
  if (payment.transaction_reference?.startsWith("COD-")) return true;
  if (payment.raw_response) {
    try {
      return JSON.parse(payment.raw_response)?.method === "COD";
    } catch {
      return false;
    }
  }
  return false;
};

const formatWhatsAppUrl = (phone, recipientName, orderId) => {
  if (!phone || phone === "-") return null;
  let digits = String(phone).replace(/[^0-9]/g, "");
  if (digits.startsWith("0")) {
    digits = `62${digits.slice(1)}`;
  }
  const text = encodeURIComponent(
    `Halo ${recipientName || "Kak"}, saya kurir Apotek Hadinata sedang mengantarkan paket obat Pesanan #${orderId}.`
  );
  return `https://wa.me/${digits}?text=${text}`;
};

const buildGoogleMapsUrl = (ship) => {
  const addr = ship.shipping_address || ship.Order?.shipping_address || "";
  if (addr) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
  }
  if (ship.latitude && ship.longitude) {
    return `https://www.google.com/maps/search/?api=1&query=${ship.latitude},${ship.longitude}`;
  }
  return "https://www.google.com/maps";
};

export const DashboardCourier = ({ activeNavTab, onSelectNavTab }) => {
  const { user } = useAuth();
  // 3 tabs matching PRD Modul 5: 'jobs' | 'active' | 'history'
  const [activeTab, setActiveTab] = useState("jobs");
  const [availableJobs, setAvailableJobs] = useState([]);
  const [myShipments, setMyShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (activeNavTab === "courier_jobs") {
      setActiveTab("jobs");
    } else if (activeNavTab === "courier_active") {
      setActiveTab("active");
    }
  }, [activeNavTab]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    if (onSelectNavTab) {
      onSelectNavTab(tab === "jobs" ? "courier_jobs" : "courier_active");
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [jobsRes, shipRes] = await Promise.allSettled([
        api.getAvailableJobs(),
        api.getMyShipments(),
      ]);

      if (jobsRes.status === "fulfilled" && jobsRes.value?.data) {
        setAvailableJobs(jobsRes.value.data);
      }
      if (shipRes.status === "fulfilled" && shipRes.value?.data) {
        setMyShipments(shipRes.value.data);
      }
    } catch (err) {
      console.error("Gagal mengambil data kurir:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePickup = async (shippingId) => {
    try {
      setActionLoading(true);
      await api.pickupShipping(shippingId);
      setMessage("Tugas pengiriman berhasil diambil! Paket siap diantarkan.");
      await loadData();
      switchTab("active");
      setTimeout(() => setMessage(""), 3500);
    } catch (err) {
      alert(err.message || "Gagal mengambil tugas pengiriman");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (shippingId, status) => {
    const label = status === "delivered" ? "Selesai Diantar (Delivered)" : "Gagal Antar (Failed)";
    if (!window.confirm(`Konfirmasi ubah status pengantaran menjadi "${label}"?`)) return;

    try {
      setActionLoading(true);
      await api.updateShippingStatus(shippingId, status);
      setMessage(`Status pengiriman berhasil diubah menjadi: ${label}`);
      await loadData();
      if (status === "delivered" || status === "failed") {
        setActiveTab("history");
      }
      setTimeout(() => setMessage(""), 3500);
    } catch (err) {
      alert(err.message || "Gagal memperbarui status pengiriman");
    } finally {
      setActionLoading(false);
    }
  };

  const activeDeliveries = myShipments.filter(
    (s) => s.shipping_status === "shipping" || s.shipping_status === "in_transit" || s.shipping_status === "assigned"
  );
  const historyDeliveries = myShipments.filter(
    (s) => s.shipping_status === "delivered" || s.shipping_status === "failed"
  );

  return (
    <div className="animate-fade-in">
      <div className="dashboard-header">
        <div className="dashboard-title-group">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h1>Portal Kurir Internal</h1>
            <span className="badge badge-kurir">Logistik Apotek</span>
          </div>
          <p>
            Halo, <strong>{user?.name}</strong>. Kelola penjemputan obat di apotek dan antarkan langsung ke alamat pelanggan.
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={loadData} disabled={loading}>
          <RefreshCw size={14} /> Segarkan Tugas
        </button>
      </div>

      {message && (
        <div className="alert alert-success animate-fade-in" style={{ marginBottom: "20px" }}>
          <CheckCircle2 size={18} />
          <span>{message}</span>
        </div>
      )}

      {/* 3 Sub-Tabs matching PRD Modul 5 */}
      <div className="auth-tabs" style={{ maxWidth: "600px", marginBottom: "24px" }}>
        <button
          className={`auth-tab-btn ${activeTab === "jobs" ? "active" : ""}`}
          onClick={() => switchTab("jobs")}
        >
          <Clock size={15} />
          Tugas Tersedia ({availableJobs.length})
        </button>
        <button
          className={`auth-tab-btn ${activeTab === "active" ? "active" : ""}`}
          onClick={() => switchTab("active")}
        >
          <Truck size={15} />
          Sedang Diantar ({activeDeliveries.length})
        </button>
        <button
          className={`auth-tab-btn ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          <CheckCircle2 size={15} />
          Riwayat Antar ({historyDeliveries.length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--color-text-muted)" }}>
          <Truck size={36} style={{ margin: "0 auto 12px", color: "var(--color-secondary)" }} />
          <p>Memuat data tugas pengantaran...</p>
        </div>
      ) : activeTab === "jobs" ? (
        /* TAB 1: TUGAS TERSEDIA */
        <div>
          {availableJobs.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
              <CheckCircle2 size={40} color="var(--color-success)" style={{ margin: "0 auto 12px" }} />
              <h3>Belum Ada Tugas Antar Baru</h3>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
                Pesanan online akan muncul di sini segera setelah disetujui (ACC) oleh Admin Apotek.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))", gap: "16px" }}>
              {availableJobs.map((job) => {
                const ord = job.Order || {};
                const recipientName = ord.recipient_name || ord.customer?.name || ord.User?.name || "Pelanggan";
                const recipientPhone = ord.recipient_phone || ord.customer?.phone || ord.User?.phone || "-";
                const isCod = checkIsCod(ord);
                const items = ord.items || ord.OrderItems || [];
                const waUrl = formatWhatsAppUrl(recipientPhone, recipientName, job.order_id);

                return (
                  <div key={job.id} className="card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--color-text-main)" }}>
                        Pesanan #{job.order_id}
                      </span>
                      <div style={{ display: "flex", gap: "6px" }}>
                        {isCod && ord.payment_status !== "paid" && (
                          <span className="badge badge-admin">
                            <Banknote size={12} /> COD Rp {(ord.total_payment || 0).toLocaleString("id-ID")}
                          </span>
                        )}
                        <span className="badge badge-kurir">Siap Pickup</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.875rem", marginBottom: "16px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                        <MapPin size={17} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: "2px" }} />
                        <div>
                          <strong>Alamat Antar:</strong>
                          <div style={{ color: "var(--color-text-muted)" }}>
                            {job.shipping_address || ord.shipping_address || "Alamat tercatat di pesanan"}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <Phone size={15} color="var(--color-primary)" />
                          <span>
                            <strong>{recipientName}</strong> ({recipientPhone})
                          </span>
                        </div>
                        {waUrl && (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: "0.78rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            Chat WA <ExternalLink size={11} />
                          </a>
                        )}
                      </div>

                      {items.length > 0 && (
                        <div style={{ background: "var(--color-bg)", padding: "8px 10px", borderRadius: "var(--radius-sm)", fontSize: "0.8rem" }}>
                          <strong>Paket Obat ({items.length} jenis):</strong>{" "}
                          {items.map((it) => `${it.quantity}x ${it.medicine_name || it.Medicine?.name || "Obat"}`).join(", ")}
                        </div>
                      )}

                      {job.distance > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-text-muted)" }}>
                          <Navigation size={15} /> Estimasi Jarak: {job.distance} KM
                        </div>
                      )}
                    </div>

                    <button
                      className="btn btn-primary btn-block"
                      disabled={actionLoading}
                      onClick={() => handlePickup(job.id)}
                    >
                      <Truck size={16} /> Ambil Tugas Pengantaran Ini
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : activeTab === "active" ? (
        /* TAB 2: SEDANG DIANTAR */
        <div>
          {activeDeliveries.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
              <Package size={40} color="var(--color-text-muted)" style={{ margin: "0 auto 12px" }} />
              <h3>Tidak Ada Paket yang Sedang Diantar</h3>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
                Buka tab &ldquo;Tugas Tersedia&rdquo; untuk mengambil pesanan yang siap dikirim.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "16px" }}>
              {activeDeliveries.map((ship) => {
                const ord = ship.Order || {};
                const recipientName = ord.recipient_name || ord.customer?.name || ord.User?.name || "Pelanggan";
                const recipientPhone = ord.recipient_phone || ord.customer?.phone || ord.User?.phone || "-";
                const isCod = checkIsCod(ord);
                const waUrl = formatWhatsAppUrl(recipientPhone, recipientName, ship.order_id);
                const mapsUrl = buildGoogleMapsUrl(ship);

                return (
                  <div key={ship.id} className="card" style={{ borderColor: "var(--color-primary)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <span style={{ fontWeight: 800, fontSize: "1.05rem" }}>Pesanan #{ship.order_id}</span>
                      <span className="badge badge-kurir">SEDANG DIANTAR</span>
                    </div>

                    {isCod && ord.payment_status !== "paid" && (
                      <div className="alert alert-info" style={{ padding: "8px 12px", marginBottom: "12px", fontSize: "0.82rem" }}>
                        <Banknote size={16} />
                        <span>
                          <strong>Tagih Tunai COD:</strong> Rp {(ord.total_payment || 0).toLocaleString("id-ID")}
                        </span>
                      </div>
                    )}

                    <div style={{ fontSize: "0.875rem", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div>
                        <strong>Penerima:</strong> {recipientName} ({recipientPhone})
                      </div>
                      <div style={{ color: "var(--color-text-muted)" }}>
                        <MapPin size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                        {ship.shipping_address || ord.shipping_address}
                      </div>
                    </div>

                    {/* Navigation & Contact Quick Actions */}
                    <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1 }}
                      >
                        <Navigation size={14} /> Buka Google Maps
                        <ExternalLink size={12} />
                      </a>
                      {waUrl && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline-primary btn-sm"
                          style={{ flex: 1 }}
                        >
                          <Phone size={14} /> Hubungi WA
                        </a>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className="btn btn-sm btn-primary"
                        style={{ flex: 1 }}
                        onClick={() => handleUpdateStatus(ship.id, "delivered")}
                        disabled={actionLoading}
                      >
                        <CheckCircle2 size={15} /> Selesaikan Pengantaran
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleUpdateStatus(ship.id, "failed")}
                        disabled={actionLoading}
                      >
                        <XCircle size={15} /> Gagal
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* TAB 3: RIWAYAT ANTAR */
        <div>
          {historyDeliveries.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
              <Package size={40} color="var(--color-text-muted)" style={{ margin: "0 auto 12px" }} />
              <h3>Belum Ada Riwayat Pengantaran Selesai</h3>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
                Paket yang sudah tiba di tangan pelanggan akan direkap secara otomatis di tab ini.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
              {historyDeliveries.map((ship) => {
                const isDelivered = ship.shipping_status === "delivered";
                const ord = ship.Order || {};
                const recipientName = ord.recipient_name || ord.customer?.name || ord.User?.name || "Pelanggan";

                return (
                  <div key={ship.id} className="card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <span style={{ fontWeight: 700, fontSize: "1rem" }}>Pesanan #{ship.order_id}</span>
                      <span className={`badge ${isDelivered ? "badge-user" : "badge-danger"}`}>
                        {isDelivered ? "TERKIRIM" : "GAGAL ANTAR"}
                      </span>
                    </div>

                    <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                      <div style={{ color: "var(--color-text-main)", fontWeight: 600, marginBottom: "4px" }}>
                        Penerima: {recipientName}
                      </div>
                      <div>{ship.shipping_address || ord.shipping_address}</div>
                      {ship.delivered_at && (
                        <div style={{ marginTop: "6px", fontSize: "0.75rem", color: "var(--color-success)", fontWeight: 600 }}>
                          Diselesaikan pada {new Date(ship.delivered_at).toLocaleString("id-ID")}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
