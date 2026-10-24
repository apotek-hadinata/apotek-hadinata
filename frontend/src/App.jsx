import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { AuthPage } from "./pages/AuthPage";
import { DashboardAdmin } from "./pages/DashboardAdmin";
import { AdminMedicines } from "./pages/AdminMedicines";
import { DashboardUser } from "./pages/DashboardUser";
import { DashboardCourier } from "./pages/DashboardCourier";
import { CartPage } from "./pages/CartPage";
import { UserOrdersPage } from "./pages/UserOrdersPage";
import { api } from "./services/api";

function AppContent() {
  const { isAuthenticated, role, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState("catalog");
  const [cartCount, setCartCount] = useState(0);

  // Sync cart count for customers
  const refreshCart = async () => {
    if (isAuthenticated && role === "user") {
      try {
        const res = await api.getCart();
        if (res?.data && Array.isArray(res.data)) {
          const totalQty = res.data.reduce((sum, item) => sum + (item.quantity || 1), 0);
          setCartCount(totalQty);
        } else {
          setCartCount(0);
        }
      } catch {
        setCartCount(0);
      }
    } else {
      setCartCount(0);
    }
  };

  useEffect(() => {
    refreshCart();
  }, [isAuthenticated, role]);

  // Adjust default view upon login based on role
  useEffect(() => {
    if (isAuthenticated) {
      if (role === "admin") {
        setCurrentTab("admin_dashboard");
      } else if (role === "kurir") {
        setCurrentTab("courier_jobs");
      } else {
        setCurrentTab("catalog");
      }
    }
  }, [isAuthenticated, role]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--color-primary)", fontWeight: 700 }}>Memuat Apotek Hadinata...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar 
        currentTab={currentTab} 
        onSelectTab={setCurrentTab} 
        cartCount={cartCount} 
      />

      <main className="main-content">
        {/* Auth Page View */}
        {currentTab === "auth" && !isAuthenticated && (
          <AuthPage onSuccess={() => {
            if (role === "admin") setCurrentTab("admin_dashboard");
            else if (role === "kurir") setCurrentTab("courier_jobs");
            else setCurrentTab("catalog");
          }} />
        )}

        {/* ADMIN VIEWS */}
        {isAuthenticated && role === "admin" && (
          <>
            {currentTab === "admin_dashboard" && (
              <DashboardAdmin onNavigate={setCurrentTab} />
            )}
            {currentTab === "admin_medicines" && (
              <AdminMedicines onBack={() => setCurrentTab("admin_dashboard")} />
            )}
            {currentTab === "admin_orders" && (
              <div className="card animate-fade-in">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h2>📑 Modul ACC & Persetujuan Pesanan</h2>
                  <button className="btn btn-secondary btn-sm" onClick={() => setCurrentTab("admin_dashboard")}>Kembali</button>
                </div>
                <p style={{ color: "var(--color-text-muted)" }}>
                  Modul ini siap dikembangkan pada <strong>Sprint 4</strong> (ACC Pesanan Masuk & Penugasan Kurir).
                </p>
              </div>
            )}
            {currentTab === "admin_chats" && (
              <div className="card animate-fade-in">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h2>💬 Live Chat Apoteker / CS</h2>
                  <button className="btn btn-secondary btn-sm" onClick={() => setCurrentTab("admin_dashboard")}>Kembali</button>
                </div>
                <p style={{ color: "var(--color-text-muted)" }}>
                  Modul ini siap dikembangkan pada <strong>Sprint 6</strong> (Tanya Jawab Obat & Konsultasi Pelanggan).
                </p>
              </div>
            )}
          </>
        )}

        {/* COURIER VIEWS */}
        {isAuthenticated && role === "kurir" && (
          <DashboardCourier />
        )}

        {/* CUSTOMER / PUBLIC VIEWS */}
        {(!isAuthenticated || role === "user") && currentTab !== "auth" && (
          <>
            {currentTab === "catalog" && (
              <DashboardUser 
                onAddToCart={refreshCart} 
                onNavigate={setCurrentTab} 
              />
            )}
            {currentTab === "cart" && (
              <CartPage 
                onBackToCatalog={() => setCurrentTab("catalog")}
                onCartUpdated={refreshCart}
                onNavigateToOrders={() => setCurrentTab("orders")}
              />
            )}
            {currentTab === "orders" && (
              <UserOrdersPage 
                onBackToCatalog={() => setCurrentTab("catalog")}
              />
            )}
            {currentTab === "chat" && (
              <div className="card animate-fade-in">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h2>💬 Konsultasi Live Chat</h2>
                  <button className="btn btn-secondary btn-sm" onClick={() => setCurrentTab("catalog")}>Katalog</button>
                </div>
                <p style={{ color: "var(--color-text-muted)" }}>
                  Layanan konsultasi chat apoteker akan diaktifkan pada <strong>Sprint 6</strong>.
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
