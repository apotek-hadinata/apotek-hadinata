"use strict";

const { ActivityLog, User } = require("../models");

exports.getActivityLogs = async (req, res, next) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const offset = (page - 1) * limit;

    const { count, rows } = await ActivityLog.findAndCountAll({
      include: [
        {
          model: User,
          as: "admin",
          attributes: ["id", "name", "email", "role"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return res.status(200).json({
      status: "success",
      total: count,
      page,
      limit,
      data: rows,
    });
  } catch (error) {
    next(error);
  }
};

