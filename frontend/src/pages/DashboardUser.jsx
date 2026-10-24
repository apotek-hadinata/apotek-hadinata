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
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Flame,
  HeartPulse,
  Eye,
  X,
  Plus,
  Minus
} from "lucide-react";

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
    // Smooth scroll down to products
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

  // Helper icon for category
  const getCategoryEmoji = (name = "") => {
    const n = name.toLowerCase();
    if (n.includes("vitamin")) return "🍊";
    if (n.includes("flu") || n.includes("batuk")) return "🤧";
    if (n.includes("analgesik") || n.includes("demam") || n.includes("sakit")) return "💊";
    if (n.includes("lambung") || n.includes("pencernaan") || n.includes("antasida")) return "🍵";
    return "🩹";
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "40px" }}>
      
      {/* Toast Alert Feedback */}
      {message && (
        <div 
          className="card" 
          style={{ 
            position: "fixed", 
            bottom: "24px", 
            right: "24px", 
            zIndex: 9999, 
            background: "var(--color-surface)", 
            border: "2px solid var(--color-primary)", 
            padding: "14px 20px",
            boxShadow: "0 10px 30px rgba(5, 150, 105, 0.25)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            animation: "slideUp 0.3s ease-out"
          }}
        >
          <CheckCircle2 color="var(--color-primary)" size={20} />
          <span style={{ fontWeight: 600 }}>{message}</span>
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
          1. HERO SECTION (PINTEREST STYLE)
          ========================================================= */}
      <div className="pharmacy-hero-wrapper">
        <div className="pharmacy-hero-content">
          <div className="hero-pill-badge">
            <Sparkles size={14} />
            <span>Farmasi Digital Resmi Apotek Hadinata</span>
          </div>

          <h1 className="pharmacy-hero-title">
            Healthy Tablets, Vitamins & Medicine
          </h1>

          <p className="pharmacy-hero-subtitle">
            Dapatkan kepastian stok online, jaminan seleksi obat terstandar <strong>FEFO (First Expire First Out)</strong>, dan kemudahan pesan obat diantar langsung ke rumah Anda.
          </p>

          {/* Floating Mega Search Bar */}
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
              placeholder="Cari nama obat, suplemen, atau keluhan kesehatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <button type="submit" className="mega-search-btn">
              <Search size={18} />
              <span>Cari Obat</span>
            </button>
          </form>

          {/* Trust Highlights under search */}
          <div style={{ display: "flex", justifyContent: "center", gap: "24px", marginTop: "24px", flexWrap: "wrap", fontSize: "0.85rem", color: "#475569" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <ShieldCheck size={16} color="var(--color-primary)" />
              <strong>100% Asli BPOM</strong>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Truck size={16} color="var(--color-primary)" />
              <strong>Kurir Same-day Hadinata</strong>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Clock size={16} color="var(--color-primary)" />
              <strong>FEFO Quality Control</strong>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          2. FOUR BENTO FEATURE HIGHLIGHTS
          ========================================================= */}
      <div className="bento-grid">
        {/* Card 1: Obat Bebas */}
        <div 
          className="bento-card bento-blue"
          onClick={() => {
            const cat = categories.find(c => c.name.toLowerCase().includes("analgesik") || c.name.toLowerCase().includes("flu"));
            if (cat) setSelectedCategory(cat.id.toString());
            document.getElementById("catalog-products-section")?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <div>
            <div className="bento-icon">💊</div>
            <h3 className="bento-title">Obat Bebas & Flu</h3>
            <p className="bento-desc">Solusi terpercaya sakit kepala, batuk, pilek, dan demam ringan.</p>
          </div>
          <span className="bento-link">
            Jelajahi Produk <ArrowRight size={14} />
          </span>
        </div>

        {/* Card 2: Vitamin & Imun */}
        <div 
          className="bento-card bento-amber"
          onClick={() => {
            const cat = categories.find(c => c.name.toLowerCase().includes("vitamin"));
            if (cat) setSelectedCategory(cat.id.toString());
            document.getElementById("catalog-products-section")?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <div>
            <div className="bento-icon">🍊</div>
            <h3 className="bento-title">Vitamin & Imunitas</h3>
            <p className="bento-desc">Jaga daya tahan tubuh keluarga dengan suplemen harian terbaik.</p>
          </div>
          <span className="bento-link">
            Jelajahi Produk <ArrowRight size={14} />
          </span>
        </div>

        {/* Card 3: Pencernaan */}
        <div 
          className="bento-card bento-emerald"
          onClick={() => {
            const cat = categories.find(c => c.name.toLowerCase().includes("pencernaan") || c.name.toLowerCase().includes("antasida"));
            if (cat) setSelectedCategory(cat.id.toString());
            document.getElementById("catalog-products-section")?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <div>
            <div className="bento-icon">🍵</div>
            <h3 className="bento-title">Pencernaan & Maag</h3>
            <p className="bento-desc">Atasi asam lambung, kembung, begah dan gangguan pencernaan.</p>
          </div>
          <span className="bento-link">
            Jelajahi Produk <ArrowRight size={14} />
          </span>
        </div>

        {/* Card 4: Konsultasi Apoteker */}
        <div 
          className="bento-card bento-purple"
          onClick={() => onNavigate("chat")}
        >
          <div>
            <div className="bento-icon">💬</div>
            <h3 className="bento-title">Konsultasi Apoteker</h3>
            <p className="bento-desc">Tanya dosis, aturan minum, dan efek samping langsung ke apoteker.</p>
          </div>
          <span className="bento-link">
            Mulai Chat <ArrowRight size={14} />
          </span>
        </div>
      </div>

      {/* =========================================================
          3. POPULAR CATEGORIES (CIRCLE ICONS)
          ========================================================= */}
      <section className="categories-section">
        <h2 className="categories-section-title">Kategori Pilihan Apotek</h2>
        <p className="categories-section-subtitle">
          Temukan kebutuhan obat dan kesehatan harian berdasarkan kategori terpopuler
        </p>

        <div className="category-circles-grid">
          {/* All category button */}
          <button 
            className={`category-circle-item ${selectedCategory === "" ? "active" : ""}`}
            onClick={() => setSelectedCategory("")}
          >
            <div className="category-circle-box">
              <Pill size={28} />
            </div>
            <span className="category-circle-label">Semua Obat</span>
          </button>

          {/* Dynamic categories from DB */}
          {categories.map((c) => (
            <button 
              key={c.id}
              className={`category-circle-item ${selectedCategory === c.id.toString() ? "active" : ""}`}
              onClick={() => setSelectedCategory(selectedCategory === c.id.toString() ? "" : c.id.toString())}
            >
              <div className="category-circle-box" style={{ fontSize: "1.6rem" }}>
                {getCategoryEmoji(c.name)}
              </div>
              <span className="category-circle-label">{c.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* =========================================================
          4. OUR DAILY PRODUCTS (CATALOG GRID)
          ========================================================= */}
      <section id="catalog-products-section" style={{ paddingTop: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 800 }}>Rekomendasi Obat Apotek</h2>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
              Menampilkan {medicines.length} produk obat dengan jaminan mutu & kedaluwarsa FEFO
            </p>
          </div>

          {selectedCategory && (
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setSelectedCategory("")}
            >
              Reset Filter Kategori
            </button>
          )}
        </div>

        {loading ? (
          <div className="card" style={{ padding: "60px 20px", textAlign: "center" }}>
            <div className="spinner" style={{ margin: "0 auto 16px" }}></div>
            <p style={{ color: "var(--color-text-muted)" }}>Memuat katalog obat Apotek Hadinata...</p>
          </div>
        ) : medicines.length === 0 ? (
          <div className="card" style={{ padding: "60px 20px", textAlign: "center" }}>
            <p style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "8px" }}>Obat Tidak Ditemukan</p>
            <p style={{ color: "var(--color-text-muted)", marginBottom: "20px" }}>
              Tidak ada obat yang cocok dengan pencarian "{searchQuery}".
            </p>
            <button className="btn btn-primary" onClick={() => { setSearchQuery(""); setSelectedCategory(""); }}>
              Tampilkan Semua Obat
            </button>
          </div>
        ) : (
          <div className="modern-products-grid">
            {medicines.map((med) => {
              const totalStock = (med.batches || []).reduce((s, b) => s + (b.stock || 0), 0);
              const isOutOfStock = totalStock <= 0;
              
              // FEFO: Earliest expiry batch
              const sortedBatches = [...(med.batches || [])].sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
              const earliestExp = sortedBatches[0]?.expiry_date;

              return (
                <div key={med.id} className="modern-product-card">
                  <div>
                    {/* Image / Thumbnail Container */}
                    <div className="product-img-wrapper">
                      <span className="product-badge-float">
                        BPOM Resmi
                      </span>

                      {med.image ? (
                        <img src={med.image} alt={med.name} />
                      ) : (
                        <div style={{ fontSize: "3.5rem" }}>
                          {getCategoryEmoji(med.Category?.name)}
                        </div>
                      )}
                    </div>

                    <div className="product-card-category">
                      {med.Category?.name || "Kategori Obat"}
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
                        <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>Harga Resmi</div>
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
          marginTop: "48px", 
          background: "linear-gradient(135deg, #065f46 0%, #047857 50%, #0d9488 100%)", 
          color: "white", 
          borderRadius: "var(--radius-xl)",
          padding: "36px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "24px",
          boxShadow: "0 14px 30px rgba(5, 150, 105, 0.25)"
        }}
      >
        <div style={{ maxWidth: "620px" }}>
          <span style={{ 
            background: "rgba(255, 255, 255, 0.2)", 
            padding: "4px 12px", 
            borderRadius: "999px", 
            fontSize: "0.75rem", 
            fontWeight: 700, 
            letterSpacing: "0.04em",
            textTransform: "uppercase" 
          }}>
            👨‍⚕️ Konsultasi Gratis
          </span>
          <h2 style={{ color: "white", fontSize: "1.75rem", marginTop: "10px", marginBottom: "8px" }}>
            Butuh Rekomendasi atau Aturan Minum Obat?
          </h2>
          <p style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "0.95rem", lineHeight: "1.6" }}>
            Apoteker berlisensi Apotek Hadinata siap melayani Anda melalui layanan Live Chat interaktif. Pastikan pengobatan Anda tepat, aman, dan rasional.
          </p>
        </div>

        <button 
          className="btn" 
          style={{ 
            background: "white", 
            color: "#065f46", 
            fontWeight: 700, 
            padding: "14px 28px", 
            fontSize: "1rem",
            boxShadow: "0 4px 14px rgba(0,0,0,0.15)"
          }}
          onClick={() => onNavigate("chat")}
        >
          <MessageSquare size={18} />
          Konsultasi Apoteker Sekarang
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
                Deskripsi & Aturan Pemakaian:
              </h4>
              <p style={{ color: "var(--color-text-main)", fontSize: "0.95rem", lineHeight: "1.6" }}>
                {activeModalMed.desc || "Obat ini digunakan sesuai dengan indikasi dan petunjuk aturan pakai pada kemasan atau anjuran tenaga medis apoteker."}
              </p>
            </div>

            {/* FEFO Batch Table */}
            <div style={{ marginBottom: "24px" }}>
              <h4 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Clock size={16} color="var(--color-primary)" />
                Ketersediaan Kloter Stok (FEFO Control):
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

            {/* Modal Footer (Price, Qty Selector, Add Button) */}
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
