import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import {
  ShoppingCart,
  MessageSquare,
  Package,
  MapPin,
  CheckCircle2,
  ArrowUpRight,
  X,
  Plus,
  Minus,
  Info,
  Truck,
} from "lucide-react";

// Klasifikasi resmi Golongan Obat BPOM RI (Lingkaran Hijau / Biru / Suplemen)
const getBpomClassification = (name = "", category = "") => {
  const text = `${name} ${category}`.toLowerCase();
  if (text.includes("vitamin") || text.includes("suplemen") || text.includes("imun") || text.includes("enervon") || text.includes("imboost")) {
    return { label: "Suplemen", circleCls: "bpom-suplemen", packCls: "pack-suplemen", code: "SD" };
  }
  if (
    text.includes("flu") ||
    text.includes("batuk") ||
    text.includes("obh") ||
    text.includes("ctm") ||
    text.includes("alergi") ||
    text.includes("sirup")
  ) {
    return { label: "Bebas Terbatas", circleCls: "bpom-terbatas", packCls: "pack-terbatas", code: "DTL" };
  }
  return { label: "Obat Bebas", circleCls: "bpom-bebas", packCls: "", code: "DBL" };
};

// Satuan kemasan e-commerce apotek ala K24Klik (/ Strip, / Botol, / Tube)
const getPackagingUnit = (name = "", category = "") => {
  const text = `${name} ${category}`.toLowerCase();
  if (text.includes("sirup") || text.includes("ml") || text.includes("suspensi") || text.includes("cair") || text.includes("obh") || text.includes("tetes") || text.includes("botol")) {
    return { unit: "/ Botol", form: "SIRUP / CAIR" };
  }
  if (text.includes("salep") || text.includes("krim") || text.includes("gel") || text.includes("tube")) {
    return { unit: "/ Tube", form: "KRIM / TOPIKAL" };
  }
  if (text.includes("kapsul")) {
    return { unit: "/ Strip", form: "KAPSUL" };
  }
  return { unit: "/ Strip", form: "TABLET / KAPLET" };
};

const formatShortExpiry = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
};

const getValidActiveBatches = (batches = []) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return [...batches]
    .filter((b) => {
      const exp = new Date(b.expiry_date);
      return (b.stock || 0) > 0 && !Number.isNaN(exp.getTime()) && exp >= startOfToday;
    })
    .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
};

const getValidTotalStock = (batches = []) =>
  getValidActiveBatches(batches).reduce((sum, b) => sum + (b.stock || 0), 0);

export const DashboardUser = ({
  onAddToCart,
  onNavigate,
  searchQuery = "",
  onSearchChange,
  searchTrigger = 0,
}) => {
  const { isAuthenticated } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("stock"); // 'stock' | 'price_asc' | 'price_desc' | 'name_asc'
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [activeModalMed, setActiveModalMed] = useState(null);
  const [modalQty, setModalQty] = useState(1);

  const loadCatalog = async (overrideSearch) => {
    try {
      setLoading(true);
      const q = overrideSearch !== undefined ? overrideSearch : searchQuery;
      const params = {};
      if (q && q.trim()) params.search = q.trim();
      if (selectedCategory) params.category_id = selectedCategory;

      const [medRes, catRes] = await Promise.allSettled([
        api.getMedicines(params),
        api.getCategories(),
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

  // Reload when category changes or when user submits search from Navbar
  useEffect(() => {
    loadCatalog();
  }, [selectedCategory, searchTrigger]);

  // Instant client-side filtering + sorting as user types in the header search bar
  const displayedMedicines = useMemo(() => {
    let list = [...medicines];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.name?.toLowerCase().includes(q) ||
          m.SKU_code?.toLowerCase().includes(q) ||
          m.desc?.toLowerCase().includes(q) ||
          m.Category?.name?.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      const stockA = getValidTotalStock(a.batches || []);
      const stockB = getValidTotalStock(b.batches || []);
      if (sortBy === "price_asc") return Number(a.price || 0) - Number(b.price || 0);
      if (sortBy === "price_desc") return Number(b.price || 0) - Number(a.price || 0);
      if (sortBy === "name_asc") return (a.name || "").localeCompare(b.name || "");
      // Default: available stock first
      return stockB - stockA;
    });

    return list;
  }, [medicines, searchQuery, sortBy]);

  const handleAdd = async (med, qty = 1) => {
    if (!isAuthenticated) {
      onNavigate("auth");
      return;
    }

    const totalStock = getValidTotalStock(med.batches || []);
    if (totalStock <= 0) {
      alert("Stok obat aktif sedang habis.");
      return;
    }

    try {
      await api.addToCart(med.id, qty);
      setMessage(`${qty}x ${med.name} masuk ke troli.`);
      if (onAddToCart) onAddToCart();
      if (activeModalMed) setActiveModalMed(null);
      setTimeout(() => setMessage(""), 3200);
    } catch (err) {
      alert(err.message || "Gagal menambahkan obat ke keranjang.");
    }
  };

  const handleQuickAction = (targetTab) => {
    if (!isAuthenticated) {
      onNavigate("auth");
    } else {
      onNavigate(targetTab);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Toast Notification */}
      {message && (
        <div
          className="card"
          style={{
            position: "fixed",
            bottom: "74px",
            right: "22px",
            zIndex: 9999,
            padding: "11px 16px",
            boxShadow: "var(--shadow-md)",
            borderLeft: "4px solid var(--color-primary)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <CheckCircle2 color="var(--color-primary)" size={17} />
          <span style={{ fontWeight: 700, fontSize: "0.84rem" }}>{message}</span>
          <button className="btn btn-dark btn-sm" onClick={() => onNavigate("cart")}>
            Lihat Troli
          </button>
        </div>
      )}

      {/* 1. BRANCH LOCATION & BPOM CLASSIFICATION LEGEND BAR */}
      <div className="k24-location-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <MapPin size={14} color="var(--color-primary)" />
          <span>
            Dikirim langsung dari: <strong style={{ color: "var(--ink-forest)" }}>Gerai Apotek Hadinata</strong> (Stok Fisik Real-Time FEFO)
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          <span className="bpom-badge">
            <span className="bpom-circle bpom-bebas" /> Obat Bebas
          </span>
          <span className="bpom-badge">
            <span className="bpom-circle bpom-terbatas" /> Bebas Terbatas
          </span>
          <span className="bpom-badge">
            <span className="bpom-circle bpom-suplemen" /> Suplemen
          </span>
        </div>
      </div>

      {/* 2. COMPACT MARKETPLACE PROMO + QUICK SERVICE TILES (NO AI HERO) */}
      <section className="k24-top-strip">
        <div className="k24-banner-dark">
          <div>
            <span className="k24-banner-tag">KURIR INTERNAL APOTEK</span>
            <h1 className="k24-banner-title">
              Obat Resmi BPOM, Diantar Langsung dari Gerai
            </h1>
            <p className="k24-banner-sub">
              Gratis ongkos kirim untuk transaksi di atas <strong style={{ color: "#ffffff" }}>Rp 150.000</strong>. Nomor batch & kedaluwarsa obat tercatat transparan.
            </p>
          </div>
          <Truck size={38} color="var(--accent-citron)" strokeWidth={1.6} style={{ flexShrink: 0 }} />
        </div>

        <div className="k24-quick-services">
          <button
            type="button"
            className="k24-service-tile"
            onClick={() => handleQuickAction("chat")}
          >
            <div className="k24-service-head">
              <MessageSquare size={18} strokeWidth={2} />
              <ArrowUpRight size={15} color="var(--color-text-subtle)" />
            </div>
            <div>
              <div className="k24-service-title">Tanya Apoteker</div>
              <div className="k24-service-desc">Konsultasi dosis & keluhan</div>
            </div>
          </button>

          <button
            type="button"
            className="k24-service-tile"
            onClick={() => handleQuickAction("orders")}
          >
            <div className="k24-service-head">
              <Package size={18} strokeWidth={2} />
              <ArrowUpRight size={15} color="var(--color-text-subtle)" />
            </div>
            <div>
              <div className="k24-service-title">Lacak Pesanan</div>
              <div className="k24-service-desc">Status ACC & kurir aktif</div>
            </div>
          </button>

          <button
            type="button"
            className="k24-service-tile"
            onClick={() => handleQuickAction("cart")}
          >
            <div className="k24-service-head">
              <ShoppingCart size={18} strokeWidth={2} />
              <ArrowUpRight size={15} color="var(--color-text-subtle)" />
            </div>
            <div>
              <div className="k24-service-title">Troli Belanja</div>
              <div className="k24-service-desc">Bayar QRIS, VA, atau COD</div>
            </div>
          </button>
        </div>
      </section>

      {/* 3. CATEGORY TABS & MARKETPLACE SORTING BAR */}
      <section className="k24-catalog-toolbar">
        <div className="category-chips-scroll">
          <button
            type="button"
            className={`category-chip ${selectedCategory === "" ? "active" : ""}`}
            onClick={() => setSelectedCategory("")}
          >
            Semua Produk
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`category-chip ${String(selectedCategory) === String(cat.id) ? "active" : ""}`}
              onClick={() => setSelectedCategory(String(cat.id))}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
            <strong>{displayedMedicines.length}</strong> produk
          </span>

          <select
            className="form-select"
            style={{ width: "auto", padding: "5px 10px", fontSize: "0.78rem" }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Urutkan Produk"
          >
            <option value="stock">Urutkan: Stok Tersedia</option>
            <option value="price_asc">Harga: Terendah - Tertinggi</option>
            <option value="price_desc">Harga: Tertinggi - Terendah</option>
            <option value="name_asc">Nama Produk: A - Z</option>
          </select>

          {(selectedCategory || searchQuery) && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSelectedCategory("");
                if (onSearchChange) onSearchChange("");
                loadCatalog("");
              }}
            >
              Reset
            </button>
          )}
        </div>
      </section>

      {/* Active Search Query Notice */}
      {searchQuery.trim() && (
        <div style={{ marginBottom: "12px", fontSize: "0.84rem", color: "var(--color-text-muted)" }}>
          Hasil pencarian untuk: <strong style={{ color: "var(--ink-forest)" }}>&ldquo;{searchQuery}&rdquo;</strong>
        </div>
      )}

      {/* 4. DENSE 5-COLUMN K24KLIK PHARMACY PRODUCT GRID */}
      <section id="catalog-products-section">
        {loading ? (
          <div className="card" style={{ padding: "56px 20px", textAlign: "center" }}>
            <div className="spinner" style={{ margin: "0 auto 12px" }}></div>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.86rem" }}>Memuat katalog obat...</p>
          </div>
        ) : displayedMedicines.length === 0 ? (
          <div className="card" style={{ padding: "52px 20px", textAlign: "center" }}>
            <h3 style={{ fontSize: "1.05rem", marginBottom: "6px" }}>Obat Tidak Ditemukan</h3>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginBottom: "16px" }}>
              Tidak ada produk yang cocok dengan pencarian Anda. Coba kata kunci lain atau konsultasikan ke Apoteker.
            </p>
            <div style={{ display: "inline-flex", gap: "8px" }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSelectedCategory("");
                  if (onSearchChange) onSearchChange("");
                  loadCatalog("");
                }}
              >
                Tampilkan Semua Obat
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => handleQuickAction("chat")}>
                Tanya Apoteker
              </button>
            </div>
          </div>
        ) : (
          <div className="k24-products-grid">
            {displayedMedicines.map((med) => {
              const sortedBatches = getValidActiveBatches(med.batches || []);
              const totalStock = getValidTotalStock(med.batches || []);
              const isOutOfStock = totalStock <= 0 || med.status === "out of stock";
              const earliestExp = sortedBatches[0]?.expiry_date || med.batches?.[0]?.expiry_date;
              const bpom = getBpomClassification(med.name, med.Category?.name);
              const pkg = getPackagingUnit(med.name, med.Category?.name);

              return (
                <div key={med.id} className="k24-product-card">
                  <div>
                    {/* Top Row: Official BPOM Circle & Quick Info Trigger */}
                    <div className="k24-product-top-meta">
                      <span className="bpom-badge" title={`Golongan: ${bpom.label}`}>
                        <span className={`bpom-circle ${bpom.circleCls}`} />
                        <span>{bpom.label}</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveModalMed(med);
                          setModalQty(1);
                        }}
                        title="Lihat komposisi, dosis & nomor batch"
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--color-text-subtle)",
                          cursor: "pointer",
                          display: "inline-flex",
                          padding: "2px",
                        }}
                      >
                        <Info size={14} />
                      </button>
                    </div>

                    {/* Product Image or Realistic Medicine Packaging Carton */}
                    <div
                      className="k24-product-media"
                      onClick={() => {
                        setActiveModalMed(med);
                        setModalQty(1);
                      }}
                    >
                      {med.image ? (
                        <img src={med.image} alt={med.name} />
                      ) : (
                        <div className={`k24-pack-box ${bpom.packCls}`}>
                          <div className="k24-pack-header">
                            <span>{pkg.form}</span>
                            <span className={`bpom-circle ${bpom.circleCls}`} style={{ width: "9px", height: "9px" }} />
                          </div>
                          <div className="k24-pack-brand">{med.name}</div>
                          <div className="k24-pack-footer">
                            <span>{med.SKU_code || `MED-${med.id}`}</span>
                            <span>BPOM {bpom.code}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="k24-product-cat">
                      {med.Category?.name || "Obat & Kesehatan"}
                    </div>

                    <h3
                      className="k24-product-title"
                      title={med.name}
                      onClick={() => {
                        setActiveModalMed(med);
                        setModalQty(1);
                      }}
                    >
                      {med.name}
                    </h3>
                  </div>

                  <div>
                    {/* Price per Unit (/ Strip, / Botol) */}
                    <div className="k24-price-row">
                      <span className="k24-price-val">
                        Rp {Number(med.price || 0).toLocaleString("id-ID")}
                      </span>
                      <span className="k24-price-unit">{pkg.unit}</span>
                    </div>

                    {/* Stock & FEFO Nearest Expiry */}
                    <div className="k24-stock-row">
                      <span
                        style={{
                          fontWeight: 700,
                          color: isOutOfStock ? "var(--color-danger)" : "var(--color-primary)",
                        }}
                      >
                        {isOutOfStock ? "Stok Habis" : `Stok: ${totalStock}`}
                      </span>
                      {earliestExp && <span>ED {formatShortExpiry(earliestExp)}</span>}
                    </div>

                    {/* Direct Buy Button */}
                    <button
                      type="button"
                      className="k24-buy-btn"
                      onClick={() => handleAdd(med, 1)}
                      disabled={isOutOfStock}
                    >
                      {isOutOfStock ? (
                        <span>Habis</span>
                      ) : (
                        <>
                          <Plus size={14} strokeWidth={2.5} />
                          <span>Beli</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Floating Bottom-Right Consult Pharmacist Trigger */}
      <button
        type="button"
        className="k24-floating-chat"
        onClick={() => handleQuickAction("chat")}
      >
        <span className="top-bar-dot" />
        <MessageSquare size={15} />
        <span>Chat Apoteker</span>
      </button>

      {/* 5. PRODUCT DETAIL & FEFO BATCH TRACEABILITY MODAL */}
      {activeModalMed && (
        <div className="modal-overlay" onClick={() => setActiveModalMed(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span className="bpom-badge">
                    <span className={`bpom-circle ${getBpomClassification(activeModalMed.name, activeModalMed.Category?.name).circleCls}`} />
                    <span>{getBpomClassification(activeModalMed.name, activeModalMed.Category?.name).label}</span>
                  </span>
                  <span style={{ color: "var(--color-border-strong)" }}>•</span>
                  <code>{activeModalMed.SKU_code || `MED-${activeModalMed.id}`}</code>
                </div>
                <h3 style={{ fontSize: "1.2rem" }}>{activeModalMed.name}</h3>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveModalMed(null)}
                style={{ padding: "6px" }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div
                style={{
                  background: "#f8faf8",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "14px 16px",
                  marginBottom: "18px",
                }}
              >
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--ink-forest)", marginBottom: "4px" }}>
                  Indikasi, Dosis & Aturan Pakai
                </div>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.86rem", lineHeight: 1.55 }}>
                  {activeModalMed.desc ||
                    "Gunakan obat ini sesuai aturan pakai pada kemasan atau tanyakan dosis yang tepat kepada Apoteker Jaga melalui fitur Chat Apoteker."}
                </p>
              </div>

              <div>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, marginBottom: "8px", color: "var(--ink-forest)" }}>
                  Ketersediaan Kloter Batch Fisik (Urutan Prioritas FEFO)
                </div>

                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Nomor Batch</th>
                        <th>Kedaluwarsa</th>
                        <th style={{ textAlign: "right" }}>Stok Tersedia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(activeModalMed.batches || []).length > 0 ? (
                        [...(activeModalMed.batches || [])]
                          .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date))
                          .map((b, idx) => (
                            <tr key={idx}>
                              <td><code>{b.batch_number}</code></td>
                              <td>{new Date(b.expiry_date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</td>
                              <td style={{ textAlign: "right", fontWeight: 700 }}>{b.stock} unit</td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan={3} style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "16px" }}>
                            Belum ada kloter batch terdaftar.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                  Harga ({modalQty} {getPackagingUnit(activeModalMed.name, activeModalMed.Category?.name).unit.replace("/ ", "")})
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "1.18rem", fontWeight: 800, color: "var(--accent-price)", fontVariantNumeric: "tabular-nums" }}>
                  Rp {((activeModalMed.price || 0) * modalQty).toLocaleString("id-ID")}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="qty-control-pill">
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => setModalQty(Math.max(1, modalQty - 1))}
                  >
                    <Minus size={13} />
                  </button>
                  <span className="qty-value">{modalQty}</span>
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() =>
                      setModalQty(
                        Math.min(Math.max(1, getValidTotalStock(activeModalMed.batches || [])), modalQty + 1)
                      )
                    }
                    disabled={modalQty >= getValidTotalStock(activeModalMed.batches || [])}
                  >
                    <Plus size={13} />
                  </button>
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleAdd(activeModalMed, modalQty)}
                  disabled={getValidTotalStock(activeModalMed.batches || []) <= 0}
                >
                  <ShoppingCart size={15} />
                  <span>+ Beli Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
