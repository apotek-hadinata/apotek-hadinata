import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { AuthPage } from "./pages/AuthPage";
import { DashboardAdmin } from "./pages/DashboardAdmin";
import { AdminMedicines } from "./pages/AdminMedicines";
import { AdminOrders } from "./pages/AdminOrders";
import { DashboardUser } from "./pages/DashboardUser";
import { DashboardCourier } from "./pages/DashboardCourier";
import { CartPage } from "./pages/CartPage";
import { UserOrdersPage } from "./pages/UserOrdersPage";
import { UserChatPage, AdminChatConsole } from "./pages/ChatView";
import { AdminSettings } from "./pages/AdminSettings";
import { api } from "./services/api";

function AppContent() {
  const { isAuthenticated, role, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState("catalog");
  const [cartCount, setCartCount] = useState(0);
  // Shared K24Klik-style Header Search State
  const [headerSearch, setHeaderSearch] = useState("");
  const [searchTrigger, setSearchTrigger] = useState(0);

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

  const handleHeaderSearchSubmit = (query) => {
    setHeaderSearch(query);
    setSearchTrigger((n) => n + 1);
    if (!isAuthenticated || role === "user") {
      if (currentTab !== "catalog") {
        setCurrentTab("catalog");
      }
    }
  };

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
        searchValue={headerSearch}
        onSearchChange={setHeaderSearch}
        onSearchSubmit={handleHeaderSearchSubmit}
      />

      <main className="main-content">
        {/* Auth Page View */}
        {currentTab === "auth" && !isAuthenticated && (
          <AuthPage
            onSuccess={() => {
              if (role === "admin") setCurrentTab("admin_dashboard");
              else if (role === "kurir") setCurrentTab("courier_jobs");
              else setCurrentTab("catalog");
            }}
          />
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
              <AdminOrders
                key="online_orders"
                initialMode="online_orders"
                onBack={() => setCurrentTab("admin_dashboard")}
              />
            )}
            {currentTab === "admin_pos" && (
              <AdminOrders
                key="pos_cashier"
                initialMode="pos_cashier"
                onBack={() => setCurrentTab("admin_dashboard")}
              />
            )}
            {currentTab === "admin_chats" && (
              <AdminChatConsole onBack={() => setCurrentTab("admin_dashboard")} />
            )}
            {currentTab === "admin_settings" && (
              <AdminSettings onBack={() => setCurrentTab("admin_dashboard")} />
            )}
          </>
        )}

        {/* COURIER VIEWS */}
        {isAuthenticated && role === "kurir" && (
          <DashboardCourier
            activeNavTab={currentTab}
            onSelectNavTab={setCurrentTab}
          />
        )}

        {/* CUSTOMER / PUBLIC VIEWS */}
        {(!isAuthenticated || role === "user") && currentTab !== "auth" && (
          <>
            {currentTab === "catalog" && (
              <DashboardUser
                onAddToCart={refreshCart}
                onNavigate={setCurrentTab}
                searchQuery={headerSearch}
                onSearchChange={setHeaderSearch}
                searchTrigger={searchTrigger}
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
              <UserChatPage
                onBackToCatalog={() => setCurrentTab("catalog")}
              />
            )}
          </>
        )}
      </main>

      {/* FULL-WIDTH BOTTOM WEBSITE FOOTER (PINNED TO BOTTOM OF VIEWPORT) */}
      {(!isAuthenticated || role === "user") && currentTab !== "auth" && (
        <footer className="site-footer">
          <div className="site-footer-inner">
            <div className="k24-footer-grid">
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "1.15rem", color: "#ffffff", marginBottom: "8px" }}>
                  APOTEK <span style={{ color: "var(--accent-citron)" }}>HADINATA</span>
                </div>
                <p style={{ lineHeight: 1.6, marginBottom: "10px" }}>
                  Platform pembelian obat bebas, vitamin, dan kebutuhan kesehatan resmi dari gerai fisik Apotek Hadinata dengan pengawasan stok FEFO (First Expire First Out).
                </p>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "#ffffff" }}>
                  No. SIPA: 446/SIPA-120/2024
                </div>
              </div>

              <div>
                <h4>Navigasi Cepat</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <button
                    type="button"
                    className="footer-link-btn"
                    onClick={() => {
                      setCurrentTab("catalog");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    Katalog Obat & Vitamin
                  </button>
                  <button
                    type="button"
                    className="footer-link-btn"
                    onClick={() => {
                      setCurrentTab(isAuthenticated ? "chat" : "auth");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    Konsultasi Apoteker Online
                  </button>
                  <button
                    type="button"
                    className="footer-link-btn"
                    onClick={() => {
                      setCurrentTab(isAuthenticated ? "orders" : "auth");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    Lacak Status Pesanan
                  </button>
                  <button
                    type="button"
                    className="footer-link-btn"
                    onClick={() => {
                      setCurrentTab(isAuthenticated ? "cart" : "auth");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    Troli Belanja
                  </button>
                </div>
              </div>

              <div>
                <h4>Layanan Gerai</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span>Pengantaran Kurir Internal Apotek</span>
                  <span>Jaminan Produk Resmi BPOM RI</span>
                  <span>Jam Buka: 07.00 – 22.00 WIB</span>
                  <span>Telp/WA: (+62) 812-7878-5387</span>
                </div>
              </div>

              <div>
                <h4>Metode Pembayaran</h4>
                <div className="k24-pay-pills">
                  <span className="k24-pay-pill">QRIS</span>
                  <span className="k24-pay-pill">GOPAY</span>
                  <span className="k24-pay-pill">VIRTUAL ACCOUNT</span>
                  <span className="k24-pay-pill">COD TUNAI</span>
                </div>
              </div>
            </div>

            <div style={{ paddingTop: "16px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", fontSize: "0.74rem", color: "#8e9a91" }}>
              <span>© 2026 Apotek Hadinata. Seluruh sediaan obat resmi terdaftar BPOM RI.</span>
              <span>Gunakan obat sesuai petunjuk kemasan atau anjuran Apoteker.</span>
            </div>
          </div>
        </footer>
      )}
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
