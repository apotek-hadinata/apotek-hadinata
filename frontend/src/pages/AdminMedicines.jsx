import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { 
  Layers, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Pill, 
  X, 
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  Tag,
  Boxes
} from "lucide-react";

export const AdminMedicines = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState("medicines"); // 'medicines' | 'categories' | 'fefo_audit'
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [notification, setNotification] = useState({ type: "", message: "" });

  // Modals state
  const [isMedModalOpen, setIsMedModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [medForm, setMedForm] = useState({
    category_id: "",
    name: "",
    price: "",
    SKU_code: "",
    status: "in stock",
    desc: "",
    image: ""
  });

  // Batch Modal state
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [selectedMedForBatch, setSelectedMedForBatch] = useState(null);
  const [batchForm, setBatchForm] = useState({
    batch_number: "",
    expiry_date: "",
    stock: ""
  });

  // Category Modal state
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catForm, setCatForm] = useState({ name: "", desc: "" });

  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: "", message: "" }), 3500);
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      const [medRes, catRes] = await Promise.all([
        api.getMedicines(),
        api.getCategories()
      ]);
      if (medRes?.data) setMedicines(medRes.data);
      if (catRes?.data) setCategories(catRes.data);
    } catch (err) {
      notify("error", err.message || "Gagal memuat data master");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Filtered medicines
  const filteredMedicines = medicines.filter((m) => {
    const matchesSearch = m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.SKU_code?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter ? String(m.category_id) === String(categoryFilter) : true;
    return matchesSearch && matchesCat;
  });

  // Calculate days until expiration
  const getExpiryStatus = (dateStr) => {
    const today = new Date();
    const exp = new Date(dateStr);
    const diffTime = exp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return { label: "Sudah Kadaluwarsa", cls: "expiry-urgent", days: diffDays };
    } else if (diffDays <= 30) {
      return { label: `${diffDays} hari lagi (Kritis)`, cls: "expiry-urgent", days: diffDays };
    } else if (diffDays <= 90) {
      return { label: `${diffDays} hari lagi`, cls: "expiry-warning", days: diffDays };
    } else {
      return { label: `${diffDays} hari lagi`, cls: "expiry-safe", days: diffDays };
    }
  };

  // --- MEDICINE CRUD ---
  const handleOpenAddMed = () => {
    setEditingMedicine(null);
    setMedForm({
      category_id: categories[0]?.id || "",
      name: "",
      price: "",
      SKU_code: `SKU-${Date.now().toString().slice(-6)}`,
      status: "in stock",
      desc: "",
      image: ""
    });
    setIsMedModalOpen(true);
  };

  const handleOpenEditMed = (med) => {
    setEditingMedicine(med);
    setMedForm({
      category_id: med.category_id,
      name: med.name,
      price: med.price,
      SKU_code: med.SKU_code,
      status: med.status,
      desc: med.desc || "",
      image: med.image || ""
    });
    setIsMedModalOpen(true);
  };

  const handleSaveMedicine = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        category_id: parseInt(medForm.category_id),
        name: medForm.name,
        price: parseInt(medForm.price),
        SKU_code: medForm.SKU_code,
        status: medForm.status,
        desc: medForm.desc,
        image: medForm.image
      };

      if (editingMedicine) {
        await api.updateMedicine(editingMedicine.id, payload);
        notify("success", `Data obat "${medForm.name}" berhasil diperbarui!`);
      } else {
        await api.createMedicine(payload);
        notify("success", `Obat baru "${medForm.name}" berhasil ditambahkan!`);
      }

      setIsMedModalOpen(false);
      await loadAll();
    } catch (err) {
      alert(err.message || "Gagal menyimpan obat");
    }
  };

  const handleDeleteMedicine = async (med) => {
    if (window.confirm(`Yakin ingin menghapus obat "${med.name}" beserta seluruh kloter batch-nya?`)) {
      try {
        await api.deleteMedicine(med.id);
        notify("success", `Obat "${med.name}" berhasil dihapus dari sistem.`);
        await loadAll();
      } catch (err) {
        alert(err.message || "Gagal menghapus obat");
      }
    }
  };

  // --- BATCH (FEFO) CRUD ---
  const handleOpenBatchManager = (med) => {
    setSelectedMedForBatch(med);
    setBatchForm({
      batch_number: `BCH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      expiry_date: "",
      stock: 20
    });
    setIsBatchModalOpen(true);
  };

  const handleAddBatch = async (e) => {
    e.preventDefault();
    try {
      await api.addMedicineBatch({
        medicine_id: selectedMedForBatch.id,
        batch_number: batchForm.batch_number,
        expiry_date: batchForm.expiry_date,
        stock: parseInt(batchForm.stock)
      });

      notify("success", `Kloter batch ${batchForm.batch_number} berhasil ditambahkan!`);
      // Reload medicine detail to refresh batches
      const updatedMed = await api.getMedicineById(selectedMedForBatch.id);
      setSelectedMedForBatch(updatedMed.data);
      setBatchForm({
        batch_number: `BCH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        expiry_date: "",
        stock: 20
      });
      await loadAll();
    } catch (err) {
      alert(err.message || "Gagal menambahkan kloter batch");
    }
  };

  const handleDeleteBatch = async (batchId) => {
    if (window.confirm("Hapus kloter stok batch ini?")) {
      try {
        await api.deleteMedicineBatch(batchId);
        notify("success", "Kloter batch berhasil dihapus.");
        const updatedMed = await api.getMedicineById(selectedMedForBatch.id);
        setSelectedMedForBatch(updatedMed.data);
        await loadAll();
      } catch (err) {
        alert(err.message || "Gagal menghapus batch");
      }
    }
  };

  // --- CATEGORY CRUD ---
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCatForm({ name: "", desc: "" });
    setIsCatModalOpen(true);
  };

  const handleOpenEditCategory = (cat) => {
    setEditingCategory(cat);
    setCatForm({ name: cat.name, desc: cat.desc || "" });
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, catForm);
        notify("success", `Kategori "${catForm.name}" berhasil diperbarui!`);
      } else {
        await api.createCategory(catForm);
        notify("success", `Kategori baru "${catForm.name}" berhasil dibuat!`);
      }
      setIsCatModalOpen(false);
      await loadAll();
    } catch (err) {
      alert(err.message || "Gagal menyimpan kategori");
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (window.confirm(`Hapus kategori "${cat.name}"?`)) {
      try {
        await api.deleteCategory(cat.id);
        notify("success", `Kategori "${cat.name}" dihapus.`);
        await loadAll();
      } catch (err) {
        alert(err.message || "Gagal menghapus kategori");
      }
    }
  };

  // Aggregated all batches for FEFO Audit
  const allBatches = [];
  medicines.forEach((med) => {
    (med.batches || []).forEach((b) => {
      allBatches.push({
        ...b,
        medicineName: med.name,
        SKU: med.SKU_code,
        price: med.price,
        categoryName: med.Category?.name
      });
    });
  });
  // Sort strictly by expiry_date ascending (FEFO)
  allBatches.sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));

  return (
    <div className="animate-fade-in">
      {/* Top Breadcrumb & Title */}
      <div className="dashboard-header">
        <div>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={onBack}
            style={{ marginBottom: "8px" }}
          >
            <ArrowLeft size={14} /> Kembali ke Dashboard
          </button>
          <h1>Manajemen Master Obat & Kloter Batch FEFO</h1>
          <p style={{ color: "var(--color-text-muted)" }}>
            Kelola katalog obat non-resep dan prioritaskan pemotongan stok kloter berdasarkan tanggal kadaluwarsa terdekat.
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          {activeTab === "medicines" && (
            <button className="btn btn-primary" onClick={handleOpenAddMed}>
              <Plus size={16} /> Tambah Obat Baru
            </button>
          )}
          {activeTab === "categories" && (
            <button className="btn btn-primary" onClick={handleOpenAddCategory}>
              <Plus size={16} /> Tambah Kategori
            </button>
          )}
        </div>
      </div>

      {notification.message && (
        <div className={`alert alert-${notification.type === "error" ? "error" : "success"} animate-fade-in`}>
          {notification.type === "error" ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="auth-tabs" style={{ maxWidth: "560px", marginBottom: "20px" }}>
        <button 
          className={`auth-tab-btn ${activeTab === "medicines" ? "active" : ""}`}
          onClick={() => setActiveTab("medicines")}
        >
          <Layers size={15} style={{ display: "inline", verticalAlign: "middle", marginRight: "6px" }} />
          Katalog Obat ({medicines.length})
        </button>
        <button 
          className={`auth-tab-btn ${activeTab === "categories" ? "active" : ""}`}
          onClick={() => setActiveTab("categories")}
        >
          <Tag size={15} style={{ display: "inline", verticalAlign: "middle", marginRight: "6px" }} />
          Kategori ({categories.length})
        </button>
        <button 
          className={`auth-tab-btn ${activeTab === "fefo_audit" ? "active" : ""}`}
          onClick={() => setActiveTab("fefo_audit")}
        >
          <ShieldAlert size={15} style={{ display: "inline", verticalAlign: "middle", marginRight: "6px" }} />
          Audit Kedaluwarsa FEFO ({allBatches.length})
        </button>
      </div>

      {/* TAB 1: MEDICINES TABLE */}
      {activeTab === "medicines" && (
        <div>
          {/* Filter Bar */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "240px", position: "relative" }}>
              <input
                type="text"
                className="form-input"
                placeholder="Cari berdasarkan nama obat atau kode SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="form-select"
              style={{ width: "auto", minWidth: "180px" }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Obat</th>
                  <th>Kategori</th>
                  <th>Kode SKU</th>
                  <th>Harga Satuan</th>
                  <th>Stok Total Online</th>
                  <th>Kloter FEFO Terdekat</th>
                  <th style={{ textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredMedicines.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "36px", color: "var(--color-text-muted)" }}>
                      {loading ? "Memuat katalog obat..." : "Belum ada obat yang terdaftar. Klik '+ Tambah Obat Baru'."}
                    </td>
                  </tr>
                ) : (
                  filteredMedicines.map((med) => {
                    const sortedBatches = [...(med.batches || [])].sort(
                      (a, b) => new Date(a.expiry_date) - new Date(b.expiry_date)
                    );
                    const totalStock = sortedBatches.reduce((s, b) => s + (b.stock || 0), 0);
                    const nearestBatch = sortedBatches[0];
                    const expStatus = nearestBatch ? getExpiryStatus(nearestBatch.expiry_date) : null;

                    return (
                      <tr key={med.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ 
                              width: "36px", 
                              height: "36px", 
                              borderRadius: "var(--radius-sm)", 
                              background: "var(--color-bg)", 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "center",
                              border: "1px solid var(--color-border)"
                            }}>
                              <Pill size={18} color="var(--color-primary)" />
                            </div>
                            <div>
                              <strong>{med.name}</strong>
                              <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                                {med.status === "in stock" ? "🟢 Aktif" : "🔴 Nonaktif"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-user">
                            {med.Category?.name || "Tanpa Kategori"}
                          </span>
                        </td>
                        <td><code>{med.SKU_code}</code></td>
                        <td><strong>Rp {Number(med.price).toLocaleString("id-ID")}</strong></td>
                        <td>
                          <span style={{ 
                            fontWeight: 800, 
                            color: totalStock > 0 ? "var(--color-primary)" : "var(--color-danger)" 
                          }}>
                            {totalStock} unit
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginLeft: "4px" }}>
                            ({med.batches?.length || 0} kloter)
                          </span>
                        </td>
                        <td>
                          {nearestBatch ? (
                            <div>
                              <span className={`expiry-tag ${expStatus.cls}`}>
                                {expStatus.label}
                              </span>
                              <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                                {nearestBatch.batch_number} ({new Date(nearestBatch.expiry_date).toLocaleDateString("id-ID")})
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: "0.75rem", color: "var(--color-danger)" }}>
                              ⚠️ Belum ada batch
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "6px" }}>
                            <button 
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleOpenBatchManager(med)}
                              title="Kelola Kloter Batch & Kadaluwarsa"
                            >
                              <Boxes size={14} /> Batch ({med.batches?.length || 0})
                            </button>
                            <button 
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleOpenEditMed(med)}
                              title="Edit Master Obat"
                            >
                              <Edit size={14} />
                            </button>
                            <button 
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleDeleteMedicine(med)}
                              title="Hapus Obat"
                            >
                              <Trash2 size={14} color="#ef4444" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CATEGORIES MANAGEMENT */}
      {activeTab === "categories" && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama Kategori Obat</th>
                <th>Deskripsi</th>
                <th style={{ textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "36px", color: "var(--color-text-muted)" }}>
                    Belum ada kategori obat. Silakan klik '+ Tambah Kategori'.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id}>
                    <td><code>#{cat.id}</code></td>
                    <td>
                      <strong>{cat.name}</strong>
                    </td>
                    <td style={{ color: "var(--color-text-muted)" }}>
                      {cat.desc || "-"}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleOpenEditCategory(cat)}
                        >
                          <Edit size={14} /> Edit
                        </button>
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleDeleteCategory(cat)}
                        >
                          <Trash2 size={14} color="#ef4444" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: FEFO AUDIT MONITORING */}
      {activeTab === "fefo_audit" && (
        <div>
          <div className="card" style={{ marginBottom: "16px", background: "#f8fafc" }}>
            <h3 style={{ fontSize: "1rem", color: "var(--color-text-main)", marginBottom: "4px" }}>
              Prinsip Audit First Expire First Out (FEFO)
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
              Daftar seluruh kloter obat di bawah ini telah diurutkan dari <strong>tanggal kedaluwarsa terdekat (paling atas)</strong>. Sistem transaksi online otomatis memotong kloter teratas terlebih dahulu.
            </p>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Prioritas FEFO</th>
                  <th>Nama Obat</th>
                  <th>Nomor Batch</th>
                  <th>Tanggal Kadaluwarsa</th>
                  <th>Sisa Stok Batch</th>
                  <th>Status Risiko</th>
                </tr>
              </thead>
              <tbody>
                {allBatches.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "36px", color: "var(--color-text-muted)" }}>
                      Belum ada kloter batch obat yang diinput ke sistem.
                    </td>
                  </tr>
                ) : (
                  allBatches.map((b, idx) => {
                    const st = getExpiryStatus(b.expiry_date);
                    return (
                      <tr key={b.id}>
                        <td>
                          <span style={{ 
                            fontSize: "0.75rem", 
                            fontWeight: 800, 
                            padding: "3px 8px", 
                            borderRadius: "999px",
                            background: idx === 0 ? "#ecfdf5" : "var(--color-bg)",
                            color: idx === 0 ? "var(--color-primary)" : "var(--color-text-muted)",
                            border: "1px solid var(--color-border)"
                          }}>
                            {idx === 0 ? "⭐ Antrean #1" : `#${idx + 1}`}
                          </span>
                        </td>
                        <td>
                          <strong>{b.medicineName}</strong>
                          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                            SKU: {b.SKU}
                          </div>
                        </td>
                        <td><code>{b.batch_number}</code></td>
                        <td>{new Date(b.expiry_date).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}</td>
                        <td>
                          <strong>{b.stock} unit</strong>
                        </td>
                        <td>
                          <span className={`expiry-tag ${st.cls}`}>
                            {st.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT MEDICINE */}
      {isMedModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 style={{ fontSize: "1.1rem" }}>
                {editingMedicine ? `Edit Obat: ${editingMedicine.name}` : "Tambah Obat Non-Resep Baru"}
              </h3>
              <button 
                onClick={() => setIsMedModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveMedicine}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Kategori Obat</label>
                  <select
                    className="form-select"
                    required
                    value={medForm.category_id}
                    onChange={(e) => setMedForm({ ...medForm, category_id: e.target.value })}
                  >
                    <option value="">-- Pilih Kategori --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Nama Obat & Dosis</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Contoh: Paracetamol 500mg Tablet"
                    value={medForm.name}
                    onChange={(e) => setMedForm({ ...medForm, name: e.target.value })}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-group">
                    <label className="form-label">Harga Satuan (Rp)</label>
                    <input
                      type="number"
                      min={100}
                      required
                      className="form-input"
                      placeholder="Contoh: 15000"
                      value={medForm.price}
                      onChange={(e) => setMedForm({ ...medForm, price: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Kode SKU / Barcode</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="Contoh: MED-PCT-500"
                      value={medForm.SKU_code}
                      onChange={(e) => setMedForm({ ...medForm, SKU_code: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Status Ketersediaan</label>
                  <select
                    className="form-select"
                    value={medForm.status}
                    onChange={(e) => setMedForm({ ...medForm, status: e.target.value })}
                  >
                    <option value="in stock">In Stock (Tersedia untuk Dijual)</option>
                    <option value="out of stock">Out of Stock (Nonaktifkan)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Deskripsi & Aturan Pakai</label>
                  <textarea
                    rows={3}
                    className="form-textarea"
                    placeholder="Indikasi, kegunaan, petunjuk konsumsi, dan perhatian..."
                    value={medForm.desc}
                    onChange={(e) => setMedForm({ ...medForm, desc: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setIsMedModalOpen(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingMedicine ? "Simpan Perubahan" : "Simpan Obat Baru"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BATCH (FEFO) MANAGER */}
      {isBatchModalOpen && selectedMedForBatch && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: "700px" }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: "1.1rem" }}>
                  📦 Manajemen Kloter Batch FEFO
                </h3>
                <span style={{ fontSize: "0.85rem", color: "var(--color-primary)", fontWeight: 700 }}>
                  {selectedMedForBatch.name}
                </span>
              </div>
              <button 
                onClick={() => setIsBatchModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Form Tambah Batch Baru */}
              <div className="card" style={{ background: "#f8fafc", padding: "16px", marginBottom: "20px" }}>
                <h4 style={{ fontSize: "0.9rem", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Plus size={16} /> Tambah Kloter Stok Baru
                </h4>
                <form onSubmit={handleAddBatch} style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 1fr auto", gap: "8px", alignItems: "flex-end" }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: "0.75rem" }}>Nomor Batch</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="Nomor Kloter"
                      value={batchForm.batch_number}
                      onChange={(e) => setBatchForm({ ...batchForm, batch_number: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: "0.75rem" }}>Tgl Kadaluwarsa</label>
                    <input
                      type="date"
                      required
                      className="form-input"
                      value={batchForm.expiry_date}
                      onChange={(e) => setBatchForm({ ...batchForm, expiry_date: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: "0.75rem" }}>Stok (Unit)</label>
                    <input
                      type="number"
                      min={1}
                      required
                      className="form-input"
                      placeholder="Jml"
                      value={batchForm.stock}
                      onChange={(e) => setBatchForm({ ...batchForm, stock: e.target.value })}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ padding: "10px 14px" }}>
                    + Tambah
                  </button>
                </form>
              </div>

              {/* List Batches Sorted by FEFO */}
              <h4 style={{ fontSize: "0.9rem", marginBottom: "8px" }}>
                Urutan Penjualan FEFO (Kloter Terdekat Dijual Lebih Dulu):
              </h4>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Urutan FEFO</th>
                      <th>Nomor Batch</th>
                      <th>Tgl Kadaluwarsa</th>
                      <th>Sisa Stok</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedMedForBatch.batches || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: "24px", color: "var(--color-text-muted)" }}>
                          Belum ada kloter stok untuk obat ini.
                        </td>
                      </tr>
                    ) : (
                      [...(selectedMedForBatch.batches || [])]
                        .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date))
                        .map((b, idx) => {
                          const st = getExpiryStatus(b.expiry_date);
                          return (
                            <tr key={b.id}>
                              <td>
                                <span style={{ 
                                  fontSize: "0.7rem", 
                                  fontWeight: 800, 
                                  padding: "2px 6px", 
                                  borderRadius: "999px",
                                  background: idx === 0 ? "#ecfdf5" : "var(--color-bg)",
                                  color: idx === 0 ? "var(--color-primary)" : "var(--color-text-muted)"
                                }}>
                                  {idx === 0 ? "⭐ Prioritas #1" : `Antrean #${idx + 1}`}
                                </span>
                              </td>
                              <td><code>{b.batch_number}</code></td>
                              <td>{new Date(b.expiry_date).toLocaleDateString("id-ID")}</td>
                              <td><strong>{b.stock} unit</strong></td>
                              <td>
                                <span className={`expiry-tag ${st.cls}`}>
                                  {st.label}
                                </span>
                              </td>
                              <td style={{ textAlign: "right" }}>
                                <button 
                                  className="btn btn-sm btn-secondary" 
                                  onClick={() => handleDeleteBatch(b.id)}
                                  title="Hapus kloter ini"
                                  style={{ padding: "4px 8px" }}
                                >
                                  <Trash2 size={13} color="#ef4444" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setIsBatchModalOpen(false)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CATEGORY ADD / EDIT */}
      {isCatModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 style={{ fontSize: "1.1rem" }}>
                {editingCategory ? `Edit Kategori: ${editingCategory.name}` : "Tambah Kategori Obat Baru"}
              </h3>
              <button 
                onClick={() => setIsCatModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nama Kategori</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Contoh: Vitamin & Suplemen"
                    value={catForm.name}
                    onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Deskripsi</label>
                  <textarea
                    rows={2}
                    className="form-textarea"
                    placeholder="Deskripsi kategori obat..."
                    value={catForm.desc}
                    onChange={(e) => setCatForm({ ...catForm, desc: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setIsCatModalOpen(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCategory ? "Simpan Perubahan" : "Simpan Kategori"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
