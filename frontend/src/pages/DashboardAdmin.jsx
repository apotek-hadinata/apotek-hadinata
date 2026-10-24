import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { 
  ShieldCheck, 
  Layers, 
  Package, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  CheckCircle2, 
  Plus, 
  ArrowRight,
  TrendingUp,
  Truck
} from "lucide-react";

export const DashboardAdmin = ({ onNavigate }) => {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [medRes, catRes, ordRes] = await Promise.allSettled([
          api.getMedicines(),
          api.getCategories(),
          api.getAllOrders()
        ]);

        if (medRes.status === "fulfilled" && medRes.value?.data) {
          setMedicines(medRes.value.data);
        }
        if (catRes.status === "fulfilled" && catRes.value?.data) {
          setCategories(catRes.value.data);
        }
        if (ordRes.status === "fulfilled" && ordRes.value?.data) {
          setOrders(ordRes.value.data);
        }
      } catch (err) {
        console.error("Gagal memuat data dashboard admin:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate stats
  const totalStockOnline = medicines.reduce((sum, med) => {
    const medStock = (med.batches || []).reduce((bSum, b) => bSum + (b.stock || 0), 0);
    return sum + medStock;
  }, 0);

  const pendingOrders = orders.filter(o => o.order_status === "pending").length;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-title-group">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h1>Dashboard Pengelola Apotek</h1>
            <span className="badge badge-admin">Owner / Admin</span>
          </div>
          <p>Selamat datang kembali, <strong>{user?.name}</strong>. Pantau stok online berprinsip FEFO dan pesanan pelanggan.</p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            className="btn btn-primary"
            onClick={() => onNavigate("admin_medicines")}
          >
            <Plus size={16} /> Kelola Obat & Batch
          </button>
        </div>
      </div>

      {/* Quick KPI Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#ecfdf5", color: "#059669" }}>
            <Layers size={24} />
          </div>
          <div>
            <div className="stat-val">{medicines.length}</div>
            <div className="stat-lbl">Master Katalog Obat</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#f0fdfa", color: "#0d9488" }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="stat-val">{totalStockOnline}</div>
            <div className="stat-lbl">Total Stok Unit Online</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-val">{pendingOrders}</div>
            <div className="stat-lbl">Pesanan Menunggu ACC</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#e0f2fe", color: "#0284c7" }}>
            <Truck size={24} />
          </div>
          <div>
            <div className="stat-val">{categories.length}</div>
            <div className="stat-lbl">Kategori Terdaftar</div>
          </div>
        </div>
      </div>

      {/* Highlight Box: FEFO Algorithm Principle */}
      <div className="card" style={{ marginBottom: "24px", background: "linear-gradient(135deg, #f0fdf4, #ffffff)", borderColor: "var(--color-primary-border)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
          <div style={{ background: "var(--color-primary)", color: "white", padding: "10px", borderRadius: "var(--radius-md)" }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.1rem", color: "var(--color-primary)" }}>Sistem Penjualan Otomatis FEFO (First Expire First Out)</h3>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginTop: "4px" }}>
              Sistem backend secara otomatis memotong stok dari kloter (batch) obat yang tanggal kedaluwarsanya paling dekat terlebih dahulu setiap kali ada pesanan masuk, meminimalkan risiko obat tertahan hingga basi.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
        <div className="card" style={{ cursor: "pointer" }} onClick={() => onNavigate("admin_medicines")}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontWeight: 700, fontSize: "1.05rem" }}>Manajemen Obat & Batch</span>
            <ArrowRight size={18} color="var(--color-primary)" />
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            Tambah obat non-resep, update harga, SKU, serta atur nomor batch dan masa kedaluwarsa.
          </p>
        </div>

        <div className="card" style={{ cursor: "pointer" }} onClick={() => onNavigate("admin_orders")}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontWeight: 700, fontSize: "1.05rem" }}>Persetujuan (ACC) Pesanan Online</span>
            <ArrowRight size={18} color="var(--color-primary)" />
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            Periksa pesanan online masuk dari pelanggan, verifikasi stok, dan serahkan ke antrean kurir internal apotek.
          </p>
        </div>
      </div>
    </div>
  );
};
