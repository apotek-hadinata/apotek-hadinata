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
  Sparkles,
  Star,
  Sun,
  Flower2,
  Hexagon,
  Shield,
  Heart,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

// =========================================================
// REALISTIC REFERENCE ILLUSTRATIONS & MOCKUPS
// =========================================================

// Hero Left Floating Medical Decoration (Blister & Dropper)
const HeroLeftDecoration = () => (
  <div className="ref-hero-decor-left">
    <svg viewBox="0 0 160 180" width="150" height="170" opacity="0.9" style={{ filter: "drop-shadow(0 10px 20px rgba(2,132,199,0.15))" }}>
      {/* Blue Capsule Blister Pack */}
      <rect x="15" y="15" width="95" height="120" rx="8" fill="#ffffff" stroke="#bae6fd" strokeWidth="2" />
      <rect x="18" y="18" width="89" height="14" rx="3" fill="#0284c7" />
      {/* Capsules */}
      {[0, 1, 2].map(r => (
        [0, 1].map(c => (
          <g key={`${r}-${c}`} transform={`translate(${30 + c * 38}, ${45 + r * 30})`}>
            <rect x="0" y="0" width="22" height="10" rx="5" fill="#38bdf8" />
            <rect x="0" y="0" width="11" height="10" rx="5" fill="#0284c7" />
          </g>
        ))
      ))}
      {/* Blue Dropper Bottle standing next to it */}
      <rect x="85" y="80" width="28" height="55" rx="6" fill="#0369a1" />
      <rect x="92" y="68" width="14" height="13" rx="2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
      <rect x="96" y="58" width="6" height="11" rx="2" fill="#38bdf8" />
      <rect x="87" y="96" width="24" height="24" rx="2" fill="#ffffff" />
      <line x1="91" y1="104" x2="107" y2="104" stroke="#0284c7" strokeWidth="2" />
    </svg>
  </div>
);

// Hero Right Floating Medical Decoration (Stethoscope & Amber Jar)
const HeroRightDecoration = () => (
  <div className="ref-hero-decor-right">
    <svg viewBox="0 0 170 190" width="160" height="180" opacity="0.9" style={{ filter: "drop-shadow(0 10px 20px rgba(15,23,42,0.12))" }}>
      {/* Stethoscope Head */}
      <circle cx="120" cy="125" r="32" fill="none" stroke="#64748b" strokeWidth="6" />
      <circle cx="120" cy="125" r="24" fill="#334155" />
      <circle cx="120" cy="125" r="14" fill="#94a3b8" />
      <path d="M 88 125 C 60 125 45 90 45 35" fill="none" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />
      {/* Amber Medicine Jar */}
      <rect x="25" y="75" width="44" height="75" rx="8" fill="#78350f" opacity="0.9" />
      <rect x="30" y="62" width="34" height="14" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
      <rect x="27" y="94" width="40" height="38" rx="2" fill="#ffffff" />
      <rect x="30" y="102" width="34" height="8" rx="2" fill="#ea580c" />
      {/* Scattered orange tablets */}
      <circle cx="85" cy="155" r="8" fill="#f97316" stroke="#c2410c" strokeWidth="1" />
      <line x1="80" y1="155" x2="90" y2="155" stroke="#ffffff" strokeWidth="1.5" />
      <circle cx="102" cy="168" r="7" fill="#f97316" stroke="#c2410c" strokeWidth="1" />
    </svg>
  </div>
);

// Promo 1: 3D Blue Medicine Box Mockup
const PromoBoxMockup = () => (
  <svg viewBox="0 0 130 110" width="120" height="100" style={{ filter: "drop-shadow(0 8px 16px rgba(2,132,199,0.22))" }}>
    <polygon points="15,45 55,65 55,102 15,82" fill="#0284c7" />
    <polygon points="55,65 115,44 115,82 55,102" fill="#38bdf8" />
    <polygon points="15,45 75,25 115,44 55,65" fill="#7dd3fc" />
    <circle cx="85" cy="68" r="13" fill="#ffffff" opacity="0.9" />
    <rect x="82" y="60" width="6" height="16" rx="2" fill="#0284c7" />
    <rect x="77" y="65" width="16" height="6" rx="2" fill="#0284c7" />
    <line x1="25" y1="70" x2="25" y2="78" stroke="#ffffff" strokeWidth="2" opacity="0.7" />
    <line x1="30" y1="70" x2="30" y2="78" stroke="#ffffff" strokeWidth="1" opacity="0.7" />
    <line x1="34" y1="70" x2="34" y2="78" stroke="#ffffff" strokeWidth="2.5" opacity="0.7" />
  </svg>
);

// Promo 2: Vitamin Bottles Mockup (Peach/Pink)
const PromoVitaminsMockup = () => (
  <svg viewBox="0 0 130 110" width="120" height="100" style={{ filter: "drop-shadow(0 8px 16px rgba(244,63,94,0.18))" }}>
    <rect x="22" y="16" width="34" height="12" rx="3" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
    <rect x="15" y="26" width="48" height="74" rx="10" fill="#ffffff" stroke="#fecdd3" strokeWidth="1.5" />
    <rect x="17" y="40" width="44" height="44" rx="4" fill="#fff1f2" />
    <rect x="21" y="46" width="36" height="7" rx="2" fill="#f43f5e" />
    <circle cx="39" cy="68" r="7" fill="#fda4af" />
    <rect x="74" y="34" width="26" height="10" rx="3" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
    <rect x="68" y="42" width="38" height="58" rx="8" fill="#fff1f2" stroke="#fecdd3" strokeWidth="1.5" />
    <rect x="70" y="54" width="34" height="32" rx="3" fill="#ffffff" />
    <circle cx="87" cy="70" r="5" fill="#fb7185" />
  </svg>
);

// Promo 3: Medical Tubes & Dropper (Mint Green)
const PromoTubesMockup = () => (
  <svg viewBox="0 0 130 110" width="120" height="100" style={{ filter: "drop-shadow(0 8px 16px rgba(16,185,129,0.18))" }}>
    <g transform="rotate(-18 42 60)">
      <rect x="32" y="14" width="20" height="70" rx="5" fill="#10b981" />
      <rect x="36" y="7" width="12" height="8" rx="2" fill="#ffffff" stroke="#059669" strokeWidth="1" />
      <rect x="34" y="30" width="16" height="34" rx="2" fill="#ffffff" />
      <line x1="37" y1="39" x2="47" y2="39" stroke="#059669" strokeWidth="2" />
    </g>
    <rect x="74" y="24" width="22" height="75" rx="5" fill="#d1fae5" stroke="#a7f3d0" strokeWidth="1.5" />
    <rect x="79" y="15" width="12" height="10" rx="2" fill="#059669" />
    <rect x="76" y="42" width="18" height="38" rx="2" fill="#ffffff" />
    <circle cx="85" cy="58" r="4.5" fill="#10b981" />
  </svg>
);

// Promo 4: Cough Syrup & Blister (Yellow/Warm)
const PromoSyrupMockup = () => (
  <svg viewBox="0 0 130 110" width="120" height="100" style={{ filter: "drop-shadow(0 8px 16px rgba(245,158,11,0.18))" }}>
    <rect x="25" y="14" width="18" height="10" rx="2" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
    <rect x="14" y="22" width="40" height="76" rx="8" fill="#78350f" opacity="0.9" />
    <rect x="18" y="38" width="32" height="44" rx="3" fill="#fef9c3" />
    <rect x="20" y="44" width="28" height="6" rx="2" fill="#eab308" />
    <circle cx="34" cy="66" r="5" fill="#ca8a04" />
    <rect x="62" y="32" width="48" height="66" rx="5" fill="#ffffff" stroke="#fde047" strokeWidth="1.5" />
    <rect x="65" y="35" width="42" height="11" rx="2" fill="#facc15" />
    <circle cx="73" cy="58" r="4.5" fill="#ffffff" stroke="#ca8a04" strokeWidth="1.5" />
    <circle cx="86" cy="58" r="4.5" fill="#ffffff" stroke="#ca8a04" strokeWidth="1.5" />
    <circle cx="99" cy="58" r="4.5" fill="#ffffff" stroke="#ca8a04" strokeWidth="1.5" />
    <circle cx="73" cy="78" r="4.5" fill="#ffffff" stroke="#ca8a04" strokeWidth="1.5" />
    <circle cx="86" cy="78" r="4.5" fill="#ffffff" stroke="#ca8a04" strokeWidth="1.5" />
    <circle cx="99" cy="78" r="4.5" fill="#ffffff" stroke="#ca8a04" strokeWidth="1.5" />
  </svg>
);

// Miniature compositions for Circular Category Carousel
const CategoryCircleGraphic = ({ type = "otc" }) => {
  switch (type) {
    case "ayush":
    case "herbal":
      return (
        <svg viewBox="0 0 60 60" width="52" height="52">
          <circle cx="30" cy="30" r="28" fill="#f0fdf4" />
          <path d="M 30 14 C 20 20 20 38 30 42 C 40 38 40 20 30 14 Z" fill="#22c55e" />
          <path d="M 30 18 L 30 38" stroke="#15803d" strokeWidth="2" strokeLinecap="round" />
          <line x1="30" y1="26" x2="25" y2="23" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="30" y1="30" x2="35" y2="27" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "covid":
    case "vitamin":
      return (
        <svg viewBox="0 0 60 60" width="52" height="52">
          <circle cx="30" cy="30" r="28" fill="#fff7ed" />
          <rect x="22" y="16" width="16" height="28" rx="6" fill="#f97316" />
          <rect x="24" y="12" width="12" height="5" rx="1.5" fill="#ea580c" />
          <line x1="30" y1="22" x2="30" y2="34" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="24" y1="28" x2="36" y2="28" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case "devices":
    case "alat":
      return (
        <svg viewBox="0 0 60 60" width="52" height="52">
          <circle cx="30" cy="30" r="28" fill="#eff6ff" />
          <rect x="18" y="20" width="24" height="24" rx="4" fill="#0284c7" />
          <rect x="22" y="24" width="16" height="10" rx="2" fill="#ffffff" />
          <circle cx="30" cy="38" r="2.5" fill="#38bdf8" />
        </svg>
      );
    case "diabetes":
      return (
        <svg viewBox="0 0 60 60" width="52" height="52">
          <circle cx="30" cy="30" r="28" fill="#fef2f2" />
          <path d="M 30 14 C 23 23 20 28 20 34 C 20 40 24.5 45 30 45 C 35.5 45 40 40 40 34 C 40 28 37 23 30 14 Z" fill="#ef4444" />
          <circle cx="27" cy="32" r="3" fill="#ffffff" opacity="0.6" />
        </svg>
      );
    case "eyewear":
    case "mata":
      return (
        <svg viewBox="0 0 60 60" width="52" height="52">
          <circle cx="30" cy="30" r="28" fill="#f0f9ff" />
          <rect x="24" y="22" width="12" height="24" rx="3" fill="#0284c7" />
          <rect x="26" y="16" width="8" height="7" rx="1.5" fill="#38bdf8" />
          <path d="M 30 11 L 30 15" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
          <circle cx="30" cy="34" r="3" fill="#ffffff" />
        </svg>
      );
    case "fitness":
      return (
        <svg viewBox="0 0 60 60" width="52" height="52">
          <circle cx="30" cy="30" r="28" fill="#faf5ff" />
          <rect x="20" y="18" width="20" height="26" rx="4" fill="#7e22ce" />
          <rect x="22" y="14" width="16" height="5" rx="1.5" fill="#a855f7" />
          <rect x="23" y="24" width="14" height="12" rx="2" fill="#ffffff" />
        </svg>
      );
    default:
      // OTC Dots (blister & bottles)
      return (
        <svg viewBox="0 0 60 60" width="52" height="52">
          <circle cx="30" cy="30" r="28" fill="#eff6ff" />
          <rect x="16" y="18" width="16" height="26" rx="3" fill="#0284c7" />
          <rect x="19" y="14" width="10" height="5" rx="1" fill="#ffffff" />
          <rect x="34" y="22" width="14" height="20" rx="3" fill="#ffffff" stroke="#38bdf8" strokeWidth="1.5" />
          <circle cx="41" cy="28" r="2.5" fill="#0284c7" />
          <circle cx="41" cy="36" r="2.5" fill="#0284c7" />
        </svg>
      );
  }
};

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
  const [activePopularCat, setActivePopularCat] = useState(null);
  const [activeHeroDot, setActiveHeroDot] = useState(0);

  const popularCategories = [
    { key: "otc", label: "Otc Dots", type: "otc", match: ["obat bebas", "analgesik", "umum", "batuk"] },
    { key: "ayush", label: "Ayush", type: "ayush", match: ["herbal", "jamu", "tradisional"] },
    { key: "covid", label: "Covid Essentials", type: "covid", match: ["flu", "batuk", "antivirus", "masker", "covid"] },
    { key: "devices", label: "Devices", type: "devices", match: ["alat", "medis", "device", "tensimeter"] },
    { key: "diabetes", label: "Diabetes", type: "diabetes", match: ["diabetes", "gula", "insulin"] },
    { key: "eyewear", label: "Eyewear", type: "eyewear", match: ["mata", "tetes", "optik"] },
    { key: "fitness", label: "Fitness", type: "fitness", match: ["vitamin", "suplemen", "nutrisi", "fitness"] },
  ];

  const handlePopularCategoryClick = (catItem) => {
    if (activePopularCat === catItem.key) {
      setActivePopularCat(null);
      setSelectedCategory("");
      setSearchQuery("");
      return;
    }

    setActivePopularCat(catItem.key);
    const found = categories.find(c => 
      catItem.match.some(m => c.name.toLowerCase().includes(m))
    );
    if (found) {
      setSelectedCategory(found.id.toString());
      setSearchQuery("");
    } else {
      setSelectedCategory("");
      setSearchQuery(catItem.match[0]);
    }

    const el = document.getElementById("daily-products-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

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
    setActivePopularCat(null);
    loadCatalog();
    const el = document.getElementById("daily-products-section");
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
          1. SKY BLUE REFERENCE HERO BANNER (MOVING MEDICINE TEMPLATE)
          ========================================================= */}
      <section className="ref-hero-wrapper">
        <HeroLeftDecoration />
        <HeroRightDecoration />

        <div className="ref-hero-content">
          <h1 className="ref-hero-title">
            Healthy Tablets and Medicine
          </h1>
          <p className="ref-hero-subtitle">
            Penyedia obat terpercaya, suplemen kesehatan alami & alat diagnosa medis terstandarisasi dengan jaminan mutu FEFO & pengantaran cepat.
          </p>

          {/* Unified Pill Search Bar */}
          <form className="ref-search-bar" onSubmit={handleSearchSubmit}>
            <select 
              className="ref-search-select"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setActivePopularCat(null);
              }}
            >
              <option value="">All category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <div className="ref-search-divider"></div>

            <input 
              type="text"
              className="ref-search-input"
              placeholder="Search for something fun or medicine..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <button type="submit" className="ref-search-btn" title="Cari Obat">
              <Search size={16} />
            </button>
          </form>

          {/* Two Rounded Action Buttons */}
          <div className="ref-hero-actions">
            <button 
              className="ref-hero-btn-dark"
              onClick={() => {
                const el = document.getElementById("daily-products-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Check Now
            </button>
            <button 
              className="ref-hero-btn-light"
              onClick={() => {
                const el = document.getElementById("popular-categories-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Find Medicine
            </button>
          </div>

          {/* 3 Carousel Indicator Dots */}
          <div className="ref-hero-dots">
            <span 
              className={`ref-hero-dot ${activeHeroDot === 0 ? "active" : ""}`}
              onClick={() => setActiveHeroDot(0)}
              style={{ cursor: "pointer" }}
            ></span>
            <span 
              className={`ref-hero-dot ${activeHeroDot === 1 ? "active" : ""}`}
              onClick={() => setActiveHeroDot(1)}
              style={{ cursor: "pointer" }}
            ></span>
            <span 
              className={`ref-hero-dot ${activeHeroDot === 2 ? "active" : ""}`}
              onClick={() => setActiveHeroDot(2)}
              style={{ cursor: "pointer" }}
            ></span>
          </div>
        </div>
      </section>

      {/* =========================================================
          2. FOUR SERVICE PILLARS (DIRECTLY UNDER HERO)
          ========================================================= */}
      <section className="services-pillars-grid">
        <div className="service-pillar-item">
          <div className="service-pillar-icon-box pillar-orange">
            <Sun size={24} />
          </div>
          <div>
            <div className="service-pillar-title">Medicine</div>
            <p className="service-pillar-desc">
              Koleksi obat resmi BPOM, resep dokter & analgesik bermutu.
            </p>
          </div>
        </div>

        <div className="service-pillar-item">
          <div className="service-pillar-icon-box pillar-green">
            <Flower2 size={24} />
          </div>
          <div>
            <div className="service-pillar-title">Wellness</div>
            <p className="service-pillar-desc">
              Suplemen multivitamin organik & produk gaya hidup fit.
            </p>
          </div>
        </div>

        <div className="service-pillar-item">
          <div className="service-pillar-icon-box pillar-blue">
            <Hexagon size={24} />
          </div>
          <div>
            <div className="service-pillar-title">Diagnostic</div>
            <p className="service-pillar-desc">
              Peralatan tes mandiri, tensimeter & glukometer akurat.
            </p>
          </div>
        </div>

        <div className="service-pillar-item">
          <div className="service-pillar-icon-box pillar-yellow">
            <Shield size={24} />
          </div>
          <div>
            <div className="service-pillar-title">Health Corner</div>
            <p className="service-pillar-desc">
              Konsultasi apoteker berlisensi & panduan penggunaan obat.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================
          3. FOUR PASTEL PROMO HIGHLIGHT BANNERS (SIDE BY SIDE)
          ========================================================= */}
      <section className="promo-banners-grid">
        {/* Banner 1: Blue - Medication at One Place */}
        <div 
          className="promo-banner-card promo-card-blue"
          onClick={() => {
            setSelectedCategory("");
            setSearchQuery("");
            setActivePopularCat(null);
            const el = document.getElementById("daily-products-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <div>
            <div className="promo-card-tag">GET ALL YOUR</div>
            <div className="promo-card-title">Medication at One Place</div>
            <button className="promo-card-btn">Shop Now →</button>
          </div>
          <div className="promo-card-art">
            <PromoBoxMockup />
          </div>
        </div>

        {/* Banner 2: Pink - Naturally Good */}
        <div 
          className="promo-banner-card promo-card-pink"
          onClick={() => {
            const vitCat = categories.find(c => c.name.toLowerCase().includes("vitamin") || c.name.toLowerCase().includes("suplemen"));
            if (vitCat) {
              setSelectedCategory(vitCat.id.toString());
            } else {
              setSearchQuery("Vitamin");
            }
            const el = document.getElementById("daily-products-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <div>
            <div className="promo-card-tag">UP TO 15% OFF</div>
            <div className="promo-card-title">Naturally Good</div>
            <button className="promo-card-btn">Shop Now →</button>
          </div>
          <div className="promo-card-art">
            <PromoVitaminsMockup />
          </div>
        </div>

        {/* Banner 3: Green - Medlife Products */}
        <div 
          className="promo-banner-card promo-card-green"
          onClick={() => {
            const fluCat = categories.find(c => c.name.toLowerCase().includes("flu") || c.name.toLowerCase().includes("batuk") || c.name.toLowerCase().includes("pencernaan"));
            if (fluCat) {
              setSelectedCategory(fluCat.id.toString());
            } else {
              setSearchQuery("Flu");
            }
            const el = document.getElementById("daily-products-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <div>
            <div className="promo-card-tag">UP TO 20% OFF</div>
            <div className="promo-card-title">Medlife Products</div>
            <button className="promo-card-btn">Shop Now →</button>
          </div>
          <div className="promo-card-art">
            <PromoTubesMockup />
          </div>
        </div>

        {/* Banner 4: Yellow - Medicines Popularly */}
        <div 
          className="promo-banner-card promo-card-yellow"
          onClick={() => {
            setSelectedCategory("");
            setSearchQuery("");
            setActivePopularCat(null);
            const el = document.getElementById("daily-products-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <div>
            <div className="promo-card-tag">UP TO 25% OFF</div>
            <div className="promo-card-title">Medicines Popularly</div>
            <button className="promo-card-btn">Shop Now →</button>
          </div>
          <div className="promo-card-art">
            <PromoSyrupMockup />
          </div>
        </div>
      </section>

      {/* =========================================================
          4. POPULAR CATEGORIES CAROUSEL (CIRCULAR PHOTO CARDS)
          ========================================================= */}
      <section className="popular-categories-section" id="popular-categories-section">
        <div className="section-label-cyan">Our Categories</div>
        <h2 className="section-title-bold">Popular Categories</h2>

        <div className="popular-categories-carousel">
          <button 
            className="carousel-nav-btn"
            title="Kategori Sebelumnya"
            onClick={() => {
              const container = document.getElementById("popular-categories-carousel-list");
              if (container) container.scrollBy({ left: -140, behavior: "smooth" });
            }}
          >
            <ChevronLeft size={18} />
          </button>

          <div 
            id="popular-categories-carousel-list"
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "24px", 
              overflowX: "auto", 
              scrollBehavior: "smooth",
              padding: "8px 6px" 
            }}
          >
            {popularCategories.map((cat) => {
              const isActive = activePopularCat === cat.key;
              return (
                <button
                  key={cat.key}
                  className={`popular-category-item ${isActive ? "active" : ""}`}
                  onClick={() => handlePopularCategoryClick(cat)}
                  title={`Filter kategori: ${cat.label}`}
                >
                  <div className="popular-category-circle">
                    <CategoryCircleGraphic type={cat.type} />
                  </div>
                  <span className="popular-category-name">{cat.label}</span>
                </button>
              );
            })}
          </div>

          <button 
            className="carousel-nav-btn"
            title="Kategori Selanjutnya"
            onClick={() => {
              const container = document.getElementById("popular-categories-carousel-list");
              if (container) container.scrollBy({ left: 140, behavior: "smooth" });
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* =========================================================
          5. OUR DAILY PRODUCTS GRID (+10,000 PHARMACY PRODUCTS)
          ========================================================= */}
      <section className="daily-products-section" id="daily-products-section">
        <div className="daily-products-header">
          <div className="section-label-cyan">Our Daily Products</div>
          <h2 className="section-title-bold">+10,000 Pharmacy products daily!</h2>

          {(selectedCategory || searchQuery || activePopularCat) && (
            <div style={{ marginTop: "12px" }}>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSelectedCategory("");
                  setSearchQuery("");
                  setActivePopularCat(null);
                }}
              >
                Reset Filter ({medicines.length} produk ditemukan)
              </button>
            </div>
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
              Tidak ada produk obat yang cocok dengan kriteria pencarian Anda.
            </p>
            <button className="btn btn-primary" onClick={() => { setSearchQuery(""); setSelectedCategory(""); setActivePopularCat(null); }}>
              Tampilkan Semua Produk
            </button>
          </div>
        ) : (
          <div className="daily-products-grid">
            {medicines.map((med, idx) => {
              const totalStock = (med.batches || []).reduce((s, b) => s + (b.stock || 0), 0);
              const isOutOfStock = totalStock <= 0;
              
              // FEFO batch
              const sortedBatches = [...(med.batches || [])].sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
              const earliestExp = sortedBatches[0]?.expiry_date;

              const discounts = ["15% OFF", "20% OFF", "BPOM", "BEST SELLER"];
              const badgeText = discounts[idx % discounts.length];

              return (
                <div key={med.id} className="daily-product-card">
                  <div>
                    {/* Discount badge */}
                    <span className="product-discount-badge">
                      {badgeText}
                    </span>

                    {/* Packaging Mockup Container */}
                    <div className="daily-product-img-box">
                      {med.image ? (
                        <img src={med.image} alt={med.name} />
                      ) : (
                        <MedicineIllustration name={med.name} category={med.Category?.name} />
                      )}
                    </div>

                    <div className="daily-product-category">
                      {med.Category?.name || "Personal Care, General Wellness"}
                    </div>

                    <h3 className="daily-product-title" title={med.name}>
                      {med.name}
                    </h3>

                    {/* Star Rating */}
                    <div className="daily-product-rating">
                      <Star size={13} fill="#eab308" color="#eab308" />
                      <Star size={13} fill="#eab308" color="#eab308" />
                      <Star size={13} fill="#eab308" color="#eab308" />
                      <Star size={13} fill="#eab308" color="#eab308" />
                      <Star size={13} fill="#eab308" color="#eab308" />
                      <span style={{ fontSize: "0.75rem", color: "#64748b", marginLeft: "4px" }}>
                        (4.8)
                      </span>
                    </div>

                    {/* Stock & FEFO Badges */}
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "12px", flexWrap: "wrap" }}>
                      {isOutOfStock ? (
                        <span className="badge badge-admin" style={{ background: "#fee2e2", color: "#991b1b", fontSize: "0.68rem" }}>
                          Stok Habis
                        </span>
                      ) : (
                        <span className="badge badge-user" style={{ fontSize: "0.68rem" }}>
                          Stok: {totalStock} unit
                        </span>
                      )}

                      {earliestExp && !isOutOfStock && (
                        <span className="expiry-tag expiry-safe" style={{ fontSize: "0.65rem" }}>
                          Exp: {earliestExp}
                        </span>
                      )}
                    </div>

                    {/* Price with strikethrough original */}
                    <div className="daily-product-prices">
                      <span className="daily-product-price-current">
                        Rp {(med.price || 0).toLocaleString("id-ID")}
                      </span>
                      <span className="daily-product-price-original">
                        Rp {Math.round((med.price || 0) * 1.2).toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>

                  {/* Add to Cart & Batch Detail Action */}
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "auto" }}>
                    <button 
                      className="daily-add-cart-btn"
                      onClick={() => handleAdd(med, 1)}
                      disabled={isOutOfStock}
                    >
                      <ShoppingCart size={14} />
                      <span>+ ADD TO CART</span>
                    </button>

                    <button 
                      className="btn btn-secondary btn-sm"
                      style={{ padding: "8px 10px", borderRadius: "9999px", flexShrink: 0 }}
                      onClick={() => {
                        setActiveModalMed(med);
                        setModalQty(1);
                      }}
                      title="Lihat Detail FEFO & Khasiat"
                    >
                      <Eye size={15} />
                    </button>
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
