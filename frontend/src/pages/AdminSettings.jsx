import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import {
  SlidersHorizontal,
  Users,
  ScrollText,
  Truck,
  CheckCircle2,
  AlertCircle,
  Save,
  Plus,
  RefreshCw,
  Search,
  Building2,
  Coins,
  ArrowLeft,
} from "lucide-react";

export const AdminSettings = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState("settings"); // 'settings' | 'users' | 'activity' | 'batches'

  // Settings State
  const [settings, setSettings] = useState({});
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState({ type: "", text: "" });

  // Users State
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "kurir",
    address: "",
  });
  const [userSaving, setUserSaving] = useState(false);

  // Activity Logs State
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logFilterAction, setLogFilterAction] = useState("");

  // Delivery Batches State
  const [batches, setBatches] = useState([]);
  const [batchesLoading, setBatchesLoading] = useState(false);

  // Load Settings
  const fetchSettings = async () => {
    try {
      setSettingsLoading(true);
      const res = await api.getAllSettingsAdmin();
      if (Array.isArray(res?.data)) {
        const map = {};
        res.data.forEach((s) => {
          map[s.setting_key] = s.setting_value;
        });
        setSettings(map);
      }
    } catch (err) {
      setSettingsFeedback({ type: "error", text: err.message || "Gagal memuat pengaturan apotek." });
    } finally {
      setSettingsLoading(false);
    }
  };

  // Load Users
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const params = {};
      if (userRoleFilter) params.role = userRoleFilter;
      if (userSearch) params.search = userSearch;
      const res = await api.getAllUsers(params);
      if (res?.data && Array.isArray(res.data)) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error("Gagal memuat staf:", err);
    } finally {
      setUsersLoading(false);
    }
  };

  // Load Activity Logs
  const fetchLogs = async () => {
    try {
      setLogsLoading(true);
      const params = { limit: 50 };
      if (logFilterAction) params.action = logFilterAction;
      const res = await api.getActivityLogs(params);
      if (res?.data && Array.isArray(res.data)) {
        setLogs(res.data);
      }
    } catch (err) {
      console.error("Gagal memuat audit log:", err);
    } finally {
      setLogsLoading(false);
    }
  };

  // Load Delivery Batches
  const fetchBatches = async () => {
    try {
      setBatchesLoading(true);
      const res = await api.getDeliveryBatches();
      if (res?.data && Array.isArray(res.data)) {
        setBatches(res.data);
      }
    } catch (err) {
      console.error("Gagal memuat gelombang kurir:", err);
    } finally {
      setBatchesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "settings") fetchSettings();
    if (activeTab === "users") fetchUsers();
    if (activeTab === "activity") fetchLogs();
    if (activeTab === "batches") fetchBatches();
  }, [activeTab]);

  // Handle Setting Save
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSettingsSaving(true);
      setSettingsFeedback({ type: "", text: "" });

      const keysToSave = [
        "sipa_number",
        "operational_hours",
        "store_phone",
        "store_address",
        "apotek_latitude",
        "apotek_longitude",
        "shipping_cost_default",
        "free_shipping_min_order",
      ];

      const payload = {};
      for (const key of keysToSave) {
        if (settings[key] !== undefined) {
          payload[key] = String(settings[key]);
        }
      }
      await api.updateSettings(payload);

      setSettingsFeedback({
        type: "success",
        text: "Semua konfigurasi operasional gerai berhasil diperbarui.",
      });
      await fetchSettings();
    } catch (err) {
      setSettingsFeedback({
        type: "error",
        text: err.message || "Gagal memperbarui pengaturan gerai.",
      });
    } finally {
      setSettingsSaving(false);
    }
  };

  // Handle Create User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setUserSaving(true);
      await api.createUserByAdmin(newUserForm);
      setShowAddUserModal(false);
      setNewUserForm({
        name: "",
        email: "",
        password: "",
        phone: "",
        role: "kurir",
        address: "",
      });
      await fetchUsers();
      alert("Akun staf/kurir baru berhasil didaftarkan.");
    } catch (err) {
      alert(err.message || "Gagal mendaftarkan staf baru.");
    } finally {
      setUserSaving(false);
    }
  };

  // Handle Role Change
  const handleChangeRole = async (userId, newRole, userName) => {
    if (!window.confirm(`Ubah peran ${userName} menjadi "${newRole}"?`)) return;
    try {
      await api.updateUserRole(userId, newRole);
      await fetchUsers();
    } catch (err) {
      alert(err.message || "Gagal memperbarui peran akun.");
    }
  };

  const formatDateTime = (isoStr) => {
    if (!isoStr) return "-";
    const d = new Date(isoStr);
    return d.toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: "1120px", margin: "0 auto" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          {onBack && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onBack}
              style={{ marginBottom: "8px" }}
            >
              <ArrowLeft size={14} /> Kembali ke Ringkasan
            </button>
          )}
          <h1 style={{ fontSize: "1.55rem" }}>Pengaturan Apotek, Staf & Audit Log</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
            Pusat konfigurasi gerai fisik, manajemen hak akses staf/kurir internal, serta rekam jejak audit transaksi.
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          {activeTab === "settings" && (
            <button className="btn btn-secondary btn-sm" onClick={fetchSettings} disabled={settingsLoading}>
              <RefreshCw size={14} /> Segarkan
            </button>
          )}
          {activeTab === "users" && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddUserModal(true)}>
              <Plus size={14} /> Tambah Staf / Kurir
            </button>
          )}
          {activeTab === "activity" && (
            <button className="btn btn-secondary btn-sm" onClick={fetchLogs} disabled={logsLoading}>
              <RefreshCw size={14} /> Segarkan Log
            </button>
          )}
          {activeTab === "batches" && (
            <button className="btn btn-secondary btn-sm" onClick={fetchBatches} disabled={batchesLoading}>
              <RefreshCw size={14} /> Segarkan Gelombang
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid var(--color-border)",
          paddingBottom: "8px",
          marginBottom: "20px",
          overflowX: "auto",
        }}
      >
        <button
          type="button"
          className={`btn btn-sm ${activeTab === "settings" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("settings")}
        >
          <SlidersHorizontal size={14} /> Pengaturan Gerai
        </button>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === "users" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("users")}
        >
          <Users size={14} /> Kelola Staf & Kurir
        </button>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === "batches" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("batches")}
        >
          <Truck size={14} /> Gelombang Pengantaran
        </button>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === "activity" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("activity")}
        >
          <ScrollText size={14} /> Log Audit Aktivitas
        </button>
      </div>

      {/* TAB 1: SYSTEM SETTINGS */}
      {activeTab === "settings" && (
        <div className="card" style={{ padding: "28px" }}>
          {settingsFeedback.text && (
            <div
              className={`alert alert-${settingsFeedback.type === "error" ? "danger" : "success"}`}
              style={{ marginBottom: "20px" }}
            >
              {settingsFeedback.type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
              <span>{settingsFeedback.text}</span>
            </div>
          )}

          {settingsLoading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div className="spinner" style={{ margin: "0 auto 12px" }}></div>
              <p style={{ color: "var(--color-text-muted)" }}>Memuat parameter apotek...</p>
            </div>
          ) : (
            <form onSubmit={handleSaveSettings}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", marginBottom: "24px" }}>
                <div>
                  <h3 style={{ fontSize: "1.1rem", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Building2 size={18} color="var(--color-primary)" />
                    Legalitas & Kontak Gerai
                  </h3>

                  <div className="form-group">
                    <label className="form-label">Nomor Surat Izin Praktik Apoteker (SIPA) *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={settings.sipa_number || ""}
                      onChange={(e) => setSettings({ ...settings, sipa_number: e.target.value })}
                      placeholder="464/SIPA-120/2026"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Jam Operasional Layanan Gerai & Kurir *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={settings.operational_hours || ""}
                      onChange={(e) => setSettings({ ...settings, operational_hours: e.target.value })}
                      placeholder="07.00 - 22.00 WIB"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nomor Telepon / WhatsApp CS Resmi *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={settings.store_phone || ""}
                      onChange={(e) => setSettings({ ...settings, store_phone: e.target.value })}
                      placeholder="+62 812-7878-5387"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Alamat Fisik Gerai Farmasi *</label>
                    <textarea
                      rows={3}
                      required
                      className="form-textarea"
                      value={settings.store_address || ""}
                      onChange={(e) => setSettings({ ...settings, store_address: e.target.value })}
                      placeholder="Jl. Kaliurang Km 5.5, Sleman, D.I. Yogyakarta"
                    />
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: "1.1rem", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Coins size={18} color="var(--color-primary)" />
                    Tarif Logistik & Geolocation
                  </h3>

                  <div className="form-group">
                    <label className="form-label">Tarif Standar Ongkir Kurir Internal (Rupiah) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={1000}
                      className="form-input"
                      value={settings.shipping_cost_default || "10000"}
                      onChange={(e) => setSettings({ ...settings, shipping_cost_default: e.target.value })}
                    />
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                      Biaya pengantaran flat untuk area cakupan kota Yogyakarta & Sleman.
                    </span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Ambang Belanja Bebas Ongkir (Rupiah) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={10000}
                      className="form-input"
                      value={settings.free_shipping_min_order || "150000"}
                      onChange={(e) => setSettings({ ...settings, free_shipping_min_order: e.target.value })}
                    />
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                      Pesanan mencapai nominal ini otomatis mendapatkan fasilitas gratis ongkir.
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "16px" }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Latitude Gerai *</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        value={settings.apotek_latitude || "-7.7956"}
                        onChange={(e) => setSettings({ ...settings, apotek_latitude: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Longitude Gerai *</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        value={settings.apotek_longitude || "110.3695"}
                        onChange={(e) => setSettings({ ...settings, apotek_longitude: e.target.value })}
                      />
                    </div>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block", marginTop: "6px" }}>
                    Digunakan untuk kalkulasi jarak pengantaran kurir internal apotek via rumus Haversine.
                  </span>
                </div>
              </div>

              <div style={{ paddingTop: "18px", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "flex-end" }}>
                <button type="submit" className="btn btn-primary" disabled={settingsSaving}>
                  <Save size={16} />
                  {settingsSaving ? "Menyimpan Perubahan..." : "Simpan Pengaturan Apotek"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TAB 2: USER & STAFF MANAGEMENT */}
      {activeTab === "users" && (
        <div className="card" style={{ padding: "20px" }}>
          {/* Filter Bar */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "18px", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
              <input
                type="text"
                className="form-input"
                placeholder="Cari nama atau email akun..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
              />
            </div>
            <select
              className="form-input"
              style={{ width: "160px" }}
              value={userRoleFilter}
              onChange={(e) => {
                setUserRoleFilter(e.target.value);
              }}
            >
              <option value="">Semua Peran</option>
              <option value="admin">Admin / Apoteker</option>
              <option value="kurir">Kurir Internal</option>
              <option value="user">Pelanggan</option>
            </select>
            <button className="btn btn-secondary btn-sm" onClick={fetchUsers}>
              <Search size={14} /> Filter
            </button>
          </div>

          {usersLoading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div className="spinner" style={{ margin: "0 auto 12px" }}></div>
              <p style={{ color: "var(--color-text-muted)" }}>Memuat daftar akun...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nama & Email</th>
                    <th>No. Telepon</th>
                    <th>Alamat / Pool</th>
                    <th>Peran</th>
                    <th>Ubah Hak Akses</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>#{u.id}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                        <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>{u.email}</div>
                      </td>
                      <td style={{ fontSize: "0.85rem" }}>{u.phone || "-"}</td>
                      <td style={{ fontSize: "0.82rem", maxWidth: "220px" }}>{u.address || "-"}</td>
                      <td>
                        <span
                          className={`badge ${
                            u.role === "admin"
                              ? "badge-admin"
                              : u.role === "kurir"
                              ? "badge-kurir"
                              : "badge-user"
                          }`}
                        >
                          {u.role === "admin" ? "Admin" : u.role === "kurir" ? "Kurir" : "Pelanggan"}
                        </span>
                      </td>
                      <td>
                        <select
                          className="form-input"
                          style={{ padding: "4px 8px", fontSize: "0.8rem", width: "120px" }}
                          value={u.role}
                          onChange={(e) => handleChangeRole(u.id, e.target.value, u.name)}
                        >
                          <option value="admin">Admin</option>
                          <option value="kurir">Kurir</option>
                          <option value="user">Pelanggan</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COURIER DELIVERY BATCHES */}
      {activeTab === "batches" && (
        <div className="card" style={{ padding: "20px" }}>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "8px" }}>Gelombang Pengantaran Harian Kurir (Shift Logistik)</h3>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginBottom: "16px" }}>
            Sistem membagi tugas antar kurir internal menjadi dua gelombang harian (Shift 1 &lt;14.00 WIB, Shift 2 &gt;=14.00 WIB) untuk efisiensi rute.
          </p>

          {batchesLoading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div className="spinner" style={{ margin: "0 auto 12px" }}></div>
              <p style={{ color: "var(--color-text-muted)" }}>Memuat gelombang kurir...</p>
            </div>
          ) : batches.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px", color: "var(--color-text-muted)" }}>
              Belum ada gelombang pengantaran tercatat.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID Gelombang</th>
                    <th>Tanggal Pengantaran</th>
                    <th>Shift / Gelombang</th>
                    <th>Kapasitas Kloter</th>
                    <th>Jumlah Pengantaran</th>
                    <th>Dibuat Pada</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((b) => (
                    <tr key={b.id}>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>#{b.id}</td>
                      <td>{b.delivery_date}</td>
                      <td>
                        <span className={`badge ${b.batch_number === 1 ? "badge-kurir" : "badge-admin"}`}>
                          {b.batch_number === 1 ? "Shift 1 (Pagi - Siang)" : "Shift 2 (Sore - Malam)"}
                        </span>
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>{b.capacity} pesanan</td>
                      <td style={{ fontWeight: 600 }}>{b.shippings?.length || 0} paket teralokasi</td>
                      <td style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                        {formatDateTime(b.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: AUDIT ACTIVITY LOGS */}
      {activeTab === "activity" && (
        <div className="card" style={{ padding: "20px" }}>
          {/* Filter Bar */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
            <select
              className="form-input"
              style={{ width: "240px" }}
              value={logFilterAction}
              onChange={(e) => {
                setLogFilterAction(e.target.value);
              }}
            >
              <option value="">Semua Jenis Aksi</option>
              <option value="POS_OFFLINE_TRANSACTION">Transaksi POS Offline</option>
              <option value="UPDATE_ORDER_STATUS">Perubahan Status Pesanan</option>
              <option value="CREATE_MEDICINE">Tambah Obat</option>
              <option value="UPDATE_MEDICINE">Ubah Data Obat</option>
              <option value="DELETE_MEDICINE">Hapus Obat</option>
              <option value="ADD_MEDICINE_BATCH">Penerimaan Kloter Obat</option>
              <option value="UPDATE_MEDICINE_BATCH">Koreksi Kloter Obat</option>
              <option value="DELETE_MEDICINE_BATCH">Hapus Kloter Obat</option>
              <option value="UPDATE_SYSTEM_SETTINGS">Pembaruan Pengaturan</option>
              <option value="CREATE_STAFF_ACCOUNT">Pendaftaran Akun Staf</option>
              <option value="UPDATE_USER_ROLE">Perubahan Peran Akun</option>
              <option value="SYSTEM_INITIALIZE">Inisialisasi Sistem</option>
            </select>
            <button className="btn btn-secondary btn-sm" onClick={fetchLogs}>
              <RefreshCw size={14} /> Filter & Segarkan
            </button>
          </div>

          {logsLoading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div className="spinner" style={{ margin: "0 auto 12px" }}></div>
              <p style={{ color: "var(--color-text-muted)" }}>Memuat rekam jejak aktivitas...</p>
            </div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px", color: "var(--color-text-muted)" }}>
              Belum ada log aktivitas tercatat.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Waktu</th>
                    <th>Petugas / Admin</th>
                    <th>Aksi</th>
                    <th>Keterangan Aktivitas</th>
                    <th>Entitas Terkait</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontSize: "0.78rem", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                        {log.admin?.name || `Admin #${log.admin_id || "-"}`}
                      </td>
                      <td>
                        <span className="badge badge-admin" style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)" }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.84rem", maxWidth: "340px" }}>
                        {log.description}
                      </td>
                      <td style={{ fontSize: "0.78rem", fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>
                        {log.entity_type ? `${log.entity_type} #${log.entity_id || ""}` : "-"}
                      </td>
                      <td style={{ fontSize: "0.76rem", fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>
                        {log.ip_address || "127.0.0.1"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: TAMBAH STAF / KURIR BARU */}
      {showAddUserModal && (
        <div className="modal-overlay" onClick={() => setShowAddUserModal(false)}>
          <div className="modal-container" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: "1.05rem" }}>Pendaftaran Staf / Kurir Baru</h3>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Nama staf apotek"
                    value={newUserForm.name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Login *</label>
                  <input
                    type="email"
                    required
                    className="form-input"
                    placeholder="nama@apotekhadinata.com"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password Sementara * (Min. 6 Karakter)</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="form-input"
                    placeholder="password123"
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div className="form-group">
                    <label className="form-label">Nomor Telepon / WA</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="08xxxxxxxxxx"
                      value={newUserForm.phone}
                      onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Peran Akun *</label>
                    <select
                      className="form-input"
                      value={newUserForm.role}
                      onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                    >
                      <option value="kurir">Kurir Internal</option>
                      <option value="admin">Admin / Apoteker</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Alamat / Pool Penugasan</label>
                  <textarea
                    rows={2}
                    className="form-textarea"
                    placeholder="Alamat domisili atau pool logistik..."
                    value={newUserForm.address}
                    onChange={(e) => setNewUserForm({ ...newUserForm, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowAddUserModal(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={userSaving}>
                  {userSaving ? "Mendaftarkan..." : "Daftarkan Staf"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

