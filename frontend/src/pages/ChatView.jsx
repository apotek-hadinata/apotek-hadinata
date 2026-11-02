import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import {
  MessageSquare,
  Send,
  ArrowLeft,
  User,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

// =========================================================
// 1. HALAMAN KONSULTASI LIVE CHAT PELANGGAN (USER)
// =========================================================
export const UserChatPage = ({ onBackToCatalog }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const quickPrompts = [
    "Halo Apoteker, saya ingin konsultasi obat demam & flu yang aman.",
    "Bagaimana aturan pakai obat sebelum/sesudah makan?",
    "Mohon info status pesanan online saya hari ini.",
    "Apakah stok vitamin daya tahan tubuh masih tersedia?",
  ];

  const fetchHistory = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.getChatHistory();
      if (res?.data && Array.isArray(res.data)) {
        setMessages(res.data);
      }
    } catch (err) {
      if (!silent) console.error("Gagal memuat riwayat chat:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(false);
    const interval = setInterval(() => {
      fetchHistory(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async (e, customText) => {
    if (e) e.preventDefault();
    const text = (customText ?? inputText).trim();
    if (!text || sending) return;

    try {
      setSending(true);
      if (!customText) setInputText("");
      await api.sendMessage({ message: text });
      await fetchHistory(true);
    } catch (err) {
      alert(err.message || "Gagal mengirim pesan konsultasi");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: "880px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onBackToCatalog}
            style={{ marginBottom: "8px" }}
          >
            <ArrowLeft size={14} /> Kembali ke Katalog
          </button>
          <h1 style={{ fontSize: "1.55rem" }}>Konsultasi Apoteker & Layanan Farmasi</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
            Tanyakan dosis, indikasi obat non-resep, atau konfirmasi pesanan langsung ke tim farmasi Apotek Hadinata.
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={() => fetchHistory(false)}>
          <RefreshCw size={14} /> Segarkan
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", height: "580px" }}>
        {/* Chat Header */}
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--color-border)",
            background: "var(--ink-forest)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "var(--radius-sm)",
                background: "var(--color-primary)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShieldCheck size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.94rem", color: "#ffffff" }}>Apoteker Jaga — Apotek Hadinata</div>
              <div style={{ fontSize: "0.74rem", color: "#a5b5a8", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="status-dot status-dot-active" />
                <span>Aktif Melayani Konsultasi (07.00 – 22.00 WIB)</span>
              </div>
            </div>
          </div>

          <span
            style={{
              background: "var(--accent-citron)",
              color: "var(--ink-forest)",
              padding: "3px 9px",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.7rem",
              fontWeight: 800,
              letterSpacing: "0.03em",
            }}
          >
            SIPA RESMI
          </span>
        </div>

        {/* Messages Scroll Area */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
            background: "var(--color-bg)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {loading ? (
            <div style={{ margin: "auto", textAlign: "center", color: "var(--color-text-muted)" }}>
              Memuat ruang konsultasi...
            </div>
          ) : messages.length === 0 ? (
            <div style={{ margin: "auto", textAlign: "center", maxWidth: "460px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-primary-light)",
                  border: "1px solid var(--color-primary-border)",
                  color: "var(--color-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                }}
              >
                <MessageSquare size={20} />
              </div>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "6px" }}>
                Mulai Konsultasi dengan Apoteker Kami
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "16px" }}>
                Pilih salah satu topik cepat di bawah ini atau ketik pertanyaan Anda secara langsung:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ textAlign: "left", justifyContent: "flex-start", fontWeight: 500 }}
                    onClick={() => handleSend(null, prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === user?.id || msg.User?.role === "user";
              const senderLabel = isMine ? "Anda" : `${msg.User?.name || "Apoteker"} (Apoteker CS)`;
              const timeStr = msg.createdAt
                ? new Date(msg.createdAt).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "";

              return (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isMine ? "flex-end" : "flex-start",
                  }}
                >
                  <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginBottom: "3px", padding: "0 4px" }}>
                    {senderLabel} • {timeStr}
                  </span>
                  <div
                    style={{
                      maxWidth: "75%",
                      padding: "10px 14px",
                      borderRadius: "var(--radius-lg)",
                      background: isMine ? "var(--color-primary)" : "#ffffff",
                      color: isMine ? "#ffffff" : "var(--color-text-main)",
                      border: isMine ? "none" : "1px solid var(--color-border)",
                      boxShadow: "var(--shadow-xs)",
                      fontSize: "0.9rem",
                      lineHeight: 1.45,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {msg.message}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSend}
          style={{
            padding: "14px 16px",
            borderTop: "1px solid var(--color-border)",
            background: "white",
            display: "flex",
            gap: "10px",
          }}
        >
          <input
            type="text"
            className="form-input"
            placeholder="Tulis pertanyaan seputar obat, dosis, atau pesanan..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={sending}
          />
          <button type="submit" className="btn btn-primary" disabled={sending || !inputText.trim()}>
            <Send size={16} />
            {sending ? "Mengirim..." : "Kirim"}
          </button>
        </form>
      </div>
    </div>
  );
};

// =========================================================
// 2. CHAT CONSOLE APOTEKER / CS (ADMIN)
// =========================================================
export const AdminChatConsole = ({ onBack }) => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [roomSearch, setRoomSearch] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const loadRooms = async (silent = false) => {
    try {
      if (!silent) setLoadingRooms(true);
      const res = await api.getAdminChatRooms();
      if (res?.data && Array.isArray(res.data)) {
        setRooms(res.data);
        if (!selectedRoom && res.data.length > 0 && !silent) {
          setSelectedRoom(res.data[0]);
        }
      }
    } catch (err) {
      if (!silent) console.error("Gagal memuat daftar room chat:", err);
    } finally {
      if (!silent) setLoadingRooms(false);
    }
  };

  const loadRoomMessages = async (roomId, silent = false) => {
    if (!roomId) return;
    try {
      if (!silent) setLoadingMessages(true);
      const res = await api.getAdminChatHistory(roomId);
      if (res?.data && Array.isArray(res.data)) {
        setMessages(res.data);
      }
      if (!silent) {
        // Segarkan badge unread setelah dibuka
        loadRooms(true);
      }
    } catch (err) {
      if (!silent) console.error("Gagal memuat pesan room:", err);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadRooms(false);
  }, []);

  useEffect(() => {
    if (selectedRoom?.id) {
      loadRoomMessages(selectedRoom.id, false);
    }
  }, [selectedRoom?.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadRooms(true);
      if (selectedRoom?.id) {
        loadRoomMessages(selectedRoom.id, true);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedRoom?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    const text = replyText.trim();
    if (!text || !selectedRoom || sending) return;

    try {
      setSending(true);
      setReplyText("");
      await api.sendMessage({
        room_id: selectedRoom.id,
        chat_room_id: selectedRoom.id,
        message: text,
      });
      await loadRoomMessages(selectedRoom.id, true);
      await loadRooms(true);
    } catch (err) {
      alert(err.message || "Gagal mengirim balasan ke pelanggan");
    } finally {
      setSending(false);
    }
  };

  const filteredRooms = rooms.filter((r) => {
    const q = roomSearch.toLowerCase();
    const name = (r.User?.name || "").toLowerCase();
    const last = (r.last_message || "").toLowerCase();
    return name.includes(q) || last.includes(q);
  });

  return (
    <div className="animate-fade-in">
      <div className="dashboard-header">
        <div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onBack}
            style={{ marginBottom: "8px" }}
          >
            <ArrowLeft size={14} /> Kembali ke Dashboard
          </button>
          <h1>Konsol Live Chat Apoteker & CS</h1>
          <p style={{ color: "var(--color-text-muted)" }}>
            Jawab pertanyaan konsultasi obat non-resep dan bantu pelanggan secara langsung.
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={() => loadRooms(false)}>
          <RefreshCw size={14} /> Segarkan Percakapan
        </button>
      </div>

      <div
        className="card"
        style={{
          padding: 0,
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          height: "600px",
        }}
      >
        {/* LEFT PANEL: ROOMS LIST */}
        <div
          style={{
            borderRight: "1px solid var(--color-border)",
            display: "flex",
            flexDirection: "column",
            background: "white",
            minWidth: 0,
          }}
        >
          <div style={{ padding: "14px", borderBottom: "1px solid var(--color-border)" }}>
            <input
              type="text"
              className="form-input"
              placeholder="Cari nama pelanggan..."
              value={roomSearch}
              onChange={(e) => setRoomSearch(e.target.value)}
              style={{ padding: "8px 12px", fontSize: "0.85rem" }}
            />
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {loadingRooms ? (
              <div style={{ padding: "28px 16px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                Memuat daftar pelanggan...
              </div>
            ) : filteredRooms.length === 0 ? (
              <div style={{ padding: "36px 16px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                <MessageSquare size={28} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
                <div>Belum ada percakapan konsultasi masuk dari pelanggan.</div>
              </div>
            ) : (
              filteredRooms.map((room) => {
                const isSelected = selectedRoom?.id === room.id;
                return (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    style={{
                      padding: "14px 16px",
                      borderBottom: "1px solid var(--color-border)",
                      cursor: "pointer",
                      background: isSelected ? "var(--color-primary-light)" : "white",
                      borderLeft: isSelected ? "3px solid var(--color-primary)" : "3px solid transparent",
                      transition: "background 150ms",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <strong style={{ fontSize: "0.9rem", color: "var(--color-text-main)" }}>
                        {room.User?.name || `Pelanggan #${room.user_id}`}
                      </strong>
                      {room.unread_count > 0 && (
                        <span
                          style={{
                            background: "var(--color-danger)",
                            color: "white",
                            fontSize: "0.68rem",
                            fontWeight: 800,
                            padding: "1px 7px",
                            borderRadius: "999px",
                          }}
                        >
                          {room.unread_count} baru
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--color-text-muted)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {room.last_message}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "var(--color-text-subtle)", marginTop: "4px" }}>
                      {room.last_message_at
                        ? new Date(room.last_message_at).toLocaleString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: ACTIVE CONVERSATION */}
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0, background: "var(--color-bg)" }}>
          {!selectedRoom ? (
            <div style={{ margin: "auto", textAlign: "center", color: "var(--color-text-muted)", padding: "24px" }}>
              <MessageSquare size={40} style={{ margin: "0 auto 10px", opacity: 0.4 }} />
              <h3 style={{ fontSize: "1.05rem" }}>Pilih Percakapan Pelanggan</h3>
              <p style={{ fontSize: "0.85rem" }}>Klik salah satu nama pelanggan di panel sebelah kiri untuk membalas konsultasi.</p>
            </div>
          ) : (
            <>
              {/* Active Customer Header */}
              <div
                style={{
                  padding: "14px 20px",
                  background: "white",
                  borderBottom: "1px solid var(--color-border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "var(--radius-md)",
                      background: "var(--color-primary-light)",
                      color: "var(--color-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <User size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                      {selectedRoom.User?.name || `Pelanggan #${selectedRoom.user_id}`}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                      {selectedRoom.User?.phone ? `Telp: ${selectedRoom.User.phone}` : "Pelanggan Terdaftar"}
                      {selectedRoom.User?.email ? ` • ${selectedRoom.User.email}` : ""}
                    </div>
                  </div>
                </div>

                <span className="badge badge-user">Room #{selectedRoom.id}</span>
              </div>

              {/* Messages Thread */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {loadingMessages ? (
                  <div style={{ margin: "auto", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                    Memuat riwayat percakapan...
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ margin: "auto", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                    Belum ada pesan di ruang ini.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isAdminSender = msg.User?.role === "admin" || msg.sender_id === user?.id;
                    const timeStr = msg.createdAt
                      ? new Date(msg.createdAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "";

                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: isAdminSender ? "flex-end" : "flex-start",
                        }}
                      >
                        <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginBottom: "3px", padding: "0 4px" }}>
                          {isAdminSender ? `${msg.User?.name || "Admin"} (Apoteker)` : msg.User?.name || "Pelanggan"} • {timeStr}
                        </span>
                        <div
                          style={{
                            maxWidth: "75%",
                            padding: "10px 14px",
                            borderRadius: "var(--radius-lg)",
                            background: isAdminSender ? "var(--color-primary)" : "#ffffff",
                            color: isAdminSender ? "#ffffff" : "var(--color-text-main)",
                            border: isAdminSender ? "none" : "1px solid var(--color-border)",
                            boxShadow: "var(--shadow-xs)",
                            fontSize: "0.9rem",
                            lineHeight: 1.45,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                        >
                          {msg.message}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Admin Reply Input */}
              <form
                onSubmit={handleSendReply}
                style={{
                  padding: "14px 16px",
                  borderTop: "1px solid var(--color-border)",
                  background: "white",
                  display: "flex",
                  gap: "10px",
                }}
              >
                <input
                  type="text"
                  className="form-input"
                  placeholder={`Balas konsultasi ${selectedRoom.User?.name || "pelanggan"}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  disabled={sending}
                />
                <button type="submit" className="btn btn-primary" disabled={sending || !replyText.trim()}>
                  <Send size={16} />
                  {sending ? "Mengirim..." : "Balas"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
