import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  Lock, 
  Mail, 
  User, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Truck, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Pill
} from "lucide-react";

export const AuthPage = ({ onSuccess }) => {
  const { login, register } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    address: "",
    role: "user"
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isLoginMode) {
        await login(formData.email, formData.password);
        if (onSuccess) onSuccess();
      } else {
        await register(formData);
        setSuccess("Pendaftaran berhasil! Mengalihkan ke login...");
        setTimeout(async () => {
          // Auto login after registration
          await login(formData.email, formData.password);
          if (onSuccess) onSuccess();
        }, 1200);
      }
    } catch (err) {
      setError(err.message || "Terjadi kesalahan pada server");
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-click Demo Logins
  const handleQuickLogin = async (email, password) => {
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || "Gagal melakukan demo login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card animate-fade-in">
        {/* Header Icon & Title */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div 
            style={{ 
              width: "48px", 
              height: "48px", 
              borderRadius: "14px", 
              background: "linear-gradient(135deg, #059669, #0d9488)", 
              color: "white", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              margin: "0 auto 12px",
              boxShadow: "0 6px 16px rgba(5, 150, 105, 0.25)"
            }}
          >
            <Pill size={26} />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--color-text-main)" }}>
            Apotek Hadinata
          </h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginTop: "4px" }}>
            {isLoginMode ? "Masuk ke portal layanan apotek digital" : "Daftarkan akun baru Anda"}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button 
            type="button"
            className={`auth-tab-btn ${isLoginMode ? "active" : ""}`}
            onClick={() => { setIsLoginMode(true); setError(""); setSuccess(""); }}
          >
            Masuk
          </button>
          <button 
            type="button"
            className={`auth-tab-btn ${!isLoginMode ? "active" : ""}`}
            onClick={() => { setIsLoginMode(false); setError(""); setSuccess(""); }}
          >
            Daftar Akun Baru
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="alert alert-success">
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          {!isLoginMode && (
            <>
              <div className="form-group">
                <label className="form-label">Nama Lengkap</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    name="name"
                    required
                    className="form-input"
                    placeholder="Contoh: Budi Santoso"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nomor Telepon / WhatsApp</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  className="form-input"
                  placeholder="08123456789"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Peran / Role Akun</label>
                <select
                  name="role"
                  className="form-select"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="user">Pelanggan (Beli Obat Online)</option>
                  <option value="kurir">Kurir Internal (Pengantaran)</option>
                  <option value="admin">Admin / Apoteker</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Alamat Lengkap</label>
                <textarea
                  name="address"
                  rows={2}
                  className="form-textarea"
                  placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Alamat Email</label>
            <input
              type="email"
              name="email"
              required
              className="form-input"
              placeholder="nama@email.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Kata Sandi (Password)</label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              className="form-input"
              placeholder="Minimal 6 karakter"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
            style={{ marginTop: "12px" }}
          >
            {loading ? "Memproses..." : (isLoginMode ? "Masuk ke Akun" : "Daftar Akun Sekarang")}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        {/* 1-Click Quick Demo Login Shortcuts */}
        <div className="demo-login-box">
          <div className="demo-title">⚡ Uji Coba Cepat (Demo 1-Klik)</div>
          <div className="demo-grid">
            <div 
              className="demo-card-btn"
              onClick={() => handleQuickLogin("admin@apotekhadinata.com", "password123")}
              title="Masuk sebagai Owner / Admin Apotek"
            >
              <ShieldCheck size={20} color="#059669" />
              <span className="demo-card-role">Admin</span>
              <span className="demo-card-hint">Owner Apotek</span>
            </div>

            <div 
              className="demo-card-btn"
              onClick={() => handleQuickLogin("budi@gmail.com", "password123")}
              title="Masuk sebagai Pelanggan Pembeli Obat"
            >
              <User size={20} color="#0284c7" />
              <span className="demo-card-role">Pelanggan</span>
              <span className="demo-card-hint">Beli Online</span>
            </div>

            <div 
              className="demo-card-btn"
              onClick={() => handleQuickLogin("kurir@apotekhadinata.com", "password123")}
              title="Masuk sebagai Kurir Pengantar Obat"
            >
              <Truck size={20} color="#d97706" />
              <span className="demo-card-role">Kurir</span>
              <span className="demo-card-hint">Antar Obat</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
