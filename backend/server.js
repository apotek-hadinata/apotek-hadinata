"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { sequelize } = require("./models");
const apiRouter = require("./routes/api");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  return res.status(200).json({
    status: "success",
    message: "Welcome to Apotek API Backend Engine v1.0.0",
    timestamp: new Date(),
  });
});

app.use("/api", apiRouter);

app.use((req, res, next) => {
  return res.status(404).json({
    status: "error",
    message: `Jalur API ${req.originalUrl} tidak ditemukan di server ini.`,
  });
});

app.use((err, req, res, next) => {
  console.error("Database/Server Error Log:", err);

  const statusCode = err.status || 500;

  return res.status(statusCode).json({
    status: "error",
    message: err.message || "Terjadi kesalahan internal pada server database apotek.",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database MySQL berhasil terhubung dengan aman.");

    await sequelize.sync({ alter: false });
    console.log("Seluruh struktur model database berhasil disinkronkan.");

    app.listen(PORT, () => {
      console.log(`Server berjalan lancar di http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Gagal menyalakan server backend apotek:", error);
    process.exit(1);
  }
};

startServer();
