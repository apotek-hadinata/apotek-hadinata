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
  AlertCircle,
  ExternalLink,
  Navigation
} from "lucide-react";

export const DashboardCourier = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("jobs"); // 'jobs' | 'my_shipments'
  const [availableJobs, setAvailableJobs] = useState([]);
  const [myShipments, setMyShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [jobsRes, shipRes] = await Promise.allSettled([
        api.getAvailableJobs(),
        api.getMyShipments()
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
      setActiveTab("my_shipments");
      setTimeout(() => setMessage(""), 3500);
    } catch (err) {
      alert(err.message || "Gagal mengambil tugas pengiriman");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (shippingId, status) => {
    try {
      setActionLoading(true);
      await api.updateShippingStatus(shippingId, status);
      setMessage(`Status pengiriman berhasil diubah menjadi: ${status}`);
      await loadData();
      setTimeout(() => setMessage(""), 3500);
    } catch (err) {
      alert(err.message || "Gagal memperbarui status pengiriman");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="dashboard-header">
        <div className="dashboard-title-group">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h1>Portal Kurir Internal</h1>
            <span className="badge badge-kurir">Logistik Apotek</span>
          </div>
          <p>Halo, <strong>{user?.name}</strong>. Kelola dan antarkan pesanan obat langsung ke tangan pelanggan.</p>
        </div>
      </div>

      {message && (
        <div className="alert alert-success animate-fade-in" style={{ marginBottom: "20px" }}>
          <CheckCircle2 size={18} />
          <span>{message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="auth-tabs" style={{ maxWidth: "420px", marginBottom: "24px" }}>
        <button 
          className={`auth-tab-btn ${activeTab === "jobs" ? "active" : ""}`}
          onClick={() => setActiveTab("jobs")}
        >
          <Clock size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: "6px" }} />
          Tugas Tersedia ({availableJobs.length})
        </button>
        <button 
          className={`auth-tab-btn ${activeTab === "my_shipments" ? "active" : ""}`}
          onClick={() => setActiveTab("my_shipments")}
        >
          <Truck size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: "6px" }} />
          Pengantaran Saya ({myShipments.length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--color-text-muted)" }}>
          <Truck size={36} className="animate-pulse" style={{ margin: "0 auto 12px", color: "var(--color-secondary)" }} />
          <p>Memuat data tugas pengantaran...</p>
        </div>
      ) : activeTab === "jobs" ? (
        /* AVAILABLE JOBS BOARD */
        <div>
          {availableJobs.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
              <CheckCircle2 size={40} color="var(--color-success)" style={{ margin: "0 auto 12px" }} />
              <h3>Belum Ada Tugas Antar Baru</h3>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
                Semua pesanan online saat ini telah diambil atau sedang menunggu persetujuan Admin Apotek.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
              {availableJobs.map((job) => (
                <div key={job.id} className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontWeight: 800, fontSize: "1rem", color: "var(--color-text-main)" }}>
                      Pesanan #{job.order_id}
                    </span>
                    <span className="badge badge-admin">Siap Diantar</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.875rem", marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                      <MapPin size={18} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: "2px" }} />
                      <div>
                        <strong>Alamat Antar:</strong>
                        <div style={{ color: "var(--color-text-muted)" }}>{job.shipping_address || "Alamat tercatat di pesanan"}</div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Phone size={16} color="var(--color-primary)" />
                      <span>Kontak: <strong>{job.Order?.User?.phone || "-"}</strong> ({job.Order?.User?.name || "Pelanggan"})</span>
                    </div>

                    {job.distance && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-text-muted)" }}>
                        <Navigation size={16} /> Estimasi Jarak: {job.distance} KM
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
              ))}
            </div>
          )}
        </div>
      ) : (
        /* MY ACTIVE DELIVERIES */
        <div>
          {myShipments.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
              <Package size={40} color="var(--color-text-muted)" style={{ margin: "0 auto 12px" }} />
              <h3>Belum Memiliki Riwayat Pengantaran</h3>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
                Buka tab "Tugas Tersedia" untuk mengambil pesanan yang siap dikirim.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
              {myShipments.map((ship) => {
                const isDelivered = ship.shipping_status === "delivered";
                const isFailed = ship.shipping_status === "failed";
                const isTransit = ship.shipping_status === "in_transit";

                return (
                  <div key={ship.id} className="card" style={{ borderColor: isTransit ? "var(--color-secondary)" : "var(--color-border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <span style={{ fontWeight: 800, fontSize: "1rem" }}>
                        Pesanan #{ship.order_id}
                      </span>
                      <span 
                        style={{ 
                          fontSize: "0.75rem", 
                          fontWeight: 700, 
                          padding: "4px 10px", 
                          borderRadius: "999px",
                          textTransform: "uppercase",
                          background: isDelivered ? "#ecfdf5" : isFailed ? "#fef2f2" : "#e0f2fe",
                          color: isDelivered ? "#065f46" : isFailed ? "#b91c1c" : "#0369a1"
                        }}
                      >
                        {ship.shipping_status}
                      </span>
                    </div>

                    <div style={{ fontSize: "0.875rem", marginBottom: "16px" }}>
                      <p><strong>Penerima:</strong> {ship.Order?.User?.name || "Pelanggan"} ({ship.Order?.User?.phone || "-"})</p>
                      <p style={{ color: "var(--color-text-muted)", marginTop: "4px" }}>
                        <MapPin size={14} style={{ display: "inline" }} /> {ship.shipping_address}
                      </p>
                    </div>

                    {!isDelivered && !isFailed && (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button 
                          className="btn btn-sm btn-primary" 
                          style={{ flex: 1 }}
                          onClick={() => handleUpdateStatus(ship.id, "delivered")}
                          disabled={actionLoading}
                        >
                          <CheckCircle2 size={15} /> Selesai Antar
                        </button>
                        <button 
                          className="btn btn-sm btn-danger" 
                          onClick={() => handleUpdateStatus(ship.id, "failed")}
                          disabled={actionLoading}
                        >
                          Gagal
                        </button>
                      </div>
                    )}
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
