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

        {/* Dynamic Navigation Links */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {isAuthenticated ? (
            <>
              {/* Role: USER (PELANGGAN) */}
              {role === "user" && (
                <>
                  <button 
                    className={`btn btn-sm ${currentTab === "catalog" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => onSelectTab("catalog")}
                  >
                    <Pill size={15} /> Katalog Obat
                  </button>
                  <button 
                    className={`btn btn-sm ${currentTab === "cart" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => onSelectTab("cart")}
                    style={{ position: "relative" }}
                  >
                    <ShoppingCart size={15} /> Keranjang
                    {cartCount > 0 && (
                      <span style={{
                        position: "absolute",
                        top: "-5px",
                        right: "-5px",
                        background: "var(--color-danger)",
                        color: "white",
                        fontSize: "0.65rem",
                        padding: "2px 6px",
                        borderRadius: "999px",
                        fontWeight: "700"
                      }}>
                        {cartCount}
                      </span>
                    )}
                  </button>
                  <button 
                    className={`btn btn-sm ${currentTab === "orders" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => onSelectTab("orders")}
                  >
                    <Package size={15} /> Pesanan Saya
                  </button>
                  <button 
                    className={`btn btn-sm ${currentTab === "chat" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => onSelectTab("chat")}
                  >
                    <MessageSquare size={15} /> Chat CS
                  </button>
                </>
              )}

              {/* Role: ADMIN */}
              {role === "admin" && (
                <>
                  <button 
                    className={`btn btn-sm ${currentTab === "admin_dashboard" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => onSelectTab("admin_dashboard")}
                  >
                    <LayoutDashboard size={15} /> Dashboard
                  </button>
                  <button 
                    className={`btn btn-sm ${currentTab === "admin_medicines" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => onSelectTab("admin_medicines")}
                  >
                    <Layers size={15} /> Obat & Batch FEFO
                  </button>
                  <button 
                    className={`btn btn-sm ${currentTab === "admin_orders" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => onSelectTab("admin_orders")}
                  >
                    <Package size={15} /> ACC Pesanan
                  </button>
                  <button 
                    className={`btn btn-sm ${currentTab === "admin_chats" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => onSelectTab("admin_chats")}
                  >
                    <MessageSquare size={15} /> Chat Pelanggan
                  </button>
                </>
              )}

              {/* Role: KURIR */}
              {role === "kurir" && (
                <>
                  <button 
                    className={`btn btn-sm ${currentTab === "courier_jobs" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => onSelectTab("courier_jobs")}
                  >
                    <Truck size={15} /> Tugas Siap Antar
                  </button>
                  <button 
                    className={`btn btn-sm ${currentTab === "courier_active" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => onSelectTab("courier_active")}
                  >
                    <Package size={15} /> Riwayat Pengantaran
                  </button>
                </>
              )}

              {/* User Profile Pill & Logout */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "8px", borderLeft: "1px solid var(--color-border)", paddingLeft: "12px" }}>
                {getRoleBadge()}
                <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--color-text-main)" }}>
                  {user?.name?.split(" ")[0] || "User"}
                </span>
                <button 
                  className="btn btn-sm btn-secondary" 
                  onClick={logout}
                  title="Keluar dari akun"
                  style={{ padding: "6px 8px" }}
                >
                  <LogOut size={14} color="#ef4444" />
                </button>
              </div>
            </>
          ) : (
            <button 
              className="btn btn-sm btn-primary"
              onClick={() => onSelectTab("auth")}
            >
              <User size={15} /> Masuk / Daftar
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
