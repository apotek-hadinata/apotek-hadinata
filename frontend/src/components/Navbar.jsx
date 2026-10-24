import React from "react";
import { useAuth } from "../context/AuthContext";
import { 
  Pill, 
  ShoppingCart, 
  LogOut, 
  User, 
  Package, 
  Truck, 
  Layers, 
  MessageSquare, 
  Bell, 
  LayoutDashboard,
  ShieldCheck
} from "lucide-react";

export const Navbar = ({ currentTab, onSelectTab, cartCount = 0 }) => {
  const { user, isAuthenticated, role, logout } = useAuth();

  const getRoleBadge = () => {
    switch (role) {
      case "admin":
        return <span className="badge badge-admin"><ShieldCheck size={12} /> Admin Apotek</span>;
      case "kurir":
        return <span className="badge badge-kurir"><Truck size={12} /> Kurir Internal</span>;
      case "user":
        return <span className="badge badge-user"><User size={12} /> Pelanggan</span>;
      default:
        return null;
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand Logo */}
        <div 
          className="brand-logo" 
          style={{ cursor: "pointer" }}
          onClick={() => onSelectTab(role === "admin" ? "admin_dashboard" : role === "kurir" ? "courier_jobs" : "catalog")}
        >
          <div className="brand-icon-wrapper">
            <Pill size={20} />
          </div>
          <div>
            <span>Apotek Hadinata</span>
            <div style={{ fontSize: "0.65rem", fontWeight: 500, color: "var(--color-text-muted)", marginTop: "-3px" }}>
              Layanan Farmasi Digital
            </div>
          </div>
        </div>

        {/* Dynamic Navigation Links (Icon-Only with Tooltips on Hover) */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {isAuthenticated ? (
            <>
              {/* Role: USER (PELANGGAN) */}
              {role === "user" && (
                <div className="nav-actions-group">
                  <div className="nav-item-wrapper">
                    <button 
                      className={`nav-icon-btn ${currentTab === "catalog" ? "active" : ""}`}
                      onClick={() => onSelectTab("catalog")}
                      aria-label="Katalog Obat"
                      title="Katalog Obat"
                    >
                      <Pill size={18} />
                    </button>
                    <div className="nav-tooltip">Katalog Obat</div>
                  </div>

                  <div className="nav-item-wrapper">
                    <button 
                      className={`nav-icon-btn ${currentTab === "cart" ? "active" : ""}`}
                      onClick={() => onSelectTab("cart")}
                      aria-label="Keranjang Belanja"
                      title="Keranjang Belanja"
                    >
                      <ShoppingCart size={18} />
                      {cartCount > 0 && (
                        <span className="nav-cart-badge">
                          {cartCount}
                        </span>
                      )}
                    </button>
                    <div className="nav-tooltip">
                      Keranjang Belanja {cartCount > 0 ? `(${cartCount})` : ""}
                    </div>
                  </div>

                  <div className="nav-item-wrapper">
                    <button 
                      className={`nav-icon-btn ${currentTab === "orders" ? "active" : ""}`}
                      onClick={() => onSelectTab("orders")}
                      aria-label="Pesanan Saya"
                      title="Pesanan Saya"
                    >
                      <Package size={18} />
                    </button>
                    <div className="nav-tooltip">Pesanan Saya</div>
                  </div>

                  <div className="nav-item-wrapper">
                    <button 
                      className={`nav-icon-btn ${currentTab === "chat" ? "active" : ""}`}
                      onClick={() => onSelectTab("chat")}
                      aria-label="Chat Apoteker / CS"
                      title="Chat Apoteker / CS"
                    >
                      <MessageSquare size={18} />
                    </button>
                    <div className="nav-tooltip">Chat Apoteker / CS</div>
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
                      aria-label="Dashboard Utama"
                    >
                      <LayoutDashboard size={18} />
                    </button>
                    <div className="nav-tooltip">Dashboard Utama</div>
                  </div>

                  <div className="nav-item-wrapper">
                    <button 
                      className={`nav-icon-btn ${currentTab === "admin_medicines" ? "active" : ""}`}
                      onClick={() => onSelectTab("admin_medicines")}
                      aria-label="Kelola Obat & Batch FEFO"
                    >
                      <Layers size={18} />
                    </button>
                    <div className="nav-tooltip">Kelola Obat & Batch FEFO</div>
                  </div>

                  <div className="nav-item-wrapper">
                    <button 
                      className={`nav-icon-btn ${currentTab === "admin_orders" ? "active" : ""}`}
                      onClick={() => onSelectTab("admin_orders")}
                      aria-label="Validasi Pesanan Masuk"
                    >
                      <Package size={18} />
                    </button>
                    <div className="nav-tooltip">Validasi Pesanan Masuk</div>
                  </div>

                  <div className="nav-item-wrapper">
                    <button 
                      className={`nav-icon-btn ${currentTab === "admin_chats" ? "active" : ""}`}
                      onClick={() => onSelectTab("admin_chats")}
                      aria-label="Live Chat Pelanggan"
                    >
                      <MessageSquare size={18} />
                    </button>
                    <div className="nav-tooltip">Live Chat Pelanggan</div>
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
                      aria-label="Tugas Siap Antar"
                    >
                      <Truck size={18} />
                    </button>
                    <div className="nav-tooltip">Tugas Siap Antar</div>
                  </div>

                  <div className="nav-item-wrapper">
                    <button 
                      className={`nav-icon-btn ${currentTab === "courier_active" ? "active" : ""}`}
                      onClick={() => onSelectTab("courier_active")}
                      aria-label="Riwayat Pengantaran"
                    >
                      <Package size={18} />
                    </button>
                    <div className="nav-tooltip">Riwayat Pengantaran</div>
                  </div>
                </div>
              )}

              {/* User Profile & Logout with Tooltip */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "6px", borderLeft: "1px solid var(--color-border)", paddingLeft: "12px" }}>
                <div className="nav-item-wrapper">
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "default" }}>
                    {getRoleBadge()}
                    <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--color-text-main)" }}>
                      {user?.name?.split(" ")[0] || "User"}
                    </span>
                  </div>
                  <div className="nav-tooltip">
                    {user?.name} ({role})
                  </div>
                </div>

                <div className="nav-item-wrapper">
                  <button 
                    className="nav-icon-btn" 
                    onClick={logout}
                    aria-label="Keluar dari Akun"
                    style={{ width: "34px", height: "34px" }}
                  >
                    <LogOut size={15} color="#ef4444" />
                  </button>
                  <div className="nav-tooltip tooltip-right">
                    Keluar dari Akun
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="nav-item-wrapper">
              <button 
                className="btn btn-sm btn-primary"
                onClick={() => onSelectTab("auth")}
              >
                <User size={15} /> Masuk / Daftar
              </button>
              <div className="nav-tooltip tooltip-right">
                Masuk ke Akun
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
