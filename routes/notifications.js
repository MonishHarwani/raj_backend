const express = require("express");
const { Notification } = require("../models");
const { authenticateToken } = require("../middleware/auth");
const router = express.Router();

// Get user's notifications
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, unread } = req.query;
    const offset = (page - 1) * limit;
    const where = { userId: req.user.id };

    if (unread === "true") {
      where.isRead = false;
    }

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
    });

    res.json({
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Mark notification as read
router.put("/:id/read", authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    await notification.update({
      isRead: true,
      readAt: new Date(),
    });

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Mark notification as read error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Mark all notifications as read
router.put("/read-all", authenticateToken, async (req, res) => {
  try {
    await Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { userId: req.user.id, isRead: false } }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all notifications as read error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete notification
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    await notification.destroy();
    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get unread count
router.get("/unread-count", authenticateToken, async (req, res) => {
  try {
    const count = await Notification.count({
      where: { userId: req.user.id, isRead: false },
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
