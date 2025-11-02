"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if table exists first
    const tableExists = await queryInterface.sequelize.query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'messages' AND TABLE_SCHEMA = DATABASE()",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (tableExists.length === 0) {
      // Table doesn't exist, create it
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
          allowNull: true, // Allow null for file-only messages
          defaultValue: "",
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

      // Add indexes only if table was just created
      await addIndexIfNotExists(
        queryInterface,
        "messages",
        ["senderId"],
        "idx_messages_senderId"
      );
      await addIndexIfNotExists(
        queryInterface,
        "messages",
        ["receiverId"],
        "idx_messages_receiverId"
      );
      await addIndexIfNotExists(
        queryInterface,
        "messages",
        ["conversationId"],
        "idx_messages_conversationId"
      );
      await addIndexIfNotExists(
        queryInterface,
        "messages",
        ["isRead"],
        "idx_messages_isRead"
      );
      await addIndexIfNotExists(
        queryInterface,
        "messages",
        ["createdAt"],
        "idx_messages_createdAt"
      );
      await addIndexIfNotExists(
        queryInterface,
        "messages",
        ["replyToId"],
        "idx_messages_replyToId"
      );
      await addIndexIfNotExists(
        queryInterface,
        "messages",
        ["conversationId", "createdAt"],
        "idx_messages_conversation_created"
      );
    } else {
      console.log("Messages table already exists, checking indexes...");

      // Table exists, just add missing indexes
      await addIndexIfNotExists(
        queryInterface,
        "messages",
        ["senderId"],
        "idx_messages_senderId"
      );
      await addIndexIfNotExists(
        queryInterface,
        "messages",
        ["receiverId"],
        "idx_messages_receiverId"
      );
      await addIndexIfNotExists(
        queryInterface,
        "messages",
        ["conversationId"],
        "idx_messages_conversationId"
      );
      await addIndexIfNotExists(
        queryInterface,
        "messages",
        ["isRead"],
        "idx_messages_isRead"
      );
      await addIndexIfNotExists(
        queryInterface,
        "messages",
        ["createdAt"],
        "idx_messages_createdAt"
      );
      await addIndexIfNotExists(
        queryInterface,
        "messages",
        ["replyToId"],
        "idx_messages_replyToId"
      );
      await addIndexIfNotExists(
        queryInterface,
        "messages",
        ["conversationId", "createdAt"],
        "idx_messages_conversation_created"
      );

      // Fix content field to allow null
      await queryInterface.changeColumn("messages", "content", {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: "",
      });
    }

    // Helper function to add index if it doesn't exist
    async function addIndexIfNotExists(
      queryInterface,
      tableName,
      fields,
      indexName
    ) {
      try {
        // Check if index exists
        const indexes = await queryInterface.sequelize.query(
          `SHOW INDEX FROM ${tableName} WHERE Key_name = '${indexName}'`,
          { type: Sequelize.QueryTypes.SELECT }
        );

        if (indexes.length === 0) {
          console.log(`Adding index ${indexName}...`);
          await queryInterface.addIndex(tableName, fields, { name: indexName });
        } else {
          console.log(`Index ${indexName} already exists, skipping...`);
        }
      } catch (error) {
        console.log(`Error with index ${indexName}:`, error.message);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("messages");
  },
};
