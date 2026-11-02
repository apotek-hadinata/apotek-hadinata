import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  User, 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  AlertCircle,
  ExternalLink,
  ReceiptText,
  Banknote,
  Navigation
} from "lucide-react";

const APOTEK_COORDS = { lat: -7.7956, lng: 110.3695 };

const getValidStockFromBatches = (batches) => {
  if (!Array.isArray(batches)) return null;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return batches.reduce((sum, b) => {
    const exp = new Date(b.expiry_date);
    const notExpired = !Number.isNaN(exp.getTime()) && exp >= startOfToday;
    return notExpired && (b.stock || 0) > 0 ? sum + Number(b.stock) : sum;
  }, 0);
};

const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.max(0.5, Number((R * c).toFixed(1)));
};

export const CartPage = ({ onBackToCatalog, onCartUpdated, onNavigateToOrders }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Dynamic Pharmacy Operational Settings & Saved Address Book
  const [storeSettings, setStoreSettings] = useState({
    shipping_cost_default: 10000,
    free_shipping_min_order: 150000,
    apotek_latitude: APOTEK_COORDS.lat,
    apotek_longitude: APOTEK_COORDS.lng,
  });
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  // Checkout flow state: 'cart' | 'checkout' | 'success'
  const [step, setStep] = useState("cart");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    recipient_name: user?.name || "",
    recipient_phone: user?.phone || "",
    shipping_address: user?.address || "",
    delivery_notes: "",
    payment_method: "QRIS", // 'QRIS' | 'COD'
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        recipient_name: prev.recipient_name || user.name || "",
        recipient_phone: prev.recipient_phone || user.phone || "",
        shipping_address: prev.shipping_address || user.address || "",
      }));
    }
  }, [user]);

  // Live GPS Coordinates State for Internal Courier Routing
  const [gpsState, setGpsState] = useState({
    latitude: APOTEK_COORDS.lat,
    longitude: APOTEK_COORDS.lng,
    distance: 2.5,
    detected: false,
    detecting: false,
    info: "",
  });

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setGpsState((prev) => ({
        ...prev,
        info: "Browser tidak mendukung fitur Geolocation GPS.",
      }));
      return;
    }

    setGpsState((prev) => ({ ...prev, detecting: true, info: "" }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        const dist = calculateDistanceKm(
          storeSettings.apotek_latitude,
          storeSettings.apotek_longitude,
          lat,
          lng
        );
        setGpsState({
          latitude: lat,
          longitude: lng,
          distance: dist,
          detected: true,
          detecting: false,
          info: `Titik GPS aktif (${lat}, ${lng}) • Estimasi jarak dari gerai: ${dist} km`,
        });
      },
      () => {
        setGpsState((prev) => ({
          ...prev,
          detecting: false,
          info: "Izin lokasi ditolak atau sinyal GPS tidak tersedia. Menggunakan titik pengantaran standar.",
        }));
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const [cartRes, settingsRes, addrRes] = await Promise.allSettled([
        api.getCart(),
        api.getPublicSettings(),
        api.getMyAddresses(),
      ]);

      if (cartRes.status === "fulfilled" && cartRes.value?.data) {
        setCartItems(cartRes.value.data);
      } else {
        setCartItems([]);
      }

      let currentApotekLat = APOTEK_COORDS.lat;
      let currentApotekLng = APOTEK_COORDS.lng;

      if (settingsRes.status === "fulfilled" && settingsRes.value?.data) {
        const s = settingsRes.value.data;
        const sCost = Number(s.shipping_cost_default) || 10000;
        const sFreeMin = Number(s.free_shipping_min_order) || 150000;
        const sLat = Number(s.apotek_latitude) || APOTEK_COORDS.lat;
        const sLng = Number(s.apotek_longitude) || APOTEK_COORDS.lng;
        currentApotekLat = sLat;
        currentApotekLng = sLng;
        setStoreSettings({
          shipping_cost_default: sCost,
          free_shipping_min_order: sFreeMin,
          apotek_latitude: sLat,
          apotek_longitude: sLng,
        });
      }

      if (addrRes.status === "fulfilled" && addrRes.value?.data && Array.isArray(addrRes.value.data)) {
        const addrs = addrRes.value.data;
        setSavedAddresses(addrs);
        const defaultAddr = addrs.find((a) => a.is_default) || addrs[0];
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
          setFormData((prev) => ({
            ...prev,
            recipient_name: defaultAddr.recipient_name || prev.recipient_name,
            recipient_phone: defaultAddr.recipient_phone || prev.recipient_phone,
            shipping_address: defaultAddr.address || prev.shipping_address,
          }));
          if (defaultAddr.latitude && defaultAddr.longitude) {
            const dist = calculateDistanceKm(
              currentApotekLat,
              currentApotekLng,
              defaultAddr.latitude,
              defaultAddr.longitude
            );
            setGpsState({
              latitude: defaultAddr.latitude,
              longitude: defaultAddr.longitude,
              distance: dist,
              detected: true,
              detecting: false,
              info: `Titik GPS dari Buku Alamat (${defaultAddr.label}) • Jarak: ${dist} km`,
            });
          }
        }
      }
    } catch (err) {
      setErrorMsg(err.message || "Gagal memuat isi keranjang belanja");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleSelectSavedAddress = (addr) => {
    setSelectedAddressId(addr.id);
    setFormData((prev) => ({
      ...prev,
      recipient_name: addr.recipient_name || prev.recipient_name,
      recipient_phone: addr.recipient_phone || prev.recipient_phone,
      shipping_address: addr.address || prev.shipping_address,
    }));
    if (addr.latitude && addr.longitude) {
      const dist = calculateDistanceKm(
        storeSettings.apotek_latitude,
        storeSettings.apotek_longitude,
        addr.latitude,
        addr.longitude
      );
      setGpsState({
        latitude: addr.latitude,
        longitude: addr.longitude,
        distance: dist,
        detected: true,
        detecting: false,
        info: `Titik GPS dari Buku Alamat (${addr.label}) • Estimasi jarak: ${dist} km`,
      });
    }
  };

  // Update quantity handler (+ or -)
  const handleUpdateQty = async (cartItemId, currentQty, delta, maxStock = null) => {
    const newQty = currentQty + delta;
    if (newQty < 1) {
      handleRemoveItem(cartItemId);
      return;
    }

    if (delta > 0 && maxStock !== null && newQty > maxStock) {
      setErrorMsg(`Kuantitas tidak dapat melebihi sisa stok aktif (${maxStock} unit tersedia).`);
      return;
    }

    try {
      setUpdatingId(cartItemId);
      setErrorMsg("");
      await api.updateCart(cartItemId, newQty);
      setCartItems((prev) =>
        prev.map((item) => (item.id === cartItemId ? { ...item, quantity: newQty } : item))
      );
      if (onCartUpdated) onCartUpdated();
    } catch (err) {
      setErrorMsg(err.message || "Gagal memperbarui kuantitas");
    } finally {
      setUpdatingId(null);
    }
  };

  // Remove single item
  const handleRemoveItem = async (cartItemId) => {
    try {
      setUpdatingId(cartItemId);
      await api.removeFromCart(cartItemId);
      setCartItems((prev) => prev.filter((item) => item.id !== cartItemId));
      if (onCartUpdated) onCartUpdated();
    } catch (err) {
      alert(err.message || "Gagal menghapus item dari keranjang");
    } finally {
      setUpdatingId(null);
    }
  };

  // Empty entire cart
  const handleClearCart = async () => {
    if (!window.confirm("Apakah Anda yakin ingin mengosongkan seluruh keranjang belanja?")) return;
    try {
      setLoading(true);
      await api.clearCart();
      setCartItems([]);
      if (onCartUpdated) onCartUpdated();
    } catch (err) {
      alert(err.message || "Gagal mengosongkan keranjang");
    } finally {
      setLoading(false);
    }
  };

  // Calculations
  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.Medicine?.price || 0;
    return sum + price * (item.quantity || 1);
  }, 0);

  // Dynamic shipping calculation from store settings
  const isFreeShipping = subtotal >= storeSettings.free_shipping_min_order;
  const shippingCost = cartItems.length === 0 ? 0 : isFreeShipping ? 0 : storeSettings.shipping_cost_default;
  const totalPayment = subtotal + shippingCost;

  // Submit Checkout
  const handleProcessCheckout = async (e) => {
    e.preventDefault();
    if (!formData.recipient_name || !formData.recipient_phone || !formData.shipping_address) {
      alert("Mohon lengkapi nama penerima, nomor WhatsApp/telepon, dan alamat pengiriman!");
      return;
    }

    try {
      setSubmittingOrder(true);
      setErrorMsg("");

      const payload = {
        items: cartItems.map((item) => ({
          medicine_id: item.medicine_id,
          quantity: item.quantity,
        })),
        recipient_name: formData.recipient_name,
        recipient_phone: formData.recipient_phone,
        payment_method: formData.payment_method,
        shipping_cost: shippingCost,
        shipping_address: `${formData.shipping_address}${
          formData.delivery_notes ? ` (Catatan: ${formData.delivery_notes})` : ""
        }`,
        latitude: gpsState.latitude,
        longitude: gpsState.longitude,
        distance: gpsState.distance,
      };

      const res = await api.checkoutOnline(payload);

      // Clean the cart after checkout
      await api.clearCart();
      if (onCartUpdated) onCartUpdated();

      setLastOrder({
        order_id: res.order_id,
        redirect_url: res.redirect_url,
        payment_method: formData.payment_method,
        total: totalPayment,
        itemsCount: cartItems.length,
        recipient: formData.recipient_name,
        address: formData.shipping_address,
      });

      setStep("success");
    } catch (err) {
      setErrorMsg(err.message || "Gagal memproses pemesanan. Pastikan stok obat mencukupi.");
    } finally {
      setSubmittingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: "60px 20px", textAlign: "center" }}>
        <div className="spinner" style={{ margin: "0 auto 16px" }}></div>
        <p style={{ color: "var(--color-text-muted)", fontWeight: 600 }}>Memuat keranjang belanja Anda...</p>
      </div>
    );
  }

  // SUCCESS STEP VIEW
  if (step === "success" && lastOrder) {
    return (
      <div className="card animate-fade-in" style={{ maxWidth: "640px", margin: "0 auto", padding: "36px 32px", textAlign: "center" }}>
        <div style={{ 
          width: "48px", 
          height: "48px", 
          borderRadius: "var(--radius-md)", 
          background: "var(--color-primary-light)", 
          border: "1px solid var(--color-primary-border)",
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          margin: "0 auto 16px",
          color: "var(--color-primary)"
        }}>
          <CheckCircle2 size={24} />
        </div>

        <h2 style={{ fontSize: "1.75rem", marginBottom: "8px" }}>Pesanan Berhasil Dibuat!</h2>
        <p style={{ color: "var(--color-text-muted)", marginBottom: "24px" }}>
          Nomor Pesanan: <strong>#{lastOrder.order_id}</strong>. Stok obat telah diamankan dengan algoritma FEFO.
        </p>

        <div style={{ 
          background: "var(--color-bg)", 
          border: "1px solid var(--color-border)", 
          borderRadius: "var(--radius-md)", 
          padding: "20px", 
          textAlign: "left",
          marginBottom: "28px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "var(--color-text-muted)" }}>Penerima:</span>
            <span style={{ fontWeight: 600 }}>{lastOrder.recipient}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "var(--color-text-muted)" }}>Alamat Kirim:</span>
            <span style={{ fontWeight: 500, maxWidth: "60%", textAlign: "right" }}>{lastOrder.address}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "var(--color-text-muted)" }}>Metode Pembayaran:</span>
            <span style={{ fontWeight: 700 }}>
              {lastOrder.payment_method === "COD" ? "Bayar di Tempat (COD)" : "Midtrans Snap / QRIS"}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "var(--color-text-muted)" }}>Total Tagihan:</span>
            <span style={{ fontWeight: 700, color: "var(--color-primary)", fontSize: "1.1rem" }}>
              Rp {lastOrder.total.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {lastOrder.payment_method === "COD" && (
            <div className="alert alert-info" style={{ textAlign: "left", marginBottom: "4px" }}>
              <Truck size={18} />
              <span>
                Pesanan COD Anda telah masuk ke antrean Admin Apotek. Siapkan uang tunai saat kurir tiba di alamat tujuan.
              </span>
            </div>
          )}
          {lastOrder.redirect_url && (
            <a 
              href={lastOrder.redirect_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ width: "100%", padding: "14px", fontSize: "1rem" }}
            >
              <CreditCard size={18} />
              Buka Pembayaran Midtrans Snap
              <ExternalLink size={16} />
            </a>
          )}

          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <button 
              className="btn btn-secondary" 
              style={{ flex: 1 }}
              onClick={onBackToCatalog}
            >
              Belanja Obat Lain
            </button>
            <button 
              className="btn btn-primary" 
              style={{ flex: 1 }}
              onClick={onNavigateToOrders}
            >
              <ReceiptText size={16} />
              Lihat Riwayat Pesanan
            </button>
          </div>
        </div>
      </div>
    );
  }

  // EMPTY CART STATE VIEW
  if (cartItems.length === 0 && step === "cart") {
    return (
      <div className="card animate-fade-in" style={{ padding: "52px 24px", textAlign: "center", maxWidth: "560px", margin: "0 auto" }}>
        <div style={{ 
          width: "48px", 
          height: "48px", 
          borderRadius: "var(--radius-md)", 
          background: "var(--color-bg)", 
          border: "1px solid var(--color-border)",
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          margin: "0 auto 16px",
          color: "var(--color-text-muted)"
        }}>
          <ShoppingBag size={22} />
        </div>
        <h2 style={{ fontSize: "1.35rem", marginBottom: "8px" }}>Keranjang Belanja Kosong</h2>
        <p style={{ color: "var(--color-text-muted)", marginBottom: "24px", fontSize: "0.9rem" }}>
          Anda belum menambahkan sediaan obat ke dalam keranjang. Pilih obat yang dibutuhkan melalui katalog farmasi kami.
        </p>
        <button className="btn btn-primary" onClick={onBackToCatalog}>
          Jelajahi Katalog Obat
          <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: "1120px", margin: "0 auto" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={step === "checkout" ? () => setStep("cart") : onBackToCatalog}
            style={{ marginBottom: "8px" }}
          >
            <ArrowLeft size={15} />
            {step === "checkout" ? "Kembali ke Keranjang" : "Lanjut Belanja Obat"}
          </button>
          <h1 style={{ fontSize: "1.55rem" }}>
            {step === "cart" ? "Keranjang Belanja" : "Konfirmasi Pengiriman & Pembayaran"}
          </h1>
        </div>

        {step === "cart" && cartItems.length > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={handleClearCart} style={{ color: "var(--color-danger)" }}>
            <Trash2 size={16} />
            Kosongkan Keranjang
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="alert alert-danger" style={{ marginBottom: "20px" }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Cart Items / Checkout Form on Left, Order Summary on Right */}
      <div className="cart-layout-grid">
        {/* LEFT COLUMN */}
        <div className="cart-left-col">
          {step === "cart" ? (
            /* LIST OF CART ITEMS */
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {cartItems.map((item) => {
                const med = item.Medicine || {};
                const itemTotal = (med.price || 0) * (item.quantity || 1);
                const isUpdating = updatingId === item.id;
                const availableStock = getValidStockFromBatches(med.batches);
                const isAtMaxStock = availableStock !== null && item.quantity >= availableStock;

                return (
                  <div key={item.id} className="card cart-item-card" style={{ opacity: isUpdating ? 0.6 : 1 }}>
                    {/* Medicine Image / Placeholder */}
                    <div className="cart-item-img-wrap">
                      {med.image ? (
                        <img src={med.image} alt={med.name} className="cart-item-img" />
                      ) : (
                        <div className="cart-item-placeholder">
                          <ShoppingBag size={24} color="var(--color-primary)" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div style={{ flex: 1, minWidth: "180px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                        <span className="badge badge-user" style={{ fontSize: "0.68rem", fontFamily: "var(--font-mono)" }}>
                          SKU: {med.SKU_code || "MED-OBAT"}
                        </span>
                        {availableStock !== null && (
                          <span style={{ fontSize: "0.73rem", color: isAtMaxStock ? "var(--color-warning)" : "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
                            Sisa stok aktif: {availableStock} unit
                          </span>
                        )}
                      </div>
                      <h3 style={{ fontSize: "1.05rem", marginBottom: "4px" }}>{med.name}</h3>
                      <p style={{ color: "var(--accent-price)", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1rem" }}>
                        Rp {(med.price || 0).toLocaleString("id-ID")}
                        <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", fontFamily: "var(--font-sans)", fontWeight: 500 }}> / item</span>
                      </p>
                    </div>

                    {/* Quantity Selector Pill */}
                    <div className="qty-control-pill">
                      <button 
                        className="qty-btn" 
                        onClick={() => handleUpdateQty(item.id, item.quantity, -1, availableStock)}
                        disabled={isUpdating}
                        title="Kurangi kuantitas"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="qty-value">{item.quantity}</span>
                      <button 
                        className="qty-btn" 
                        onClick={() => handleUpdateQty(item.id, item.quantity, 1, availableStock)}
                        disabled={isUpdating || isAtMaxStock}
                        title={isAtMaxStock ? `Batas maksimum stok aktif (${availableStock} unit)` : "Tambah kuantitas"}
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Subtotal & Delete */}
                    <div style={{ textAlign: "right", minWidth: "120px" }}>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Total Item</div>
                      <div style={{ fontWeight: 700, color: "var(--color-text-main)", fontSize: "1.05rem" }}>
                        Rp {itemTotal.toLocaleString("id-ID")}
                      </div>
                      <button 
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={isUpdating}
                        className="btn-icon-danger"
                        title="Hapus obat ini"
                        style={{ marginTop: "6px" }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* CHECKOUT ADDRESS & PAYMENT FORM */
            <form id="checkout-form" onSubmit={handleProcessCheckout} className="card" style={{ padding: "28px" }}>
              <h3 style={{ fontSize: "1.25rem", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                <MapPin size={20} color="var(--color-primary)" />
                Informasi Pengiriman & Penerima
              </h3>

              {savedAddresses.length > 0 && (
                <div style={{ marginBottom: "18px", padding: "12px", background: "var(--color-bg)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: "8px", color: "var(--color-text-main)" }}>
                    Pilih Alamat dari Buku Alamat Tersimpan:
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {savedAddresses.map((addr) => (
                      <button
                        key={addr.id}
                        type="button"
                        className={`btn btn-sm ${selectedAddressId === addr.id ? "btn-primary" : "btn-secondary"}`}
                        onClick={() => handleSelectSavedAddress(addr)}
                        style={{ fontSize: "0.78rem" }}
                      >
                        <MapPin size={12} />
                        {addr.label} {addr.is_default && "(Utama)"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">
                    <User size={14} style={{ marginRight: "4px" }} />
                    Nama Penerima *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={formData.recipient_name}
                    onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">
                    <Phone size={14} style={{ marginRight: "4px" }} />
                    Nomor HP / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    className="form-input"
                    required
                    placeholder="08xxxxxxxxxx"
                    value={formData.recipient_phone}
                    onChange={(e) => setFormData({ ...formData, recipient_phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <label className="form-label" style={{ margin: 0 }}>Alamat Lengkap Pengiriman *</label>
                  <button
                    type="button"
                    className={`btn btn-sm ${gpsState.detected ? "btn-outline-primary" : "btn-secondary"}`}
                    onClick={handleDetectGps}
                    disabled={gpsState.detecting}
                  >
                    <Navigation size={13} />
                    <span>
                      {gpsState.detecting
                        ? "Mendeteksi GPS..."
                        : gpsState.detected
                        ? "Titik GPS Tersimpan"
                        : "Gunakan Lokasi GPS Saya"}
                    </span>
                  </button>
                </div>
                <textarea
                  className="form-input"
                  required
                  rows={3}
                  placeholder="Jl. Mawar No. 45, RT 02 / RW 05, Kelurahan..."
                  value={formData.shipping_address}
                  onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
                />
                {gpsState.info && (
                  <div style={{ fontSize: "0.75rem", color: gpsState.detected ? "var(--color-primary)" : "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
                    {gpsState.info}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Catatan Pengantaran (Opsional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Patokan rumah, pagar warna hitam, titip di satpam, dll."
                  value={formData.delivery_notes}
                  onChange={(e) => setFormData({ ...formData, delivery_notes: e.target.value })}
                />
              </div>

              <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--color-border)" }}>
                <h3 style={{ fontSize: "1.2rem", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <CreditCard size={20} color="var(--color-primary)" />
                  Pilihan Pembayaran
                </h3>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <label 
                    className={`payment-radio-card ${formData.payment_method === "QRIS" ? "active" : ""}`}
                    onClick={() => setFormData({ ...formData, payment_method: "QRIS" })}
                  >
                    <input 
                      type="radio" 
                      name="payment_method" 
                      value="QRIS" 
                      checked={formData.payment_method === "QRIS"} 
                      onChange={() => {}} 
                      style={{ display: "none" }}
                    />
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div className="pay-icon-box"><CreditCard size={17} /></div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.92rem" }}>Midtrans Payment</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>QRIS, GoPay, Virtual Account</div>
                      </div>
                    </div>
                  </label>

                  <label 
                    className={`payment-radio-card ${formData.payment_method === "COD" ? "active" : ""}`}
                    onClick={() => setFormData({ ...formData, payment_method: "COD" })}
                  >
                    <input 
                      type="radio" 
                      name="payment_method" 
                      value="COD" 
                      checked={formData.payment_method === "COD"} 
                      onChange={() => {}} 
                      style={{ display: "none" }}
                    />
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div className="pay-icon-box"><Banknote size={17} /></div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.92rem" }}>Bayar di Tempat (COD)</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Bayar tunai saat kurir tiba</div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* RIGHT COLUMN: STICKY ORDER SUMMARY */}
        <div className="cart-right-col">
          <div className="card cart-summary-card">
            <h3 style={{ fontSize: "1.2rem", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid var(--color-border)" }}>
              Ringkasan Belanja
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-text-muted)" }}>
                <span>Subtotal ({cartItems.reduce((acc, c) => acc + c.quantity, 0)} item)</span>
                <span style={{ fontWeight: 600, color: "var(--color-text-main)" }}>
                  Rp {subtotal.toLocaleString("id-ID")}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-text-muted)", alignItems: "center" }}>
                <span>Ongkos Kirim Kurir</span>
                {isFreeShipping ? (
                  <span className="badge badge-user" style={{ fontWeight: 700 }}>
                    GRATIS ONGKIR
                  </span>
                ) : (
                  <span style={{ fontWeight: 600, color: "var(--color-text-main)" }}>
                    Rp {shippingCost.toLocaleString("id-ID")}
                  </span>
                )}
              </div>

              {isFreeShipping ? (
                <div style={{ fontSize: "0.75rem", color: "var(--color-primary)", background: "var(--color-primary-light)", border: "1px solid var(--color-primary-border)", padding: "7px 10px", borderRadius: "var(--radius-sm)" }}>
                  Bebas biaya pengantaran untuk transaksi di atas Rp {storeSettings.free_shipping_min_order.toLocaleString("id-ID")}.
                </div>
              ) : (
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", background: "var(--color-bg)", border: "1px solid var(--color-border)", padding: "7px 10px", borderRadius: "var(--radius-sm)" }}>
                  Tambah Rp {Math.max(0, storeSettings.free_shipping_min_order - subtotal).toLocaleString("id-ID")} lagi untuk bebas biaya pengantaran.
                </div>
              )}
            </div>

            <div style={{ paddingTop: "14px", borderTop: "2px dashed var(--color-border)", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontWeight: 700, fontSize: "1.02rem" }}>Total Tagihan</span>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.35rem", color: "var(--accent-price)" }}>
                  Rp {totalPayment.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            {step === "cart" ? (
              <button 
                className="btn btn-primary" 
                style={{ width: "100%", padding: "14px", fontSize: "1rem" }}
                onClick={() => setStep("checkout")}
              >
                Lanjut ke Checkout
                <ArrowRight size={18} />
              </button>
            ) : (
              <button 
                type="submit" 
                form="checkout-form"
                className="btn btn-primary" 
                disabled={submittingOrder}
                style={{ width: "100%", padding: "14px", fontSize: "1rem" }}
              >
                {submittingOrder ? (
                  <>
                    <div className="spinner-sm"></div>
                    Memproses Pemesanan...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    Konfirmasi & Buat Pesanan
                  </>
                )}
              </button>
            )}

            {/* Quality & Trust Badges */}
            <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                <ShieldCheck size={16} color="var(--color-primary)" />
                <span>100% Produk Obat Resmi & Terdaftar BPOM</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                <Truck size={16} color="var(--color-primary)" />
                <span>Pengantaran Cepat Kurir Apotek Hadinata</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
