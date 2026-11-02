import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import {
  Layers,
  Clock,
  Plus,
  ArrowRight,
  Calculator,
  MessageSquare,
  Package,
  Banknote,
  Truck,
  SlidersHorizontal,
} from "lucide-react";

export const DashboardAdmin = ({ onNavigate }) => {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [medRes, catRes, ordRes, chatRes] = await Promise.allSettled([
          api.getMedicines(),
          api.getCategories(),
          api.getAllOrders(),
          api.getAdminChatRooms(),
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
        if (chatRes.status === "fulfilled" && chatRes.value?.data) {
          setChatRooms(chatRes.value.data);
        }
      } catch (err) {
        console.error("Gagal memuat ringkasan operasional:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const totalStockOnline = medicines.reduce((sum, med) => {
    const medStock = (med.batches || []).reduce((bSum, b) => {
      const exp = new Date(b.expiry_date);
      const valid = !Number.isNaN(exp.getTime()) && exp >= startOfToday;
      return valid ? bSum + (b.stock || 0) : bSum;
    }, 0);
    return sum + medStock;
  }, 0);

  const pendingOrders = orders.filter((o) =>
    ["pending", "pending_payment", "paid"].includes(o.order_status)
  );

  const activeDeliveries = orders.filter((o) =>
    ["processing", "ready_to_ship", "shipping"].includes(o.order_status)
  );

  const paidOrders = orders.filter(
    (o) =>
      o.payment_status === "paid" &&
      o.order_status !== "cancelled" &&
      o.order_status !== "rejected"
  );

  const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total_payment || 0), 0);

  const todayStr = new Date().toDateString();
  const todayPaidOrders = paidOrders.filter(
    (o) => o.createdAt && new Date(o.createdAt).toDateString() === todayStr
  );
  const todayRevenue = todayPaidOrders.reduce((sum, o) => sum + Number(o.total_payment || 0), 0);

  const unreadChats = chatRooms.reduce((sum, r) => sum + (r.unread_count || 0), 0);

  // Top 5 nearest expiring batches for real operational FEFO monitoring
  const allBatches = [];
  medicines.forEach((med) => {
    (med.batches || []).forEach((b) => {
      if ((b.stock || 0) > 0) {
        allBatches.push({
          ...b,
          medicineName: med.name,
          SKU: med.SKU_code,
        });
      }
    });
  });
  allBatches.sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
  const topFefoBatches = allBatches.slice(0, 5);
  const recentOrders = orders.slice(0, 5);

  const getDaysRemaining = (dateStr) => {
    const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return { text: "Kedaluwarsa", cls: "expiry-urgent" };
    if (diff <= 30) return { text: `${diff} hari`, cls: "expiry-urgent" };
    if (diff <= 90) return { text: `${diff} hari`, cls: "expiry-warning" };
    return { text: `${diff} hari`, cls: "expiry-safe" };
  };

  return (
    <div className="animate-fade-in">
      {/* Clean Enterprise Page Header */}
      <div className="dashboard-header">
        <div className="dashboard-title-group">
          <h1>Ringkasan Operasional & Finansial Apotek</h1>
          <p>
            Petugas aktif: <strong>{user?.name}</strong> • Pemantauan omzet gerai, inventori kloter FEFO, antrean pesanan, dan logistik kurir.
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("admin_settings")}>
            <SlidersHorizontal size={15} /> Pengaturan & Staf
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("admin_pos")}>
            <Calculator size={15} /> Kasir POS
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("admin_orders")}>
            <Package size={15} /> Validasi Pesanan
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => onNavigate("admin_medicines")}>
            <Plus size={15} /> Kelola Inventori
          </button>
        </div>
      </div>

      {/* Executive Financial & Logistics Strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "14px",
          marginBottom: "14px",
        }}
      >
        <div
          className="stat-card"
          style={{ cursor: "pointer", borderLeft: "4px solid var(--color-primary)" }}
          onClick={() => onNavigate("admin_orders")}
        >
          <div className="stat-card-top">
            <span>Total Omzet Lunas</span>
            <Banknote size={15} color="var(--color-primary)" />
          </div>
          <div className="stat-val" style={{ fontSize: "1.45rem", color: "var(--color-primary)" }}>
            Rp {totalRevenue.toLocaleString("id-ID")}
          </div>
          <div className="stat-lbl">{paidOrders.length} transaksi lunas (Online & POS Kasir)</div>
        </div>

        <div
          className="stat-card"
          style={{ cursor: "pointer", borderLeft: "4px solid var(--ink-forest)" }}
          onClick={() => onNavigate("admin_pos")}
        >
          <div className="stat-card-top">
            <span>Pendapatan Hari Ini</span>
            <Calculator size={15} />
          </div>
          <div className="stat-val" style={{ fontSize: "1.45rem" }}>
            Rp {todayRevenue.toLocaleString("id-ID")}
          </div>
          <div className="stat-lbl">{todayPaidOrders.length} transaksi selesai hari ini</div>
        </div>

        <div
          className="stat-card"
          style={{ cursor: "pointer", borderLeft: "4px solid var(--accent-price)" }}
          onClick={() => onNavigate("admin_orders")}
        >
          <div className="stat-card-top">
            <span>Logistik Kurir Aktif</span>
            <Truck size={15} color="var(--accent-price)" />
          </div>
          <div className="stat-val" style={{ fontSize: "1.45rem" }}>
            {activeDeliveries.length}
          </div>
          <div className="stat-lbl">Paket disiapkan / sedang diantar kurir internal</div>
        </div>
      </div>

      {/* Typographic Operational Metric Row */}
      <div className="stats-grid">
        <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => onNavigate("admin_medicines")}>
          <div className="stat-card-top">
            <span>Master Sediaan Obat</span>
            <Layers size={15} />
          </div>
          <div className="stat-val">{medicines.length}</div>
          <div className="stat-lbl">{categories.length} kategori terdaftar</div>
        </div>

        <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => onNavigate("admin_medicines")}>
          <div className="stat-card-top">
            <span>Stok Aktif (Unit FEFO)</span>
            <Package size={15} />
          </div>
          <div className="stat-val">{totalStockOnline.toLocaleString("id-ID")}</div>
          <div className="stat-lbl">{allBatches.length} kloter batch tercatat</div>
        </div>

        <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => onNavigate("admin_orders")}>
          <div className="stat-card-top">
            <span>Menunggu Validasi (ACC)</span>
            <Clock size={15} />
          </div>
          <div className="stat-val" style={{ color: pendingOrders.length > 0 ? "var(--color-warning)" : "var(--color-text-main)" }}>
            {pendingOrders.length}
          </div>
          <div className="stat-lbl">Dari total {orders.length} transaksi tercatat</div>
        </div>

        <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => onNavigate("admin_chats")}>
          <div className="stat-card-top">
            <span>Konsultasi Pelanggan</span>
            <MessageSquare size={15} />
          </div>
          <div className="stat-val">{chatRooms.length}</div>
          <div className="stat-lbl">
            {unreadChats > 0 ? `${unreadChats} pesan menunggu balasan` : "Seluruh pesan telah dibalas"}
          </div>
        </div>
      </div>

      {/* Real Operational Split View: Live Order Queue & FEFO Expiry Watchlist */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(440px, 1fr))",
          gap: "20px",
        }}
      >
        {/* Panel 1: Recent Orders Queue */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid var(--color-border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h3 style={{ fontSize: "0.95rem" }}>Antrean Transaksi Terbaru</h3>
              <span style={{ fontSize: "0.76rem", color: "var(--color-text-muted)" }}>
                Pesanan online pelanggan & transaksi kasir gerai
              </span>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("admin_orders")}>
              Semua Pesanan <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nota</th>
                  <th>Pelanggan</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "28px", color: "var(--color-text-muted)" }}>
                      Memuat transaksi...
                    </td>
                  </tr>
                ) : recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "28px", color: "var(--color-text-muted)" }}>
                      Belum ada transaksi tercatat.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((ord) => (
                    <tr
                      key={ord.id}
                      style={{ cursor: "pointer" }}
                      onClick={() => onNavigate("admin_orders")}
                    >
                      <td><strong>#{ord.id}</strong></td>
                      <td>{ord.recipient_name || ord.customer?.name || "Pelanggan"}</td>
                      <td>
                        <span
                          className={`badge ${
                            ord.order_status === "completed"
                              ? "badge-user"
                              : ["pending", "pending_payment"].includes(ord.order_status)
                              ? "badge-admin"
                              : ord.order_status === "cancelled"
                              ? "badge-danger"
                              : "badge-kurir"
                          }`}
                        >
                          {ord.order_status}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        Rp {(ord.total_payment || 0).toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel 2: FEFO Batch Expiry Watchlist */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid var(--color-border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h3 style={{ fontSize: "0.95rem" }}>Prioritas Pengeluaran Kloter (FEFO)</h3>
              <span style={{ fontSize: "0.76rem", color: "var(--color-text-muted)" }}>
                5 kloter aktif dengan masa kedaluwarsa paling dekat
              </span>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("admin_medicines")}>
              Audit Batch <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sediaan Obat</th>
                  <th>No. Batch</th>
                  <th>Stok</th>
                  <th style={{ textAlign: "right" }}>Sisa Umur</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "28px", color: "var(--color-text-muted)" }}>
                      Memuat data batch...
                    </td>
                  </tr>
                ) : topFefoBatches.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "28px", color: "var(--color-text-muted)" }}>
                      Belum ada kloter stok aktif.
                    </td>
                  </tr>
                ) : (
                  topFefoBatches.map((b) => {
                    const rem = getDaysRemaining(b.expiry_date);
                    return (
                      <tr
                        key={b.id}
                        style={{ cursor: "pointer" }}
                        onClick={() => onNavigate("admin_medicines")}
                      >
                        <td>
                          <strong>{b.medicineName}</strong>
                        </td>
                        <td><code>{b.batch_number}</code></td>
                        <td>{b.stock} unit</td>
                        <td style={{ textAlign: "right" }}>
                          <span className={`expiry-tag ${rem.cls}`}>{rem.text}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
