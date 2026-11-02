// Clean Pharmacy Invoice & POS Thermal Receipt Print Utility — Apotek Hadinata

const escapeHtml = (str = "") =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const formatRp = (val) => `Rp ${Number(val || 0).toLocaleString("id-ID")}`;

export function printOrderReceipt(order, paymentLabel = "Midtrans / QRIS") {
  if (!order) return;
  const win = window.open("", "_blank", "width=720,height=820");
  if (!win) {
    window.print();
    return;
  }

  const items = order.items || order.OrderItems || [];
  const createdStr = order.createdAt
    ? new Date(order.createdAt).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

  const recipient =
    order.recipient_name || order.customer?.name || order.User?.name || "Pelanggan";
  const phone =
    order.recipient_phone || order.customer?.phone || order.User?.phone || "-";
  const address =
    order.shipping_address || order.Shipping?.shipping_address || "-";

  const rowsHtml = items
    .map((it) => {
      const name = escapeHtml(it.medicine_name || it.Medicine?.name || "Obat");
      const sku = escapeHtml(it.SKU_code || it.Medicine?.SKU_code || "");
      const unitPrice = it.price_at_purchase || it.Medicine?.price || 0;
      const sub = it.subtotal || unitPrice * (it.quantity || 1);
      const batchTags = (it.OrderItemBatches || [])
        .map((oib) =>
          oib.MedicineBatch
            ? `${escapeHtml(oib.MedicineBatch.batch_number)} (${oib.quantity}x)`
            : ""
        )
        .filter(Boolean)
        .join(", ");

      return `
        <tr>
          <td>
            <strong>${name}</strong>
            ${sku ? `<div class="muted">SKU: ${sku}</div>` : ""}
            ${batchTags ? `<div class="batch">FEFO Batch: ${batchTags}</div>` : ""}
          </td>
          <td class="num">${formatRp(unitPrice)}</td>
          <td class="num">${it.quantity}</td>
          <td class="num"><strong>${formatRp(sub)}</strong></td>
        </tr>
      `;
    })
    .join("");

  win.document.write(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8" />
      <title>Nota #${order.id} — Apotek Hadinata</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #111915; margin: 0; padding: 28px; font-size: 13px; }
        .sheet { max-width: 640px; margin: 0 auto; border: 1px solid #cfd6cd; padding: 24px; border-radius: 6px; }
        .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #008744; padding-bottom: 14px; margin-bottom: 16px; }
        .brand { font-size: 19px; font-weight: 800; letter-spacing: -0.02em; color: #111915; }
        .brand span { color: #008744; }
        .muted { color: #5b665e; font-size: 11.5px; margin-top: 2px; }
        .batch { color: #006e37; font-family: Consolas, monospace; font-size: 11px; margin-top: 2px; }
        .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #f4f6f3; padding: 12px 14px; border-radius: 4px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th { text-align: left; font-size: 11.5px; text-transform: uppercase; background: #eff2ee; padding: 8px 10px; border-bottom: 1px solid #cfd6cd; }
        td { padding: 9px 10px; border-bottom: 1px solid #e4e8e3; vertical-align: top; }
        .num { text-align: right; white-space: nowrap; }
        .totals { width: 280px; margin-left: auto; }
        .totals-row { display: flex; justify-content: space-between; padding: 4px 0; }
        .totals-grand { border-top: 2px dashed #cfd6cd; margin-top: 6px; padding-top: 8px; font-size: 15px; font-weight: 800; color: #008744; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 11px; font-weight: 700; background: ${
          order.payment_status === "paid" ? "#ebf7f0" : "#fffbeb"
        }; color: ${order.payment_status === "paid" ? "#006e37" : "#92400e"}; border: 1px solid ${
          order.payment_status === "paid" ? "#a6dfc0" : "#fde68a"
        }; }
        .foot { margin-top: 22px; padding-top: 12px; border-top: 1px solid #e4e8e3; text-align: center; font-size: 11.5px; color: #5b665e; }
        @media print { body { padding: 0; } .sheet { border: none; } }
      </style>
    </head>
    <body>
      <div class="sheet">
        <div class="head">
          <div>
            <div class="brand">APOTEK <span>HADINATA</span></div>
            <div class="muted">No. SIPA: 446/SIPA-120/2024 • Kemenkes RI</div>
            <div class="muted">Telp/WA: (+62) 812-7878-5387</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 15px; font-weight: 800;">NOTA #${order.id}</div>
            <div class="muted">${escapeHtml(createdStr)}</div>
            <div style="margin-top: 5px;">
              <span class="badge">${order.payment_status === "paid" ? "LUNAS" : "BELUM LUNAS"}</span>
            </div>
          </div>
        </div>

        <div class="meta">
          <div>
            <div><strong>Penerima:</strong> ${escapeHtml(recipient)}</div>
            <div><strong>Telepon:</strong> ${escapeHtml(phone)}</div>
            <div><strong>Metode Bayar:</strong> ${escapeHtml(paymentLabel)}</div>
          </div>
          <div>
            <div><strong>Alamat / Keterangan:</strong></div>
            <div class="muted">${escapeHtml(address)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Sediaan Obat & Kloter FEFO</th>
              <th class="num">Harga</th>
              <th class="num">Qty</th>
              <th class="num">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row">
            <span>Subtotal Obat</span>
            <span>${formatRp(order.total_items_price || order.total_payment)}</span>
          </div>
          <div class="totals-row">
            <span>Ongkos Kirim</span>
            <span>${formatRp(order.shipping_cost || 0)}</span>
          </div>
          <div class="totals-row totals-grand">
            <span>TOTAL TAGIHAN</span>
            <span>${formatRp(order.total_payment)}</span>
          </div>
        </div>

        <div class="foot">
          Terima kasih telah mempercayakan kebutuhan farmasi Anda di Apotek Hadinata.<br/>
          Simpan bukti transaksi ini. Gunakan obat sesuai aturan pakai atau petunjuk Apoteker.
        </div>
      </div>
      <script>
        window.onload = function() { window.print(); };
      </script>
    </body>
    </html>
  `);
  win.document.close();
}

export function printPosReceipt(posReceipt) {
  if (!posReceipt) return;
  const win = window.open("", "_blank", "width=420,height=640");
  if (!win) {
    window.print();
    return;
  }

  const itemsHtml = (posReceipt.items || [])
    .map(
      (it) => `
      <div class="row">
        <span>${it.quantity}x ${escapeHtml(it.name)}</span>
        <strong>${formatRp(it.price * it.quantity)}</strong>
      </div>
    `
    )
    .join("");

  win.document.write(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8" />
      <title>Struk POS #${posReceipt.order_id}</title>
      <style>
        body { font-family: Consolas, 'Courier New', monospace; width: 300px; margin: 0 auto; padding: 16px; color: #111; font-size: 12px; }
        .center { text-align: center; }
        .line { border-top: 1px dashed #333; margin: 10px 0; }
        .row { display: flex; justify-content: space-between; gap: 8px; margin: 4px 0; }
        .title { font-size: 15px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="center">
        <div class="title">APOTEK HADINATA</div>
        <div>SIPA: 446/SIPA-120/2024</div>
        <div>Telp: 0812-7878-5387</div>
      </div>
      <div class="line"></div>
      <div>No. Struk : #POS-${escapeHtml(posReceipt.order_id)}</div>
      <div>Waktu     : ${escapeHtml(posReceipt.timestamp)}</div>
      <div>Pelanggan : ${escapeHtml(posReceipt.customer_name)}</div>
      <div>Metode    : ${escapeHtml(posReceipt.payment_method)}</div>
      <div class="line"></div>
      ${itemsHtml}
      <div class="line"></div>
      <div class="row"><strong>TOTAL</strong><strong>${formatRp(posReceipt.total)}</strong></div>
      <div class="row"><span>Dibayar</span><span>${formatRp(posReceipt.amount_paid)}</span></div>
      <div class="row"><span>Kembalian</span><span>${formatRp(posReceipt.change)}</span></div>
      <div class="line"></div>
      <div class="center">Terima kasih & semoga lekas sembuh!</div>
      <script>
        window.onload = function() { window.print(); };
      </script>
    </body>
    </html>
  `);
  win.document.close();
}

