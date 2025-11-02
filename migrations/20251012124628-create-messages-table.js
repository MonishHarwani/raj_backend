"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("messages", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      senderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      receiverId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true, // ✅ Changed to true to allow empty content for file-only messages
        defaultValue: "", // ✅ Added default empty string
      },
      messageType: {
        type: Sequelize.ENUM("text", "image", "file"),
        allowNull: false,
        defaultValue: "text",
      },
      fileUrl: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      fileName: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      readAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      replyToId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "messages",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      conversationId: {
        type: Sequelize.STRING(100),
        allowNull: false,
        references: {
          model: "conversations",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes
    await queryInterface.addIndex("messages", ["senderId"], {
      name: "idx_messages_senderId",
    });

    await queryInterface.addIndex("messages", ["receiverId"], {
      name: "idx_messages_receiverId",
    });

    await queryInterface.addIndex("messages", ["conversationId"], {
      name: "idx_messages_conversationId",
    });

    await queryInterface.addIndex("messages", ["isRead"], {
      name: "idx_messages_isRead",
    });

    await queryInterface.addIndex("messages", ["createdAt"], {
      name: "idx_messages_createdAt",
    });

    await queryInterface.addIndex("messages", ["replyToId"], {
      name: "idx_messages_replyToId",
    });

    // ✅ Add composite index for better query performance
    await queryInterface.addIndex("messages", ["conversationId", "createdAt"], {
      name: "idx_messages_conversation_created",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("messages");
  },
};
