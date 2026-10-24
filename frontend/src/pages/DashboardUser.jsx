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
  AlertCircle
} from "lucide-react";

export const DashboardUser = ({ onAddToCart, onNavigate }) => {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

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
  };

  const handleAdd = async (med) => {
    const totalStock = (med.batches || []).reduce((s, b) => s + (b.stock || 0), 0);
    if (totalStock <= 0) {
      alert("Maaf, stok obat ini saat ini sedang kosong.");
      return;
    }

    try {
      await api.addToCart(med.id, 1);
      setMessage(`Berhasil menambahkan ${med.name} ke keranjang!`);
      if (onAddToCart) onAddToCart();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      alert(err.message || "Gagal menambahkan ke keranjang");
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Hero Welcome Banner */}
      <div 
        className="card" 
        style={{ 
          background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)", 
          color: "white", 
          padding: "36px 32px",
          borderRadius: "var(--radius-xl)",
          marginBottom: "32px",
          boxShadow: "0 10px 25px rgba(5, 150, 105, 0.2)"
        }}
      >
        <div style={{ maxWidth: "600px" }}>
          <span style={{ 
            background: "rgba(255, 255, 255, 0.2)", 
            padding: "4px 12px", 
            borderRadius: "999px", 
            fontSize: "0.75rem", 
            fontWeight: 700, 
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px"
          }}>
            <Sparkles size={14} /> Layanan Resmi Apotek Hadinata
          </span>
          <h1 style={{ color: "white", fontSize: "2rem", marginTop: "12px", marginBottom: "8px" }}>
            Pesan Obat Non-Resep Lebih Mudah & Aman
          </h1>
          <p style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "0.95rem", lineHeight: "1.6" }}>
            Dapatkan kepastian stok online, sistem seleksi kedaluwarsa terstandar FEFO, dan layanan pengantaran langsung oleh kurir internal apotek ke lokasi Anda.
          </p>

          <div style={{ display: "flex", gap: "20px", marginTop: "24px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem" }}>
              <ShieldCheck size={18} /> Obat Bebas Asli & Resmi
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem" }}>
              <Truck size={18} /> Antar Kurir Internal
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem" }}>
              <Clock size={18} /> Stok Terpantau Real-time
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className="alert alert-success animate-fade-in" style={{ marginBottom: "20px" }}>
          <CheckCircle2 size={18} />
          <span>{message}</span>
        </div>
      )}

      {/* Search & Category Filter Toolbar */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: "260px", display: "flex", gap: "8px" }}>
          <input
            type="text"
            className="form-input"
            placeholder="Cari nama obat (contoh: Paracetamol, Vitamin C)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            <Search size={16} /> Cari
          </button>
        </form>

        <select
          className="form-select"
          style={{ width: "auto", minWidth: "180px" }}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Catalog Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--color-text-muted)" }}>
          <Pill size={36} className="animate-pulse" style={{ margin: "0 auto 12px", color: "var(--color-primary)" }} />
          <p>Sedang memuat katalog obat Apotek Hadinata...</p>
        </div>
      ) : medicines.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <AlertCircle size={40} color="var(--color-text-muted)" style={{ margin: "0 auto 12px" }} />
          <h3>Obat Belum Tersedia</h3>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
            Belum ada obat yang cocok dengan kriteria pencarian Anda. Silakan hubungi Apoteker kami melalui Live Chat.
          </p>
          <button className="btn btn-outline-primary" style={{ marginTop: "16px" }} onClick={() => onNavigate("chat")}>
            <MessageSquare size={16} /> Tanya Apoteker
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
          {medicines.map((med) => {
            const totalStock = (med.batches || []).reduce((sum, b) => sum + (b.stock || 0), 0);
            const inStock = totalStock > 0 && med.status === "in stock";

            return (
              <div key={med.id} className="card" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                {/* Medicine Image / Placeholder */}
                <div 
                  style={{ 
                    height: "150px", 
                    borderRadius: "var(--radius-md)", 
                    background: "var(--color-bg)",
                    border: "1px solid var(--color-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "14px",
                    overflow: "hidden"
                  }}
                >
                  {med.image ? (
                    <img src={med.image} alt={med.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <Pill size={48} color="#94a3b8" />
                  )}
                </div>

                {/* Category & Status Badges */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-secondary)", textTransform: "uppercase" }}>
                    {med.Category?.name || "Obat Bebas"}
                  </span>
                  <span style={{ 
                    fontSize: "0.7rem", 
                    fontWeight: 700, 
                    padding: "2px 8px", 
                    borderRadius: "999px",
                    background: inStock ? "#ecfdf5" : "#fef2f2",
                    color: inStock ? "#065f46" : "#b91c1c"
                  }}>
                    {inStock ? `Tersedia (${totalStock})` : "Habis"}
                  </span>
                </div>

                {/* Name & SKU */}
                <h3 style={{ fontSize: "1.05rem", marginBottom: "4px", fontWeight: 700 }}>
                  {med.name}
                </h3>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "8px" }}>
                  SKU: {med.SKU_code || "-"}
                </div>

                <p style={{ 
                  fontSize: "0.825rem", 
                  color: "var(--color-text-muted)", 
                  flex: 1, 
                  marginBottom: "16px",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden"
                }}>
                  {med.desc || "Obat non-resep terdaftar resmi Apotek Hadinata."}
                </p>

                {/* Price & Action */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid var(--color-border)" }}>
                  <div>
                    <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>Harga</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-primary)" }}>
                      Rp {Number(med.price || 0).toLocaleString("id-ID")}
                    </div>
                  </div>

                  <button 
                    className="btn btn-sm btn-primary"
                    disabled={!inStock}
                    onClick={() => handleAdd(med)}
                  >
                    <ShoppingCart size={15} /> Beli
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
