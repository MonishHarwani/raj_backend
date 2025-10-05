const express = require("express");
const { body, validationResult } = require("express-validator");
const { Message, User } = require("../models");
const { authenticateToken } = require("../middleware/auth");
const router = express.Router();

// Get conversations
router.get("/conversations", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get unique chat partners
    const conversations = await Message.findAll({
      where: {
        [require("sequelize").Op.or]: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      attributes: [
        "chatId",
        [
          require("sequelize").fn("MAX", require("sequelize").col("createdAt")),
          "lastMessageTime",
        ],
        [
          require("sequelize").fn("COUNT", require("sequelize").col("id")),
          "messageCount",
        ],
      ],
      group: ["chatId"],
      order: [
        [
          require("sequelize").fn("MAX", require("sequelize").col("createdAt")),
          "DESC",
        ],
      ],
    });

    // Get conversation details with last message and partner info
    const conversationDetails = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = await Message.findOne({
          where: { chatId: conv.chatId },
          include: [
            {
              model: User,
              as: "sender",
              attributes: ["id", "firstName", "lastName", "profilePhoto"],
            },
          ],
          order: [["createdAt", "DESC"]],
        });

        // Determine chat partner
        const partnerId =
          lastMessage.senderId === userId
            ? lastMessage.receiverId
            : lastMessage.senderId;

        const partner = await User.findByPk(partnerId, {
          attributes: ["id", "firstName", "lastName", "profilePhoto", "role"],
        });

        // Count unread messages
        const unreadCount = await Message.count({
          where: {
            chatId: conv.chatId,
            receiverId: userId,
            isRead: false,
          },
        });

        return {
          chatId: conv.chatId,
          partner,
          lastMessage: {
            content: lastMessage.content,
            createdAt: lastMessage.createdAt,
            sender: lastMessage.sender,
          },
          unreadCount,
          messageCount: conv.dataValues.messageCount,
        };
      })
    );

    res.json({ conversations: conversationDetails });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get messages for a specific chat
router.get("/:chatId", authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Verify user is part of this chat
    const userMessages = await Message.findOne({
      where: {
        chatId,
        [require("sequelize").Op.or]: [
          { senderId: req.user.id },
          { receiverId: req.user.id },
        ],
      },
    });

    if (!userMessages) {
      return res.status(403).json({ message: "Access denied to this chat" });
    }

    const { count, rows: messages } = await Message.findAndCountAll({
      where: { chatId },
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "firstName", "lastName", "profilePhoto"],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
    });

    // Mark messages as read
    await Message.update(
      { isRead: true, readAt: new Date() },
      {
        where: {
          chatId,
          receiverId: req.user.id,
          isRead: false,
        },
      }
    );

    res.json({
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Send message
router.post(
  "/",
  authenticateToken,
  [
    body("receiverId").isInt().withMessage("Receiver ID is required"),
    body("content")
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage(
        "Message content is required and must be less than 1000 characters"
      ),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { receiverId, content } = req.body;

      // Verify receiver exists
      const receiver = await User.findByPk(receiverId);
      if (!receiver) {
        return res.status(404).json({ message: "Receiver not found" });
      }

      // Create chat ID (consistent regardless of who sends first)
      const chatId = [req.user.id, receiverId].sort((a, b) => a - b).join("_");

      const message = await Message.create({
        senderId: req.user.id,
        receiverId,
        content,
        chatId,
      });

      const messageWithSender = await Message.findByPk(message.id, {
        include: [
          {
            model: User,
            as: "sender",
            attributes: ["id", "firstName", "lastName", "profilePhoto"],
          },
        ],
      });

      res.status(201).json({
        message: "Message sent successfully",
        data: messageWithSender,
      });
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Mark messages as read
router.put("/:chatId/read", authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;

    await Message.update(
      { isRead: true, readAt: new Date() },
      {
        where: {
          chatId,
          receiverId: req.user.id,
          isRead: false,
        },
      }
    );

    res.json({ message: "Messages marked as read" });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete message
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const message = await Message.findOne({
      where: { id: req.params.id, senderId: req.user.id },
    });

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    await message.destroy();
    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Delete message error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
