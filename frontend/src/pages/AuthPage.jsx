import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export const AuthPage = ({ onSuccess }) => {
  const { login, register } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    address: "",
    role: "user",
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
        setSuccess("Pendaftaran berhasil. Mengalihkan sesi akun...");
        setTimeout(async () => {
          await login(formData.email, formData.password);
          if (onSuccess) onSuccess();
        }, 1000);
      }
    } catch (err) {
      setError(err.message || "Terjadi kesalahan pada server");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (email, password) => {
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || "Gagal masuk dengan akun pengujian");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card animate-fade-in">
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <div className="brand-icon-wrapper" style={{ width: "32px", height: "32px", fontSize: "0.85rem" }}>
              H+
            </div>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.95rem", color: "var(--ink-forest)" }}>
              APOTEK <span style={{ color: "var(--color-primary)" }}>HADINATA</span>
            </span>
          </div>
          <h2 style={{ fontSize: "1.45rem" }}>
            {isLoginMode ? "Masuk Akun Pelanggan & Petugas" : "Daftar Akun Baru"}
          </h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.84rem", marginTop: "4px" }}>
            {isLoginMode
              ? "Masuk untuk memesan obat, melacak kurir, atau konsultasi apoteker."
              : "Lengkapi identitas dan alamat untuk kemudahan pengiriman obat."}
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${isLoginMode ? "active" : ""}`}
            onClick={() => {
              setIsLoginMode(true);
              setError("");
              setSuccess("");
            }}
          >
            Masuk
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${!isLoginMode ? "active" : ""}`}
            onClick={() => {
              setIsLoginMode(false);
              setError("");
              setSuccess("");
            }}
          >
            Daftar Akun
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="alert alert-success">
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLoginMode && (
            <>
              <div className="form-group">
                <label className="form-label">Nama Lengkap</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="form-input"
                  placeholder="Nama lengkap sesuai identitas"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nomor Telepon / WhatsApp</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  className="form-input"
                  placeholder="0812xxxxxxxx"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Peran Akun</label>
                <select
                  name="role"
                  className="form-select"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="user">Pelanggan</option>
                  <option value="kurir">Kurir Internal</option>
                  <option value="admin">Admin / Apoteker</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Alamat Pengiriman</label>
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
              placeholder="nama@domain.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Kata Sandi</label>
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
            style={{ marginTop: "8px" }}
          >
            <span>{loading ? "Memverifikasi..." : isLoginMode ? "Masuk Sekarang" : "Daftar Sekarang"}</span>
            {!loading && <ArrowRight size={15} />}
          </button>
        </form>

        {/* Quick Test Accounts */}
        <div className="demo-login-box">
          <div className="demo-title">Akses Cepat Akun Demo</div>
          <div className="demo-grid">
            <button
              type="button"
              className="demo-card-btn"
              onClick={() => handleQuickLogin("admin@apotekhadinata.com", "password123")}
            >
              <span className="demo-card-role">Admin</span>
              <span className="demo-card-hint">FEFO & Kasir POS</span>
            </button>

            <button
              type="button"
              className="demo-card-btn"
              onClick={() => handleQuickLogin("budi@gmail.com", "password123")}
            >
              <span className="demo-card-role">Pelanggan</span>
              <span className="demo-card-hint">Belanja Obat</span>
            </button>

            <button
              type="button"
              className="demo-card-btn"
              onClick={() => handleQuickLogin("kurir@apotekhadinata.com", "password123")}
            >
              <span className="demo-card-role">Kurir</span>
              <span className="demo-card-hint">Antar Pesanan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
