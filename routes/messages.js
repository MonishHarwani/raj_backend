// routes/messages.js
module.exports = function (io) {
  const express = require("express");
  const router = express.Router();
  const { Message, Conversation, User } = require("../models");
  const { authenticateToken } = require("../middleware/auth");
  const { body, validationResult } = require("express-validator");
  const multer = require("multer");
  const path = require("path");
  const { Op } = require("sequelize");

  // Multer for message file uploads
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, "../uploads/messages"));
    },
    filename: (req, file, cb) => {
      const filename =
        "message-" +
        Date.now() +
        "-" +
        Math.round(Math.random() * 1e9) +
        path.extname(file.originalname);
      cb(null, filename);
    },
  });
  const uploadFile = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
      const extname = allowedTypes.test(
        path.extname(file.originalname).toLowerCase()
      );
      const mimetype =
        allowedTypes.test(file.mimetype) || file.mimetype.startsWith("image/");
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error("Only images and documents are allowed!"), false);
      }
    },
  });

  // Helper - consistent conversation ID
  const generateConversationId = (userId1, userId2) => {
    const [smaller, larger] = [userId1, userId2].sort((a, b) => a - b);
    return `${smaller}-${larger}`;
  };

  // Get all conversations
  router.get("/conversations", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const conversations = await Conversation.findAll({
        where: {
          [Op.or]: [{ user1Id: userId }, { user2Id: userId }],
          isActive: true,
        },
        include: [
          {
            model: User,
            as: "user1",
            attributes: ["id", "firstName", "lastName", "profilePhoto"],
          },
          {
            model: User,
            as: "user2",
            attributes: ["id", "firstName", "lastName", "profilePhoto"],
          },
          {
            model: Message,
            as: "lastMessage",
            include: [
              {
                model: User,
                as: "sender",
                attributes: ["id", "firstName", "lastName"],
              },
            ],
          },
        ],
        order: [["lastMessageAt", "DESC"]],
      });
      const formattedConversations = conversations.map((conv) => {
        const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1;
        const unreadCount =
          conv.user1Id === userId
            ? conv.user1UnreadCount
            : conv.user2UnreadCount;
        return {
          id: conv.id,
          otherUser,
          lastMessage: conv.lastMessage,
          lastMessageAt: conv.lastMessageAt,
          unreadCount,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
        };
      });
      res.json({ conversations: formattedConversations });
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Start a new conversation
  router.post(
    "/conversations/start",
    authenticateToken,
    [
      body("userId")
        .isInt({ min: 1 })
        .withMessage("Valid user ID is required")
        .custom((value, { req }) => {
          if (parseInt(value) === req.user.id) {
            throw new Error("Cannot start conversation with yourself");
          }
          return true;
        }),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            message: "Validation failed",
            errors: errors.array(),
          });
        }
        const { userId: otherUserId } = req.body;
        const currentUserId = req.user.id;
        const otherUser = await User.findByPk(otherUserId, {
          attributes: ["id", "firstName", "lastName", "profilePhoto"],
        });
        if (!otherUser) {
          return res.status(404).json({ message: "User not found" });
        }
        const conversationId = generateConversationId(
          currentUserId,
          otherUserId
        );
        let conversation = await Conversation.findByPk(conversationId, {
          include: [
            {
              model: User,
              as: "user1",
              attributes: ["id", "firstName", "lastName", "profilePhoto"],
            },
            {
              model: User,
              as: "user2",
              attributes: ["id", "firstName", "lastName", "profilePhoto"],
            },
          ],
        });
        if (!conversation) {
          conversation = await Conversation.create({
            id: conversationId,
            user1Id: Math.min(currentUserId, otherUserId),
            user2Id: Math.max(currentUserId, otherUserId),
            user1UnreadCount: 0,
            user2UnreadCount: 0,
          });
          conversation = await Conversation.findByPk(conversationId, {
            include: [
              {
                model: User,
                as: "user1",
                attributes: ["id", "firstName", "lastName", "profilePhoto"],
              },
              {
                model: User,
                as: "user2",
                attributes: ["id", "firstName", "lastName", "profilePhoto"],
              },
            ],
          });
        }
        const formattedConversation = {
          id: conversation.id,
          otherUser:
            conversation.user1Id === currentUserId
              ? conversation.user2
              : conversation.user1,
          lastMessage: null,
          lastMessageAt: conversation.lastMessageAt,
          unreadCount: 0,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
        };
        res.json({
          message: "Conversation ready",
          conversation: formattedConversation,
        });
      } catch (error) {
        console.error("Start conversation error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Get messages for conversation
  router.get(
    "/conversations/:conversationId",
    authenticateToken,
    async (req, res) => {
      try {
        const { conversationId } = req.params;
        const userId = req.user.id;
        const { page = 1, limit = 50 } = req.query;
        const conversation = await Conversation.findByPk(conversationId);
        if (
          !conversation ||
          (conversation.user1Id !== userId && conversation.user2Id !== userId)
        ) {
          return res.status(404).json({ message: "Conversation not found" });
        }
        const offset = (page - 1) * limit;
        const messages = await Message.findAll({
          where: { conversationId },
          include: [
            {
              model: User,
              as: "sender",
              attributes: ["id", "firstName", "lastName", "profilePhoto"],
            },
            {
              model: Message,
              as: "replyTo",
              include: [
                {
                  model: User,
                  as: "sender",
                  attributes: ["id", "firstName", "lastName"],
                },
              ],
            },
          ],
          order: [["createdAt", "DESC"]],
          limit: parseInt(limit),
          offset: parseInt(offset),
        });
        res.json({
          messages: messages.reverse(), // Show oldest first
          hasMore: messages.length === parseInt(limit),
        });
      } catch (error) {
        console.error("Get messages error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Send message (with real-time socket emit)
  router.post(
    "/send",
    authenticateToken,
    uploadFile.single("file"),
    [
      body("receiverId").isInt().withMessage("Receiver ID must be an integer"),
      body("content")
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage("Message content must be less than 2000 characters"),
      body("replyToId")
        .optional()
        .isInt()
        .withMessage("Reply To ID must be an integer"),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            message: "Validation failed",
            errors: errors.array(),
          });
        }
        const senderId = req.user.id;
        const { receiverId, content, replyToId } = req.body;
        const file = req.file;
        if ((!content || content.trim() === "") && !file) {
          return res
            .status(400)
            .json({ message: "Message must have content or file" });
        }
        // Verify receiver exists
        const receiver = await User.findByPk(receiverId);
        if (!receiver) {
          return res.status(404).json({ message: "Receiver not found" });
        }
        // Generate conversation ID and ensure it exists
        const conversationId = generateConversationId(senderId, receiverId);
        let conversation = await Conversation.findByPk(conversationId);
        if (!conversation) {
          conversation = await Conversation.create({
            id: conversationId,
            user1Id: Math.min(senderId, receiverId),
            user2Id: Math.max(senderId, receiverId),
            user1UnreadCount: 0,
            user2UnreadCount: 0,
          });
        }
        // Save message
        const messageData = {
          senderId,
          receiverId,
          conversationId,
          chatId: 0,
          content: content ? content.trim() : "",
          messageType: file
            ? file.mimetype.startsWith("image/")
              ? "images"
              : "files"
            : "text",
          fileUrl: file ? `/uploads/messages/${file.filename}` : null,
          fileName: file ? file.originalname : null,
          replyToId: replyToId || null,
        };
        const message = await Message.create(messageData);
        const updateData = {
          lastMessageId: message.id,
          lastMessageAt: new Date(),
        };
        // Update unread count
        if (conversation.user1Id === receiverId) {
          updateData.user1UnreadCount = conversation.user1UnreadCount + 1;
        } else {
          updateData.user2UnreadCount = conversation.user2UnreadCount + 1;
        }
        await conversation.update(updateData);
        // Fetch hydrated message for socket emit and return
        const completeMessage = await Message.findByPk(message.id, {
          include: [
            {
              model: User,
              as: "sender",
              attributes: ["id", "firstName", "lastName", "profilePhoto"],
            },
            {
              model: Message,
              as: "replyTo",
              include: [
                {
                  model: User,
                  as: "sender",
                  attributes: ["id", "firstName", "lastName"],
                },
              ],
            },
          ],
        });
        // REALTIME: EMIT TO SENDER AND RECEIVER
        io.to(`user:${receiverId}`).emit("newMessage", completeMessage);
        io.to(`user:${senderId}`).emit("newMessage", completeMessage);
        res.status(201).json({
          message: "Message sent successfully",
          data: completeMessage,
        });
      } catch (error) {
        console.error("Send message error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Mark messages as read
  router.patch(
    "/conversations/:conversationId/read",
    authenticateToken,
    async (req, res) => {
      try {
        const { conversationId } = req.params;
        const userId = req.user.id;
        const conversation = await Conversation.findByPk(conversationId);
        if (
          !conversation ||
          (conversation.user1Id !== userId && conversation.user2Id !== userId)
        ) {
          return res.status(404).json({ message: "Conversation not found" });
        }
        // Mark unread messages as read
        await Message.update(
          { isRead: true, readAt: new Date() },
          {
            where: {
              conversationId,
              receiverId: userId,
              isRead: false,
            },
          }
        );
        // Reset unread count
        const updateData =
          conversation.user1Id === userId
            ? { user1UnreadCount: 0 }
            : { user2UnreadCount: 0 };
        await conversation.update(updateData);
        res.json({ message: "Messages marked as read" });
      } catch (error) {
        console.error("Mark as read error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Always return router!
  return router;
};
