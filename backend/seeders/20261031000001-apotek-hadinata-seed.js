"use strict";

const bcrypt = require("bcrypt");
const {
  User,
  Category,
  Medicine,
  MedicineBatch,
  StockLog,
  CustomerAddress,
  SystemSetting,
  DeliveryBatch,
  ActivityLog,
} = require("../models");

// Helper: tambah hari dari tanggal hari ini dalam format YYYY-MM-DD
const addDaysISO = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

module.exports = {
  async up() {
    const hashedPassword = await bcrypt.hash("password123", 10);

    // 1. SEED AKUN DEMO RESMI (IDEMPOTENT)
    const demoUsers = [
      {
        name: "Apt. Hendra Hadinata, S.Farm",
        email: "admin@apotekhadinata.com",
        phone: "081278785387",
        password: hashedPassword,
        role: "admin",
        address: "Gerai Utama Apotek Hadinata, Jl. Kaliurang Km 5.5, Yogyakarta",
      },
      {
        name: "Budi Santoso",
        email: "budi@gmail.com",
        phone: "081328901122",
        password: hashedPassword,
        role: "user",
        address: "Jl. Mawar No. 45, Pogung Kidul, Sleman, DI Yogyakarta",
      },
      {
        name: "Rizky Pratama",
        email: "kurir@apotekhadinata.com",
        phone: "085729443310",
        password: hashedPassword,
        role: "kurir",
        address: "Pool Logistik Internal Apotek Hadinata, Yogyakarta",
      },
    ];

    let adminUser = null;
    let budiUser = null;
    for (const u of demoUsers) {
      const [userRecord] = await User.findOrCreate({
        where: { email: u.email },
        defaults: u,
      });
      if (u.role === "admin") adminUser = userRecord;
      if (u.email === "budi@gmail.com") budiUser = userRecord;
    }

    // 2. SEED KATEGORI FARMASI RESMI
    const categoryDefinitions = [
      {
        name: "Demam & Pereda Nyeri",
        desc: "Analgesik dan antipiretik untuk menurunkan demam, sakit kepala, nyeri gigi, serta nyeri otot ringan.",
      },
      {
        name: "Batuk, Flu & Alergi",
        desc: "Sediaan tablet dan sirup untuk meredakan gejala influenza, hidung tersumbat, batuk berdahak/kering, dan alergi.",
      },
      {
        name: "Vitamin & Suplemen Imun",
        desc: "Multivitamin harian, vitamin C, D3, dan imunomodulator untuk memelihara daya tahan tubuh.",
      },
      {
        name: "Saluran Pencernaan & Maag",
        desc: "Antasida lambung, pereda kembung, larutan elektrolit rehidrasi, dan obat diare non-resep.",
      },
      {
        name: "Antiseptik, Kulit & P3K",
        desc: "Cairan antiseptik luka, krim kulit topikal, plester medis, dan perlengkapan pertolongan pertama.",
      },
      {
        name: "Obat Mata & THT",
        desc: "Tetes mata steril pelembap iritasi ringan serta perawatan telinga, hidung, dan tenggorokan.",
      },
    ];

    const categoryMap = {};
    for (const cat of categoryDefinitions) {
      const [record] = await Category.findOrCreate({
        where: { name: cat.name },
        defaults: cat,
      });
      categoryMap[cat.name] = record.id;
    }

    // 3. SEED 16 PRODUK OBAT OTC REALISTIS + MULTI-BATCH FEFO
    const medicineDefinitions = [
      {
        category: "Demam & Pereda Nyeri",
        name: "Sanmol Paracetamol 500 mg (Strip 4 Tablet)",
        SKU_code: "OBT-DEM-001",
        price: 4500,
        desc: "Mengandung Paracetamol 500 mg untuk menurunkan demam serta meredakan sakit kepala dan sakit gigi. Dosis dewasa: 1 tablet 3-4 kali sehari sesudah makan.",
        batches: [
          { batch_number: "BCH-SNM-26A", expiry_date: addDaysISO(55), stock: 18 },
          { batch_number: "BCH-SNM-27B", expiry_date: addDaysISO(410), stock: 60 },
        ],
      },
      {
        category: "Demam & Pereda Nyeri",
        name: "Panadol Extra Kaplet (Strip 10 Kaplet)",
        SKU_code: "OBT-DEM-002",
        price: 15500,
        desc: "Kombinasi Paracetamol 500 mg dan Caffeine 65 mg untuk meredakan sakit kepala membandel dan nyeri gigi. Dosis dewasa: 1 kaplet 3-4 kali sehari.",
        batches: [
          { batch_number: "BCH-PND-27A", expiry_date: addDaysISO(320), stock: 45 },
        ],
      },
      {
        category: "Demam & Pereda Nyeri",
        name: "Tempra Paracetamol Sirup Anak Rasa Anggur 60 ml",
        SKU_code: "OBT-DEM-003",
        price: 52000,
        desc: "Sirup penurun panas dan pereda nyeri khusus anak usia 2-6 tahun bebas alkohol. Gunakan sendok takar sesuai berat badan/usia pada kemasan.",
        batches: [
          { batch_number: "BCH-TMP-26X", expiry_date: addDaysISO(22), stock: 9 },
          { batch_number: "BCH-TMP-27C", expiry_date: addDaysISO(365), stock: 24 },
        ],
      },
      {
        category: "Demam & Pereda Nyeri",
        name: "Proris Ibuprofen Suspensi Sirup 60 ml",
        SKU_code: "OBT-DEM-004",
        price: 34500,
        desc: "Suspensi Ibuprofen 100 mg/5 ml untuk menurunkan demam pada anak serta meredakan nyeri ringan hingga sedang. Diminum sesudah makan.",
        batches: [
          { batch_number: "BCH-PRO-27A", expiry_date: addDaysISO(290), stock: 28 },
        ],
      },
      {
        category: "Batuk, Flu & Alergi",
        name: "OBH Combi Batuk Berdahak Menthol Sirup 100 ml",
        SKU_code: "OBT-FLU-001",
        price: 19500,
        desc: "Obat batuk hitam ekspektoran untuk mengencerkan dahak dan melegakan tenggorokan disertai gejala flu. Dewasa: 3 kali sehari 3 sendok takar (15 ml).",
        batches: [
          { batch_number: "BCH-OBH-26B", expiry_date: addDaysISO(68), stock: 15 },
          { batch_number: "BCH-OBH-27D", expiry_date: addDaysISO(430), stock: 35 },
        ],
      },
      {
        category: "Batuk, Flu & Alergi",
        name: "Siladex Antitussive Batuk Kering Sirup 60 ml",
        SKU_code: "OBT-FLU-002",
        price: 18000,
        desc: "Sirup bebas gula dan bebas alkohol untuk meredakan batuk tidak berdahak (batuk kering) yang disertai alergi. Dapat menyebabkan kantuk.",
        batches: [
          { batch_number: "BCH-SLD-27A", expiry_date: addDaysISO(350), stock: 32 },
        ],
      },
      {
        category: "Batuk, Flu & Alergi",
        name: "Decolgen Flu & Batuk (Strip 4 Tablet)",
        SKU_code: "OBT-FLU-003",
        price: 3800,
        desc: "Meredakan gejala flu seperti sakit kepala, demam, bersin-bersin, dan hidung tersumbat. Dewasa: 1 tablet 3 kali sehari sesudah makan.",
        batches: [
          { batch_number: "BCH-DCL-26K", expiry_date: addDaysISO(18), stock: 12 },
          { batch_number: "BCH-DCL-27M", expiry_date: addDaysISO(390), stock: 70 },
        ],
      },
      {
        category: "Vitamin & Suplemen Imun",
        name: "Imboost Force Suplemen Daya Tahan Tubuh (Strip 10 Kaplet)",
        SKU_code: "SUP-VIT-001",
        price: 84000,
        desc: "Suplemen kesehatan dengan Echinacea purpurea 250 mg, Black Elderberry 400 mg, dan Zn Picolinate 10 mg untuk membantu memelihara daya tahan tubuh.",
        batches: [
          { batch_number: "BCH-IMB-27A", expiry_date: addDaysISO(480), stock: 40 },
        ],
      },
      {
        category: "Vitamin & Suplemen Imun",
        name: "Enervon-C Multivitamin C 500 mg & B-Kompleks (Strip 4 Tablet)",
        SKU_code: "SUP-VIT-002",
        price: 6500,
        desc: "Kombinasi Vitamin C 500 mg dan Vitamin B Kompleks untuk menjaga stamina harian dan membantu pemulihan tubuh setelah sakit. 1 tablet sehari.",
        batches: [
          { batch_number: "BCH-ENV-26C", expiry_date: addDaysISO(74), stock: 25 },
          { batch_number: "BCH-ENV-27F", expiry_date: addDaysISO(520), stock: 80 },
        ],
      },
      {
        category: "Vitamin & Suplemen Imun",
        name: "Prove D3-1000 IU Vitamin D3 (Strip 10 Tablet)",
        SKU_code: "SUP-VIT-003",
        price: 36000,
        desc: "Memenuhi kebutuhan Vitamin D dengan cepat pada kondisi tertentu seperti lanjut usia, risiko tinggi, atau pemeliharaan imunitas harian. 1 kali sehari 1 tablet.",
        batches: [
          { batch_number: "BCH-PRV-27B", expiry_date: addDaysISO(440), stock: 38 },
        ],
      },
      {
        category: "Saluran Pencernaan & Maag",
        name: "Promag Tablet Kunyah Antasida Maag (Strip 12 Tablet)",
        SKU_code: "OBT-GI-001",
        price: 9800,
        desc: "Mengandung Hydrotalcite, Magnesium Hydroxide, dan Simethicone untuk meredakan mual, nyeri lambung, nyeri ulu hati, dan perut kembung. Dikunyah 1 jam sebelum makan.",
        batches: [
          { batch_number: "BCH-PRM-27A", expiry_date: addDaysISO(460), stock: 65 },
        ],
      },
      {
        category: "Saluran Pencernaan & Maag",
        name: "Mylanta Cair Suspensi Maag & Kembung Botol 150 ml",
        SKU_code: "OBT-GI-002",
        price: 49500,
        desc: "Suspensi cair antasida bekerja cepat melapisi dinding lambung untuk meredakan asam lambung berlebih dan begah. 1-2 sendok takar (5-10 ml) di antara waktu makan.",
        batches: [
          { batch_number: "BCH-MYL-27A", expiry_date: addDaysISO(310), stock: 22 },
        ],
      },
      {
        category: "Saluran Pencernaan & Maag",
        name: "New Diatabs Attapulgite 600 mg Obat Diare (Strip 4 Tablet)",
        SKU_code: "OBT-GI-003",
        price: 3500,
        desc: "Activated Attapulgite 600 mg untuk pengobatan simtomatik pada diare non-spesifik dengan menyerap racun dan bakteri di saluran pencernaan.",
        batches: [
          { batch_number: "BCH-DTB-27A", expiry_date: addDaysISO(500), stock: 54 },
        ],
      },
      {
        category: "Antiseptik, Kulit & P3K",
        name: "Betadine Antiseptic Solution Povidone-Iodine 10% Botol 30 ml",
        SKU_code: "P3K-ANT-001",
        price: 29000,
        desc: "Cairan antiseptik luka dengan Povidone-Iodine 10% untuk membunuh kuman penyebab infeksi pada luka lecet, luka iris, dan luka bakar ringan.",
        batches: [
          { batch_number: "BCH-BTD-27E", expiry_date: addDaysISO(540), stock: 30 },
        ],
      },
      {
        category: "Antiseptik, Kulit & P3K",
        name: "Bioplacenton Gel Perawatan Luka Bakar Ringan Tube 15 g",
        SKU_code: "P3K-ANT-002",
        price: 31500,
        desc: "Gel topikal untuk perawatan jaringan kulit pada luka permukaan dan luka bakar ringan. Oleskan tipis 3-4 kali sehari pada area luka yang telah dibersihkan.",
        batches: [
          { batch_number: "BCH-BIO-26L", expiry_date: addDaysISO(48), stock: 14 },
          { batch_number: "BCH-BIO-27H", expiry_date: addDaysISO(380), stock: 26 },
        ],
      },
      {
        category: "Obat Mata & THT",
        name: "Insto Regular Tetes Mata Iritasi Ringan Botol 7.5 ml",
        SKU_code: "OBT-THT-001",
        price: 16500,
        desc: "Tetes mata steril untuk mengatasi mata merah dan rasa perih akibat iritasi ringan karena debu, asap, angin, atau layar gawai. Teteskan 2-3 tetes pada mata.",
        batches: [
          { batch_number: "BCH-INS-27A", expiry_date: addDaysISO(335), stock: 42 },
        ],
      },
    ];

    for (const item of medicineDefinitions) {
      const categoryId = categoryMap[item.category];
      if (!categoryId) continue;

      const [medRecord] = await Medicine.findOrCreate({
        where: { SKU_code: item.SKU_code },
        defaults: {
          category_id: categoryId,
          name: item.name,
          desc: item.desc,
          price: item.price,
          SKU_code: item.SKU_code,
          status: "in stock",
          is_active: true,
        },
      });

      for (const b of item.batches) {
        const [batchRecord, createdBatch] = await MedicineBatch.findOrCreate({
          where: {
            medicine_id: medRecord.id,
            batch_number: b.batch_number,
          },
          defaults: {
            medicine_id: medRecord.id,
            batch_number: b.batch_number,
            expiry_date: b.expiry_date,
            stock: b.stock,
            reserved_stock: 0,
          },
        });

        if (createdBatch) {
          try {
            await StockLog.create({
              medicine_id: medRecord.id,
              batch_id: batchRecord.id,
              admin_id: adminUser?.id || null,
              activity_type: "stock_in",
              quantity: b.stock,
              stock_before: 0,
              stock_after: b.stock,
              notes: `Penerimaan stok awal kloter ${b.batch_number} (ED: ${b.expiry_date})`,
            });
          } catch {
            // Abaikan bila tabel StockLogs belum tersedia di environment tertentu
          }
        }
      }
    }

    // 4. SEED PENGATURAN OPERASIONAL APOTEK (SYSTEM SETTINGS)
    const defaultSettings = [
      {
        setting_key: "shipping_cost_default",
        setting_value: "10000",
        description: "Tarif standar ongkos kirim kurir internal apotek (Rupiah)",
      },
      {
        setting_key: "free_shipping_min_order",
        setting_value: "150000",
        description: "Ambang batas nominal belanja untuk fasilitas bebas ongkos kirim (Rupiah)",
      },
      {
        setting_key: "apotek_latitude",
        setting_value: "-7.7956",
        description: "Titik koordinat Latitude gerai fisik Apotek Hadinata",
      },
      {
        setting_key: "apotek_longitude",
        setting_value: "110.3695",
        description: "Titik koordinat Longitude gerai fisik Apotek Hadinata",
      },
      {
        setting_key: "sipa_number",
        setting_value: "464/SIPA-120/2026",
        description: "Nomor Surat Izin Praktik Apoteker (SIPA) resmi Kementerian Kesehatan",
      },
      {
        setting_key: "operational_hours",
        setting_value: "07.00 - 22.00 WIB",
        description: "Jam operasional gerai farmasi dan layanan kurir",
      },
      {
        setting_key: "store_phone",
        setting_value: "+62 812-7878-5387",
        description: "Nomor kontak resmi / WhatsApp CS Apotek Hadinata",
      },
      {
        setting_key: "store_address",
        setting_value: "Gerai Utama Apotek Hadinata, Jl. Kaliurang Km 5.5, Yogyakarta",
        description: "Alamat gerai fisik farmasi pusat",
      },
    ];

    for (const s of defaultSettings) {
      await SystemSetting.findOrCreate({
        where: { setting_key: s.setting_key },
        defaults: {
          ...s,
          updated_by: adminUser?.id || null,
        },
      });
    }

    // 5. SEED BUKU ALAMAT PELANGGAN (CUSTOMER ADDRESSES)
    if (budiUser) {
      const budiAddresses = [
        {
          user_id: budiUser.id,
          label: "Rumah",
          recipient_name: "Budi Santoso",
          recipient_phone: "081328901122",
          address: "Jl. Mawar No. 45, Pogung Kidul, RT 03/RW 49, Sleman, DI Yogyakarta 55284 (Pagar hitam)",
          latitude: -7.7569,
          longitude: 110.3831,
          is_default: true,
        },
        {
          user_id: budiUser.id,
          label: "Kantor",
          recipient_name: "Budi Santoso",
          recipient_phone: "081328901122",
          address: "Gedung Grha Sabha Pramana Lt. 2, Bulaksumur, Sleman, DI Yogyakarta 55281",
          latitude: -7.7702,
          longitude: 110.3778,
          is_default: false,
        },
      ];

      for (const addr of budiAddresses) {
        await CustomerAddress.findOrCreate({
          where: {
            user_id: addr.user_id,
            label: addr.label,
          },
          defaults: addr,
        });
      }
    }

    // 6. SEED GELOMBANG PENGIRIMAN HARIAN (DELIVERY BATCHES)
    const todayISO = addDaysISO(0);
    for (const batchNum of [1, 2]) {
      await DeliveryBatch.findOrCreate({
        where: {
          delivery_date: todayISO,
          batch_number: batchNum,
        },
        defaults: {
          delivery_date: todayISO,
          batch_number: batchNum,
          capacity: 10,
        },
      });
    }

    // 7. SEED AUDIT LOG PERTAMA (ACTIVITY LOG)
    if (adminUser) {
      await ActivityLog.findOrCreate({
        where: {
          admin_id: adminUser.id,
          action: "SYSTEM_INITIALIZE",
        },
        defaults: {
          admin_id: adminUser.id,
          action: "SYSTEM_INITIALIZE",
          description: "Inisialisasi sistem farmasi, master data 16 SKU obat FEFO, buku alamat, dan pengaturan operasional gerai.",
          entity_type: "SystemSetting",
          entity_id: 1,
          ip_address: "127.0.0.1",
        },
      });
    }
  },

  async down() {
    // Aman: hanya menghapus produk ber-SKU seeder ini tanpa menghapus transaksi user lain
    const seededSkus = [
      "OBT-DEM-001", "OBT-DEM-002", "OBT-DEM-003", "OBT-DEM-004",
      "OBT-FLU-001", "OBT-FLU-002", "OBT-FLU-003",
      "SUP-VIT-001", "SUP-VIT-002", "SUP-VIT-003",
      "OBT-GI-001", "OBT-GI-002", "OBT-GI-003",
      "P3K-ANT-001", "P3K-ANT-002",
      "OBT-THT-001",
    ];
    await Medicine.destroy({ where: { SKU_code: seededSkus } });
  },
};

