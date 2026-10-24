import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { 
  Search, 
  ShoppingCart, 
  Pill, 
  ShieldCheck, 
  Truck, 
  Clock, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Eye,
  X,
  Plus,
  Minus,
  HeartPulse,
  Activity,
  Layers,
  Sparkles
} from "lucide-react";

// Realistic Minimalist Pharmaceutical Mockup SVG Component
const MedicineIllustration = ({ name = "", category = "" }) => {
  const n = (name + " " + category).toLowerCase();

  // 1. Cough Syrup / Liquid Bottle
  if (n.includes("obh") || n.includes("sirup") || n.includes("combi") || n.includes("100ml") || n.includes("cair")) {
    return (
      <svg viewBox="0 0 100 120" width="80" height="96" style={{ filter: "drop-shadow(0 6px 14px rgba(15,23,42,0.1))" }}>
        <rect x="40" y="8" width="20" height="12" rx="3" fill="#334155" />
        <rect x="42" y="20" width="16" height="6" fill="#cbd5e1" />
        <rect x="26" y="26" width="48" height="82" rx="10" fill="#78350f" opacity="0.9" />
        <rect x="30" y="32" width="6" height="70" rx="3" fill="#ffffff" opacity="0.25" />
        <rect x="28" y="44" width="44" height="48" rx="4" fill="#ffffff" />
        <rect x="32" y="50" width="36" height="6" rx="2" fill="#0284c7" />
        <rect x="32" y="60" width="26" height="4" rx="1" fill="#64748b" />
        <rect x="32" y="68" width="32" height="4" rx="1" fill="#94a3b8" />
        <circle cx="50" cy="82" r="4" fill="#ef4444" opacity="0.8" />
      </svg>
    );
  }

  // 2. Vitamin & Supplements Bottle
  if (n.includes("vitamin") || n.includes("suplemen") || n.includes("kapsul")) {
    return (
      <svg viewBox="0 0 100 120" width="80" height="96" style={{ filter: "drop-shadow(0 6px 14px rgba(234,88,12,0.12))" }}>
        <rect x="36" y="10" width="28" height="14" rx="3" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
        <line x1="43" y1="14" x2="43" y2="20" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="50" y1="14" x2="50" y2="20" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="57" y1="14" x2="57" y2="20" stroke="#94a3b8" strokeWidth="1.5" />
        <rect x="25" y="24" width="50" height="84" rx="10" fill="#fff7ed" stroke="#fed7aa" strokeWidth="1.5" />
        <rect x="27" y="40" width="46" height="52" rx="4" fill="#ffffff" />
        <rect x="31" y="46" width="38" height="8" rx="2" fill="#ea580c" />
        <rect x="31" y="58" width="24" height="4" rx="1" fill="#475569" />
        <rect x="31" y="66" width="34" height="4" rx="1" fill="#94a3b8" />
        <circle cx="50" cy="80" r="5" fill="#f97316" />
      </svg>
    );
  }

  // 3. Antacid / Chewable Tablets (e.g. Promag)
  if (n.includes("promag") || n.includes("antasida") || n.includes("lambung") || n.includes("maag")) {
    return (
      <svg viewBox="0 0 110 110" width="88" height="88" style={{ filter: "drop-shadow(0 6px 14px rgba(16,185,129,0.12))" }}>
        <rect x="15" y="15" width="80" height="80" rx="8" fill="#f0fdf4" stroke="#86efac" strokeWidth="1.5" />
        <rect x="18" y="18" width="74" height="14" rx="3" fill="#15803d" />
        <rect x="25" y="40" width="16" height="16" rx="8" fill="#ffffff" stroke="#bbf7d0" strokeWidth="1.5" />
        <rect x="47" y="40" width="16" height="16" rx="8" fill="#ffffff" stroke="#bbf7d0" strokeWidth="1.5" />
        <rect x="69" y="40" width="16" height="16" rx="8" fill="#ffffff" stroke="#bbf7d0" strokeWidth="1.5" />
        <rect x="25" y="64" width="16" height="16" rx="8" fill="#ffffff" stroke="#bbf7d0" strokeWidth="1.5" />
        <rect x="47" y="64" width="16" height="16" rx="8" fill="#ffffff" stroke="#bbf7d0" strokeWidth="1.5" />
        <rect x="69" y="64" width="16" height="16" rx="8" fill="#ffffff" stroke="#bbf7d0" strokeWidth="1.5" />
      </svg>
    );
  }

  // 4. Paracetamol / Standard Tablet Blister
  return (
    <svg viewBox="0 0 110 110" width="88" height="88" style={{ filter: "drop-shadow(0 6px 14px rgba(15,23,42,0.1))" }}>
      <rect x="15" y="15" width="80" height="80" rx="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
      <rect x="18" y="18" width="74" height="14" rx="3" fill="#0284c7" />
      <circle cx="28" cy="46" r="6.5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
      <circle cx="46" cy="46" r="6.5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
      <circle cx="64" cy="46" r="6.5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
      <circle cx="82" cy="46" r="6.5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
      <circle cx="28" cy="72" r="6.5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
      <circle cx="46" cy="72" r="6.5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
      <circle cx="64" cy="72" r="6.5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
      <circle cx="82" cy="72" r="6.5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
    </svg>
  );
};

export const DashboardUser = ({ onAddToCart, onNavigate }) => {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [activeModalMed, setActiveModalMed] = useState(null);
  const [modalQty, setModalQty] = useState(1);

  const loadCatalog = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedCategory) params.category_id = selectedCategory;

      const [medRes, catRes] = await Promise.allSettled([
        api.getMedicines(params),
        api.getCategories()
      ]);

      if (medRes.status === "fulfilled" && medRes.value?.data) {
        setMedicines(medRes.value.data);
      }
      if (catRes.status === "fulfilled" && catRes.value?.data) {
        setCategories(catRes.value.data);
      }
    } catch (err) {
      console.error("Gagal mengambil katalog obat:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, [selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadCatalog();
    const el = document.getElementById("catalog-products-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleAdd = async (med, qty = 1) => {
    const totalStock = (med.batches || []).reduce((s, b) => s + (b.stock || 0), 0);
    if (totalStock <= 0) {
      alert("Maaf, stok obat ini saat ini sedang kosong.");
      return;
    }

    try {
      await api.addToCart(med.id, qty);
      setMessage(`Berhasil menambahkan ${qty}x ${med.name} ke keranjang!`);
      if (onAddToCart) onAddToCart();
      if (activeModalMed) setActiveModalMed(null);
      setTimeout(() => setMessage(""), 3500);
    } catch (err) {
      alert(err.message || "Gagal menambahkan ke keranjang");
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "50px" }}>
      
      {/* Toast Notification */}
      {message && (
        <div 
          className="card" 
          style={{ 
            position: "fixed", 
            bottom: "24px", 
            right: "24px", 
            zIndex: 9999, 
            background: "var(--color-surface)", 
            border: "1px solid var(--color-primary)", 
            padding: "14px 20px",
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.15)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            animation: "slideUp 0.3s ease-out"
          }}
        >
          <CheckCircle2 color="var(--color-primary)" size={18} />
          <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{message}</span>
          <button 
            className="btn btn-primary btn-sm" 
            style={{ marginLeft: "12px", padding: "6px 12px" }}
            onClick={() => onNavigate("cart")}
          >
            Lihat Keranjang
          </button>
        </div>
      )}

      {/* =========================================================
          1. STORE HERO BANNER (CLEAN & PROFESSIONAL APOTEK HADINATA)
          ========================================================= */}
      <div className="pharmacy-store-banner">
        <div className="pharmacy-store-header">
          <div className="store-status-pill">
            <span className="status-indicator-dot"></span>
            <span>Apotek Buka • 07.00 - 22.00 WIB</span>
          </div>
          <span className="store-sipa-badge">
            <ShieldCheck size={14} color="var(--color-primary)" />
            SIPA: 446/SIPA-120/2024
          </span>
        </div>

        <h1 className="pharmacy-store-title">
          Apotek Hadinata
        </h1>
        <p className="pharmacy-store-subtitle">
          Penyedia Obat Bebas, Resep Dokter & Suplemen Kesehatan Terpercaya dengan Jaminan Mutu FEFO & Pengantaran Kurir Cepat.
        </p>

        {/* Clean Integrated Search Bar */}
        <form className="mega-search-bar" onSubmit={handleSearchSubmit}>
          <select 
            className="mega-category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="mega-search-divider"></div>

          <input 
            type="text"
            className="mega-search-input"
            placeholder="Cari nama obat (contoh: Paracetamol, Promag, Vitamin C)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <button type="submit" className="mega-search-btn">
            <Search size={16} />
            <span>Cari Obat</span>
          </button>
        </form>

        {/* Compact Trust Strip (1-Row, Native E-commerce Style) */}
        <div className="store-trust-strip">
          <div className="trust-strip-item">
            <ShieldCheck size={20} className="trust-icon" />
            <div>
              <strong>100% Asli BPOM</strong>
              <p>Distributor farmasi resmi</p>
            </div>
          </div>
          <div className="trust-strip-divider"></div>
          <div className="trust-strip-item">
            <Truck size={20} className="trust-icon" />
            <div>
              <strong>Pengiriman Kilat</strong>
              <p>Kurir apotek langsung ke rumah</p>
            </div>
          </div>
          <div className="trust-strip-divider"></div>
          <div className="trust-strip-item">
            <Clock size={20} className="trust-icon" />
            <div>
              <strong>Kontrol Mutu FEFO</strong>
              <p>Kedaluwarsa selalu dipantau</p>
            </div>
          </div>
          <div className="trust-strip-divider"></div>
          <div className="trust-strip-item trust-clickable" onClick={() => onNavigate("chat")} title="Klik untuk konsultasi dengan apoteker">
            <MessageSquare size={20} className="trust-icon" />
            <div>
              <strong>Tanya Apoteker</strong>
              <p>Konsultasi dosis & aturan minum</p>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          2. CATEGORY FILTER CHIPS (CLEAN E-COMMERCE PILLS)
          ========================================================= */}
      <section className="category-chips-section">
        <div className="category-chips-header">
          <div>
            <h2 className="category-chips-title">Kategori Obat</h2>
            <p className="category-chips-subtitle">Pilih kelompok obat untuk menyaring katalog produk</p>
          </div>
          {selectedCategory && (
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setSelectedCategory("")}
            >
              Tampilkan Semua Produk
            </button>
          )}
        </div>

        <div className="category-chips-container">
          <button 
            className={`category-chip ${selectedCategory === "" ? "active" : ""}`}
            onClick={() => setSelectedCategory("")}
          >
            Semua Produk
          </button>

          {categories.map((c) => (
            <button 
              key={c.id}
              className={`category-chip ${selectedCategory === c.id.toString() ? "active" : ""}`}
              onClick={() => setSelectedCategory(selectedCategory === c.id.toString() ? "" : c.id.toString())}
            >
              {c.name}
            </button>
          ))}
        </div>
      </section>

      {/* =========================================================
          4. PRODUCT SHOWCASE GRID (REALISTIC PHARMACY CARDS)
          ========================================================= */}
      <section id="catalog-products-section" style={{ paddingTop: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "22px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Katalog Produk Apotek</h2>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
              Tersedia {medicines.length} produk obat siap dipesan dan diantar
            </p>
          </div>

          {selectedCategory && (
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setSelectedCategory("")}
            >
              Reset Filter
            </button>
          )}
        </div>

        {loading ? (
          <div className="card" style={{ padding: "60px 20px", textAlign: "center" }}>
            <div className="spinner" style={{ margin: "0 auto 16px" }}></div>
            <p style={{ color: "var(--color-text-muted)" }}>Memuat katalog obat...</p>
          </div>
        ) : medicines.length === 0 ? (
          <div className="card" style={{ padding: "60px 20px", textAlign: "center" }}>
            <p style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "8px" }}>Obat Tidak Ditemukan</p>
            <p style={{ color: "var(--color-text-muted)", marginBottom: "20px" }}>
              Tidak ada produk obat yang cocok dengan pencarian Anda.
            </p>
            <button className="btn btn-primary" onClick={() => { setSearchQuery(""); setSelectedCategory(""); }}>
              Tampilkan Semua Produk
            </button>
          </div>
        ) : (
          <div className="modern-products-grid">
            {medicines.map((med) => {
              const totalStock = (med.batches || []).reduce((s, b) => s + (b.stock || 0), 0);
              const isOutOfStock = totalStock <= 0;
              
              // FEFO batch
              const sortedBatches = [...(med.batches || [])].sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
              const earliestExp = sortedBatches[0]?.expiry_date;

              return (
                <div key={med.id} className="modern-product-card">
                  <div>
                    {/* Packaging Mockup Container */}
                    <div className="product-img-wrapper">
                      <span className="product-badge-float">
                        BPOM
                      </span>

                      {med.image ? (
                        <img src={med.image} alt={med.name} />
                      ) : (
                        <MedicineIllustration name={med.name} category={med.Category?.name} />
                      )}
                    </div>

                    <div className="product-card-category">
                      {med.Category?.name || "Obat Bebas"}
                    </div>

                    <h3 className="product-card-title" title={med.name}>
                      {med.name}
                    </h3>

                    {/* Stock & FEFO Badges */}
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "8px", flexWrap: "wrap" }}>
                      {isOutOfStock ? (
                        <span className="badge badge-admin" style={{ background: "#fee2e2", color: "#991b1b" }}>
                          Stok Habis
                        </span>
                      ) : (
                        <span className="badge badge-user" style={{ fontSize: "0.7rem" }}>
                          Stok: {totalStock} unit
                        </span>
                      )}

                      {earliestExp && !isOutOfStock && (
                        <span className="expiry-tag expiry-safe" style={{ fontSize: "0.68rem" }}>
                          Exp: {earliestExp}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    {/* Price and Cart Action */}
                    <div className="product-card-price-row">
                      <div>
                        <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>Harga</div>
                        <div className="product-price-val">
                          Rp {(med.price || 0).toLocaleString("id-ID")}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "6px" }}>
                        <button 
                          className="btn btn-secondary btn-sm"
                          style={{ padding: "8px 10px" }}
                          onClick={() => {
                            setActiveModalMed(med);
                            setModalQty(1);
                          }}
                          title="Lihat Detail & Khasiat"
                        >
                          <Eye size={15} />
                        </button>

                        <button 
                          className="btn btn-primary btn-sm"
                          style={{ padding: "8px 14px" }}
                          onClick={() => handleAdd(med, 1)}
                          disabled={isOutOfStock}
                        >
                          <ShoppingCart size={15} />
                          <span>+ Beli</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* =========================================================
          5. PHARMACIST CONSULTATION BANNER
          ========================================================= */}
      <div 
        className="card" 
        style={{ 
          marginTop: "40px", 
          background: "linear-gradient(135deg, #0f766e 0%, #115e59 100%)", 
          color: "white", 
          borderRadius: "var(--radius-lg)",
          padding: "28px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px",
          boxShadow: "var(--shadow-sm)"
        }}
      >
        <div style={{ maxWidth: "620px" }}>
          <span style={{ 
            background: "rgba(255, 255, 255, 0.18)", 
            padding: "3px 8px", 
            borderRadius: "var(--radius-xs)", 
            fontSize: "0.75rem", 
            fontWeight: 700, 
            letterSpacing: "0.04em",
            textTransform: "uppercase" 
          }}>
            Layanan Apoteker
          </span>
          <h2 style={{ color: "white", fontSize: "1.45rem", marginTop: "8px", marginBottom: "6px" }}>
            Butuh Rekomendasi atau Aturan Minum Obat?
          </h2>
          <p style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "0.9rem", lineHeight: "1.5" }}>
            Apoteker berlisensi Apotek Hadinata siap membantu Anda via Live Chat untuk memastikan pemilihan obat yang tepat, aman, dan rasional.
          </p>
        </div>

        <button 
          className="btn" 
          style={{ 
            background: "white", 
            color: "#0f766e", 
            fontWeight: 700, 
            padding: "10px 20px", 
            borderRadius: "var(--radius-md)",
            fontSize: "0.9rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.12)"
          }}
          onClick={() => onNavigate("chat")}
        >
          <MessageSquare size={16} />
          Konsultasi Apoteker
        </button>
      </div>

      {/* =========================================================
          6. MEDICINE DETAIL QUICK VIEW MODAL
          ========================================================= */}
      {activeModalMed && (
        <div className="modal-overlay" onClick={() => setActiveModalMed(null)}>
          <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <span className="badge badge-user" style={{ marginBottom: "6px" }}>
                  SKU: {activeModalMed.SKU_code || "MED-OBAT"}
                </span>
                <h2 style={{ fontSize: "1.4rem" }}>{activeModalMed.name}</h2>
                <div style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                  Kategori: {activeModalMed.Category?.name || "Kategori Umum"}
                </div>
              </div>

              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveModalMed(null)}
                style={{ borderRadius: "50%", width: "32px", height: "32px", padding: 0 }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ background: "var(--color-bg)", borderRadius: "var(--radius-md)", padding: "16px", marginBottom: "20px" }}>
              <h4 style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", marginBottom: "4px" }}>
                Deskripsi & Indikasi Obat:
              </h4>
              <p style={{ color: "var(--color-text-main)", fontSize: "0.95rem", lineHeight: "1.6" }}>
                {activeModalMed.desc || "Gunakan obat ini sesuai dengan petunjuk aturan pakai pada kemasan atau anjuran apoteker / dokter."}
              </p>
            </div>

            {/* FEFO Batch Table */}
            <div style={{ marginBottom: "24px" }}>
              <h4 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Clock size={16} color="var(--color-primary)" />
                Ketersediaan Kloter Stok (FEFO):
              </h4>

              <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
                <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse" }}>
                  <thead style={{ background: "var(--color-surface-hover)" }}>
                    <tr>
                      <th style={{ padding: "8px 12px", textAlign: "left" }}>No. Batch</th>
                      <th style={{ padding: "8px 12px", textAlign: "left" }}>Tgl. Expired</th>
                      <th style={{ padding: "8px 12px", textAlign: "right" }}>Stok Tersedia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeModalMed.batches || []).length > 0 ? (
                      activeModalMed.batches.map((b, idx) => (
                        <tr key={idx} style={{ borderTop: "1px solid var(--color-border)" }}>
                          <td style={{ padding: "8px 12px", fontWeight: 600 }}>{b.batch_number}</td>
                          <td style={{ padding: "8px 12px" }}>
                            <span className="expiry-tag expiry-safe">{b.expiry_date}</span>
                          </td>
                          <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700 }}>
                            {b.stock} item
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} style={{ padding: "12px", textAlign: "center", color: "var(--color-text-muted)" }}>
                          Belum ada kloter batch yang terdaftar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--color-border)", paddingTop: "18px" }}>
              <div>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Harga Total</span>
                <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--color-primary)" }}>
                  Rp {((activeModalMed.price || 0) * modalQty).toLocaleString("id-ID")}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div className="qty-control-pill">
                  <button 
                    className="qty-btn"
                    onClick={() => setModalQty(Math.max(1, modalQty - 1))}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="qty-value">{modalQty}</span>
                  <button 
                    className="qty-btn"
                    onClick={() => setModalQty(modalQty + 1)}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button 
                  className="btn btn-primary"
                  onClick={() => handleAdd(activeModalMed, modalQty)}
                  disabled={(activeModalMed.batches || []).reduce((s, b) => s + (b.stock || 0), 0) <= 0}
                >
                  <ShoppingCart size={18} />
                  + Masukkan Keranjang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
