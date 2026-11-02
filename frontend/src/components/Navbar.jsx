import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import {
  Search,
  ShoppingCart,
  LogOut,
  User,
  Package,
  Truck,
  Layers,
  MessageSquare,
  Bell,
  LayoutDashboard,
  Calculator,
  CheckCheck,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Store,
  KeyRound,
  SlidersHorizontal,
  MapPin,
  Plus,
  Star,
} from "lucide-react";

export const Navbar = ({
  currentTab,
  onSelectTab,
  cartCount = 0,
  searchValue = "",
  onSearchChange,
  onSearchSubmit,
}) => {
  const { user, isAuthenticated, role, logout, updateProfile } = useAuth();

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  // Profile Modal State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileTab, setProfileTab] = useState("biodata"); // 'biodata' | 'password'
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState({ type: "", text: "" });

  // Saved Addresses State for Profile Modal
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({
    label: "Rumah",
    recipient_name: "",
    recipient_phone: "",
    address: "",
    is_default: false,
  });

  const fetchAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const res = await api.getMyAddresses();
      if (res?.data && Array.isArray(res.data)) {
        setAddresses(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingAddresses(false);
    }
  };

  const loadNotifications = async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      return;
    }
    try {
      const res = await api.getNotifications();
      if (res?.data && Array.isArray(res.data)) {
        setNotifications(res.data);
      }
    } catch {
      // silent background fetch
    }
  };

  useEffect(() => {
    loadNotifications();
    if (!isAuthenticated) return;
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, currentTab]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const showMarketplaceSearch = !isAuthenticated || role === "user";

  const handleToggleNotif = () => {
    const next = !isNotifOpen;
    setIsNotifOpen(next);
    if (next) loadNotifications();
  };

  const handleClickNotifItem = async (notif) => {
    if (!notif.is_read) {
      try {
        await api.markNotificationRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
      } catch {
        // ignore
      }
    }

    if (notif.type === "chat") {
      onSelectTab(role === "admin" ? "admin_chats" : "chat");
    } else if (notif.type === "new_order" || notif.type === "order_status") {
      if (role === "admin") onSelectTab("admin_orders");
      else if (role === "kurir") onSelectTab("courier_jobs");
      else onSelectTab("orders");
    } else if (notif.type === "near_expiry" || notif.type === "stock") {
      if (role === "admin") onSelectTab("admin_medicines");
    }
    setIsNotifOpen(false);
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // ignore
    }
  };

  const handleDeleteNotif = async (e, id) => {
    e.stopPropagation();
    try {
      await api.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // ignore
    }
  };

  const handleOpenProfile = () => {
    setProfileTab("biodata");
    setProfileForm({
      name: user?.name || "",
      phone: user?.phone || "",
      address: user?.address || "",
    });
    setPasswordForm({
      current_password: "",
      new_password: "",
      confirm_password: "",
    });
    setNewAddressForm({
      label: "Rumah",
      recipient_name: user?.name || "",
      recipient_phone: user?.phone || "",
      address: "",
      is_default: false,
    });
    setShowAddAddressForm(false);
    setProfileFeedback({ type: "", text: "" });
    setIsProfileOpen(true);
    fetchAddresses();
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      await api.setDefaultAddress(id);
      await fetchAddresses();
      setProfileFeedback({ type: "success", text: "Alamat utama berhasil diperbarui." });
    } catch (err) {
      setProfileFeedback({ type: "error", text: err.message || "Gagal mengubah alamat utama." });
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Hapus alamat ini dari buku alamat?")) return;
    try {
      await api.deleteAddress(id);
      await fetchAddresses();
      setProfileFeedback({ type: "success", text: "Alamat berhasil dihapus." });
    } catch (err) {
      setProfileFeedback({ type: "error", text: err.message || "Gagal menghapus alamat." });
    }
  };

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    try {
      setProfileSaving(true);
      setProfileFeedback({ type: "", text: "" });
      await api.createAddress({
        label: newAddressForm.label || "Rumah",
        recipient_name: newAddressForm.recipient_name || user?.name || "Penerima",
        recipient_phone: newAddressForm.recipient_phone || user?.phone || "08123456789",
        address: newAddressForm.address,
        is_default: Boolean(newAddressForm.is_default),
      });
      setShowAddAddressForm(false);
      setNewAddressForm({
        label: "Rumah",
        recipient_name: user?.name || "",
        recipient_phone: user?.phone || "",
        address: "",
        is_default: false,
      });
      await fetchAddresses();
      setProfileFeedback({ type: "success", text: "Alamat baru berhasil ditambahkan ke buku alamat." });
    } catch (err) {
      setProfileFeedback({ type: "error", text: err.message || "Gagal menyimpan alamat baru." });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setProfileSaving(true);
      setProfileFeedback({ type: "", text: "" });
      await updateProfile(profileForm);
      setProfileFeedback({ type: "success", text: "Profil & alamat utama berhasil diperbarui." });
      setTimeout(() => {
        setIsProfileOpen(false);
      }, 900);
    } catch (err) {
      setProfileFeedback({ type: "error", text: err.message || "Gagal memperbarui profil" });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password.length < 6) {
      setProfileFeedback({ type: "error", text: "Password baru minimal 6 karakter." });
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setProfileFeedback({ type: "error", text: "Konfirmasi password baru tidak cocok." });
      return;
    }

    try {
      setProfileSaving(true);
      setProfileFeedback({ type: "", text: "" });
      const res = await api.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setProfileFeedback({
        type: "success",
        text: res?.message || "Password akun berhasil diperbarui.",
      });
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      setProfileFeedback({ type: "error", text: err.message || "Gagal mengubah password" });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleFormSearch = (e) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit(searchValue);
    }
  };

  const getRoleBadge = () => {
    switch (role) {
      case "admin":
        return <span className="badge badge-admin">Admin</span>;
      case "kurir":
        return <span className="badge badge-kurir">Kurir</span>;
      case "user":
        return <span className="badge badge-user">Pelanggan</span>;
      default:
        return null;
    }
  };

  return (
    <>
      <header className="site-header">
        <nav className="navbar">
          <div className="navbar-inner">
            {/* Brand Logo */}
            <div
              className="brand-logo"
              style={{ cursor: "pointer" }}
              onClick={() =>
                onSelectTab(
                  role === "admin"
                    ? "admin_dashboard"
                    : role === "kurir"
                    ? "courier_jobs"
                    : "catalog"
                )
              }
            >
              <div className="brand-icon-wrapper">
                H+
                <span className="brand-icon-badge">RX</span>
              </div>
              <div>
                <div className="brand-title">
                  APOTEK <span>HADINATA</span>
                </div>
                <div className="brand-subtitle">Beli Obat Online & Konsultasi</div>
              </div>
            </div>

            {/* K24Klik-Style Integrated Header Search Bar (Visible for Guests & Customers) */}
            {showMarketplaceSearch && (
              <form className="header-search-form" onSubmit={handleFormSearch}>
                <input
                  type="text"
                  className="header-search-input"
                  placeholder="Cari obat, vitamin, atau suplemen..."
                  value={searchValue}
                  onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                />
                {searchValue && (
                  <button
                    type="button"
                    className="header-search-clear"
                    aria-label="Bersihkan pencarian"
                    onClick={() => {
                      if (onSearchChange) onSearchChange("");
                      if (onSearchSubmit) onSearchSubmit("");
                    }}
                  >
                    <X size={15} />
                  </button>
                )}
                <button type="submit" className="header-search-btn">
                  <Search size={15} strokeWidth={2.3} />
                  <span>Cari</span>
                </button>
              </form>
            )}

            {/* Right Navigation Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
              {isAuthenticated ? (
                <>
                  {/* Role: USER (PELANGGAN) */}
                  {role === "user" && (
                    <div className="nav-actions-group">
                      <div className="nav-item-wrapper">
                        <button
                          className={`nav-icon-btn ${currentTab === "catalog" ? "active" : ""}`}
                          onClick={() => onSelectTab("catalog")}
                          aria-label="Beranda Katalog"
                        >
                          <Store size={16} strokeWidth={2} />
                          <span className="nav-btn-label">Katalog</span>
                        </button>
                        <div className="nav-tooltip">Katalog Obat</div>
                      </div>

                      <div className="nav-item-wrapper">
                        <button
                          className={`nav-icon-btn ${currentTab === "chat" ? "active" : ""}`}
                          onClick={() => onSelectTab("chat")}
                          aria-label="Chat Apoteker"
                        >
                          <MessageSquare size={16} strokeWidth={2} />
                          <span className="nav-btn-label">Apoteker</span>
                        </button>
                        <div className="nav-tooltip">Konsultasi Apoteker</div>
                      </div>

                      <div className="nav-item-wrapper">
                        <button
                          className={`nav-icon-btn ${currentTab === "orders" ? "active" : ""}`}
                          onClick={() => onSelectTab("orders")}
                          aria-label="Pesanan Saya"
                        >
                          <Package size={16} strokeWidth={2} />
                          <span className="nav-btn-label">Pesanan</span>
                        </button>
                        <div className="nav-tooltip">Riwayat Pesanan</div>
                      </div>

                      <div className="nav-item-wrapper">
                        <button
                          className={`nav-icon-btn ${currentTab === "cart" ? "active" : ""}`}
                          onClick={() => onSelectTab("cart")}
                          aria-label="Keranjang Belanja"
                        >
                          <ShoppingCart size={16} strokeWidth={2} />
                          <span className="nav-btn-label">Troli</span>
                          {cartCount > 0 && <span className="nav-cart-badge">{cartCount}</span>}
                        </button>
                        <div className="nav-tooltip">
                          Keranjang {cartCount > 0 ? `(${cartCount})` : ""}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Role: ADMIN */}
                  {role === "admin" && (
                    <div className="nav-actions-group">
                      <div className="nav-item-wrapper">
                        <button
                          className={`nav-icon-btn ${currentTab === "admin_dashboard" ? "active" : ""}`}
                          onClick={() => onSelectTab("admin_dashboard")}
                          aria-label="Ringkasan Operasional"
                        >
                          <LayoutDashboard size={16} strokeWidth={2} />
                          <span className="nav-btn-label">Ringkasan</span>
                        </button>
                        <div className="nav-tooltip">Ringkasan Operasional</div>
                      </div>

                      <div className="nav-item-wrapper">
                        <button
                          className={`nav-icon-btn ${currentTab === "admin_medicines" ? "active" : ""}`}
                          onClick={() => onSelectTab("admin_medicines")}
                          aria-label="Inventori & Kloter FEFO"
                        >
                          <Layers size={16} strokeWidth={2} />
                          <span className="nav-btn-label">Inventori FEFO</span>
                        </button>
                        <div className="nav-tooltip">Inventori & Kloter FEFO</div>
                      </div>

                      <div className="nav-item-wrapper">
                        <button
                          className={`nav-icon-btn ${currentTab === "admin_orders" ? "active" : ""}`}
                          onClick={() => onSelectTab("admin_orders")}
                          aria-label="Validasi Pesanan"
                        >
                          <Package size={16} strokeWidth={2} />
                          <span className="nav-btn-label">Pesanan</span>
                        </button>
                        <div className="nav-tooltip">Validasi Pesanan</div>
                      </div>

                      <div className="nav-item-wrapper">
                        <button
                          className={`nav-icon-btn ${currentTab === "admin_pos" ? "active" : ""}`}
                          onClick={() => onSelectTab("admin_pos")}
                          aria-label="Kasir POS"
                        >
                          <Calculator size={16} strokeWidth={2} />
                          <span className="nav-btn-label">Kasir POS</span>
                        </button>
                        <div className="nav-tooltip">Kasir POS Gerai</div>
                      </div>

                      <div className="nav-item-wrapper">
                        <button
                          className={`nav-icon-btn ${currentTab === "admin_chats" ? "active" : ""}`}
                          onClick={() => onSelectTab("admin_chats")}
                          aria-label="Konsol Konsultasi"
                        >
                          <MessageSquare size={16} strokeWidth={2} />
                          <span className="nav-btn-label">Live Chat</span>
                        </button>
                        <div className="nav-tooltip">Konsol Konsultasi</div>
                      </div>

                      <div className="nav-item-wrapper">
                        <button
                          className={`nav-icon-btn ${currentTab === "admin_settings" ? "active" : ""}`}
                          onClick={() => onSelectTab("admin_settings")}
                          aria-label="Pengaturan & Staf"
                        >
                          <SlidersHorizontal size={16} strokeWidth={2} />
                          <span className="nav-btn-label">Pengaturan & Staf</span>
                        </button>
                        <div className="nav-tooltip">Pengaturan Apotek, Staf & Log Audit</div>
                      </div>
                    </div>
                  )}

                  {/* Role: KURIR */}
                  {role === "kurir" && (
                    <div className="nav-actions-group">
                      <div className="nav-item-wrapper">
                        <button
                          className={`nav-icon-btn ${currentTab === "courier_jobs" ? "active" : ""}`}
                          onClick={() => onSelectTab("courier_jobs")}
                          aria-label="Antrean Tugas"
                        >
                          <Truck size={16} strokeWidth={2} />
                          <span className="nav-btn-label">Tugas Antar</span>
                        </button>
                        <div className="nav-tooltip">Antrean Tugas Antar</div>
                      </div>

                      <div className="nav-item-wrapper">
                        <button
                          className={`nav-icon-btn ${currentTab === "courier_active" ? "active" : ""}`}
                          onClick={() => onSelectTab("courier_active")}
                          aria-label="Pengantaran Saya"
                        >
                          <Package size={16} strokeWidth={2} />
                          <span className="nav-btn-label">Pengantaran</span>
                        </button>
                        <div className="nav-tooltip">Pengantaran & Riwayat</div>
                      </div>
                    </div>
                  )}

                  {/* Notification Bell */}
                  <div className="nav-item-wrapper" ref={notifRef}>
                    <button
                      className={`nav-icon-btn ${isNotifOpen ? "active" : ""}`}
                      onClick={handleToggleNotif}
                      aria-label="Notifikasi"
                      style={{ padding: "0 10px" }}
                    >
                      <Bell size={16} strokeWidth={2} />
                      {unreadCount > 0 && <span className="nav-cart-badge">{unreadCount}</span>}
                    </button>
                    {!isNotifOpen && (
                      <div className="nav-tooltip">
                        Notifikasi {unreadCount > 0 ? `(${unreadCount})` : ""}
                      </div>
                    )}

                    {isNotifOpen && (
                      <div
                        style={{
                          position: "absolute",
                          top: "calc(100% + 8px)",
                          right: 0,
                          width: "340px",
                          maxWidth: "90vw",
                          background: "#ffffff",
                          border: "1px solid var(--color-border-strong)",
                          borderRadius: "var(--radius-lg)",
                          boxShadow: "var(--shadow-lg)",
                          zIndex: 1200,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            padding: "10px 14px",
                            borderBottom: "1px solid var(--color-border)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            background: "#f4f6f3",
                          }}
                        >
                          <strong style={{ fontSize: "0.82rem" }}>
                            Notifikasi {unreadCount > 0 ? `(${unreadCount})` : ""}
                          </strong>
                          {unreadCount > 0 && (
                            <button
                              type="button"
                              onClick={handleMarkAllRead}
                              style={{
                                background: "none",
                                border: "none",
                                color: "var(--color-primary)",
                                fontSize: "0.74rem",
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <CheckCheck size={13} /> Tandai dibaca
                            </button>
                          )}
                        </div>

                        <div style={{ maxHeight: "330px", overflowY: "auto" }}>
                          {notifications.length === 0 ? (
                            <div
                              style={{
                                padding: "28px 16px",
                                textAlign: "center",
                                color: "var(--color-text-muted)",
                                fontSize: "0.8rem",
                              }}
                            >
                              Tidak ada notifikasi baru.
                            </div>
                          ) : (
                            notifications.map((n) => (
                              <div
                                key={n.id}
                                onClick={() => handleClickNotifItem(n)}
                                style={{
                                  padding: "11px 14px",
                                  borderBottom: "1px solid var(--color-border)",
                                  background: n.is_read ? "#ffffff" : "var(--color-primary-light)",
                                  cursor: "pointer",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "flex-start",
                                  gap: "8px",
                                }}
                              >
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <div
                                    style={{
                                      fontSize: "0.81rem",
                                      fontWeight: n.is_read ? 600 : 700,
                                      color: "var(--color-text-main)",
                                      marginBottom: "2px",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "6px",
                                    }}
                                  >
                                    {!n.is_read && <span className="status-dot status-dot-active" />}
                                    <span>{n.title}</span>
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "0.75rem",
                                      color: "var(--color-text-muted)",
                                      lineHeight: 1.4,
                                    }}
                                  >
                                    {n.message}
                                  </div>
                                  <div
                                    style={{
                                      fontFamily: "var(--font-mono)",
                                      fontSize: "0.66rem",
                                      color: "var(--color-text-subtle)",
                                      marginTop: "4px",
                                    }}
                                  >
                                    {n.createdAt
                                      ? new Date(n.createdAt).toLocaleString("id-ID", {
                                          day: "2-digit",
                                          month: "short",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : ""}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteNotif(e, n.id)}
                                  title="Hapus"
                                  style={{
                                    background: "none",
                                    border: "none",
                                    color: "var(--color-text-subtle)",
                                    cursor: "pointer",
                                    padding: "2px",
                                  }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* User Account & Sign Out */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginLeft: "4px",
                      borderLeft: "1px solid var(--color-border)",
                      paddingLeft: "10px",
                    }}
                  >
                    <div className="nav-item-wrapper">
                      <button
                        type="button"
                        onClick={handleOpenProfile}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "7px",
                          cursor: "pointer",
                          background: "transparent",
                          border: "none",
                          padding: "4px 6px",
                          borderRadius: "var(--radius-sm)",
                        }}
                      >
                        {getRoleBadge()}
                        <span
                          style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "0.84rem",
                            fontWeight: 700,
                            color: "var(--color-text-main)",
                          }}
                        >
                          {user?.name?.split(" ")[0] || "Akun"}
                        </span>
                      </button>
                      <div className="nav-tooltip">Pengaturan Profil ({user?.name})</div>
                    </div>

                    <div className="nav-item-wrapper">
                      <button
                        className="nav-icon-btn"
                        onClick={logout}
                        aria-label="Keluar"
                        style={{ width: "34px", height: "34px", padding: 0 }}
                      >
                        <LogOut size={15} strokeWidth={2} />
                      </button>
                      <div className="nav-tooltip tooltip-right">Keluar</div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onSelectTab("auth")}
                  >
                    Masuk
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => onSelectTab("auth")}
                  >
                    <User size={14} /> Daftar
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* MODAL: EDIT USER PROFILE & CHANGE PASSWORD */}
      {isProfileOpen && (
        <div className="modal-overlay" onClick={() => setIsProfileOpen(false)}>
          <div className="modal-container" style={{ maxWidth: "540px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: "1.05rem" }}>Pengaturan Profil & Keamanan</h3>
                <span style={{ fontSize: "0.76rem", color: "var(--color-text-muted)" }}>
                  {user?.email} • Peran: {role}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Tab Switcher */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: role === "user" ? "1fr 1.15fr 1fr" : "1fr 1fr",
                gap: "8px",
                padding: "12px 20px 0",
              }}
            >
              <button
                type="button"
                className={`btn btn-sm ${profileTab === "biodata" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => {
                  setProfileTab("biodata");
                  setProfileFeedback({ type: "", text: "" });
                }}
              >
                <User size={14} /> Biodata
              </button>
              {role === "user" && (
                <button
                  type="button"
                  className={`btn btn-sm ${profileTab === "addresses" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => {
                    setProfileTab("addresses");
                    setProfileFeedback({ type: "", text: "" });
                    fetchAddresses();
                  }}
                >
                  <MapPin size={14} /> Buku Alamat
                </button>
              )}
              <button
                type="button"
                className={`btn btn-sm ${profileTab === "password" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => {
                  setProfileTab("password");
                  setProfileFeedback({ type: "", text: "" });
                }}
              >
                <KeyRound size={14} /> Password
              </button>
            </div>

            {profileTab === "addresses" && (
              <div className="modal-body" style={{ maxHeight: "65vh", overflowY: "auto" }}>
                {profileFeedback.text && (
                  <div
                    className={`alert alert-${profileFeedback.type === "error" ? "danger" : "success"}`}
                    style={{ marginBottom: "14px" }}
                  >
                    {profileFeedback.type === "error" ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                    <span>{profileFeedback.text}</span>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-main)" }}>
                    Buku Alamat Pengantaran
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowAddAddressForm(!showAddAddressForm)}
                  >
                    <Plus size={13} />
                    {showAddAddressForm ? "Batal" : "Tambah Alamat"}
                  </button>
                </div>

                {showAddAddressForm && (
                  <form onSubmit={handleCreateAddress} style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", padding: "14px", borderRadius: "var(--radius-sm)", marginBottom: "16px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: "0.75rem" }}>Label (Rumah/Kantor)</label>
                        <input
                          type="text"
                          required
                          className="form-input"
                          placeholder="Contoh: Rumah"
                          value={newAddressForm.label}
                          onChange={(e) => setNewAddressForm({ ...newAddressForm, label: e.target.value })}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: "0.75rem" }}>Nomor HP Penerima</label>
                        <input
                          type="tel"
                          required
                          className="form-input"
                          placeholder="08xxxxxxxxxx"
                          value={newAddressForm.recipient_phone}
                          onChange={(e) => setNewAddressForm({ ...newAddressForm, recipient_phone: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: "10px" }}>
                      <label className="form-label" style={{ fontSize: "0.75rem" }}>Nama Penerima</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="Nama lengkap penerima"
                        value={newAddressForm.recipient_name}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, recipient_name: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: "10px" }}>
                      <label className="form-label" style={{ fontSize: "0.75rem" }}>Alamat Lengkap</label>
                      <textarea
                        rows={2}
                        required
                        className="form-textarea"
                        placeholder="Nama jalan, nomor rumah, RT/RW, patokan..."
                        value={newAddressForm.address}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, address: e.target.value })}
                      />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <label style={{ fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={newAddressForm.is_default}
                          onChange={(e) => setNewAddressForm({ ...newAddressForm, is_default: e.target.checked })}
                        />
                        Jadikan alamat utama
                      </label>
                      <button type="submit" className="btn btn-primary btn-sm" disabled={profileSaving}>
                        {profileSaving ? "Menyimpan..." : "Simpan Alamat"}
                      </button>
                    </div>
                  </form>
                )}

                {loadingAddresses ? (
                  <div style={{ textAlign: "center", padding: "20px" }}>
                    <div className="spinner-sm" style={{ margin: "0 auto 8px" }}></div>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Memuat alamat...</span>
                  </div>
                ) : addresses.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "24px", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                    Belum ada alamat tersimpan di buku alamat.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        style={{
                          border: addr.is_default ? "1.5px solid var(--color-primary)" : "1px solid var(--color-border)",
                          borderRadius: "var(--radius-sm)",
                          padding: "12px",
                          background: addr.is_default ? "var(--color-primary-light)" : "var(--color-surface)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{addr.label}</span>
                            {addr.is_default && (
                              <span className="badge badge-user" style={{ fontSize: "0.68rem" }}>
                                Utama
                              </span>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: "6px" }}>
                            {!addr.is_default && (
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                style={{ padding: "2px 8px", fontSize: "0.72rem" }}
                                onClick={() => handleSetDefaultAddress(addr.id)}
                              >
                                <Star size={11} /> Jadikan Utama
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn-icon-danger"
                              onClick={() => handleDeleteAddress(addr.id)}
                              title="Hapus alamat"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--color-text-main)" }}>
                          {addr.recipient_name} ({addr.recipient_phone})
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "4px" }}>
                          {addr.address}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="modal-footer" style={{ marginTop: "14px", padding: "10px 0 0" }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}

            {profileTab === "biodata" ? (
              <form onSubmit={handleSaveProfile}>
                <div className="modal-body">
                  {profileFeedback.text && (
                    <div
                      className={`alert alert-${profileFeedback.type === "error" ? "danger" : "success"}`}
                      style={{ marginBottom: "14px" }}
                    >
                      {profileFeedback.type === "error" ? (
                        <AlertCircle size={16} />
                      ) : (
                        <CheckCircle2 size={16} />
                      )}
                      <span>{profileFeedback.text}</span>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nomor Telepon / WhatsApp</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="08xxxxxxxxxx"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Alamat Pengiriman Utama</label>
                    <textarea
                      rows={3}
                      className="form-textarea"
                      placeholder="Alamat lengkap rumah atau kantor (otomatis terisi saat checkout)"
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    Tutup
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={profileSaving}>
                    {profileSaving ? "Menyimpan..." : "Simpan Biodata"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleChangePassword}>
                <div className="modal-body">
                  {profileFeedback.text && (
                    <div
                      className={`alert alert-${profileFeedback.type === "error" ? "danger" : "success"}`}
                      style={{ marginBottom: "14px" }}
                    >
                      {profileFeedback.type === "error" ? (
                        <AlertCircle size={16} />
                      ) : (
                        <CheckCircle2 size={16} />
                      )}
                      <span>{profileFeedback.text}</span>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Password Saat Ini *</label>
                    <input
                      type="password"
                      required
                      className="form-input"
                      placeholder="Masukkan password aktif Anda"
                      value={passwordForm.current_password}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, current_password: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Password Baru * (Min. 6 Karakter)</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      className="form-input"
                      placeholder="Masukkan password baru"
                      value={passwordForm.new_password}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, new_password: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Konfirmasi Password Baru *</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      className="form-input"
                      placeholder="Ketik ulang password baru"
                      value={passwordForm.confirm_password}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, confirm_password: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    Tutup
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={profileSaving}>
                    {profileSaving ? "Memperbarui..." : "Perbarui Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
