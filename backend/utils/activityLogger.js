"use strict";

const { ActivityLog } = require("../models");

/**
 * Record administrative activity for audit trail
 */
const recordActivityLog = async ({
  admin_id,
  action,
  description,
  entity_type,
  entity_id,
  req,
}) => {
  try {
    let ip = null;
    if (req) {
      ip =
        req.headers["x-forwarded-for"] ||
        req.socket?.remoteAddress ||
        req.ip ||
        null;
      if (typeof ip === "string" && ip.includes(",")) {
        ip = ip.split(",")[0].trim();
      }
    }

    await ActivityLog.create({
      admin_id: admin_id || (req?.user?.role === "admin" ? req.user.id : null),
      action: action || "UNKNOWN_ACTION",
      description: description || null,
      entity_type: entity_type || null,
      entity_id: entity_id || null,
      ip_address: ip ? String(ip).slice(0, 45) : null,
    });
  } catch (err) {
    console.warn("ActivityLog recording warning:", err.message);
  }
};

module.exports = { recordActivityLog };

