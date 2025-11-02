"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if table exists first
    const tableExists = await queryInterface.sequelize.query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'conversations' AND TABLE_SCHEMA = DATABASE()",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (tableExists.length === 0) {
      await queryInterface.createTable("conversations", {
        id: {
          type: Sequelize.STRING(100),
          primaryKey: true,
          allowNull: false,
        },
        user1Id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "users",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        user2Id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "users",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        lastMessageId: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        lastMessageAt: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        user1UnreadCount: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        user2UnreadCount: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        isActive: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
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

      // Add indexes only if table was created
      await queryInterface.addIndex("conversations", ["user1Id"], {
        name: "idx_conversations_user1",
      });

      await queryInterface.addIndex("conversations", ["user2Id"], {
        name: "idx_conversations_user2",
      });

      await queryInterface.addIndex("conversations", ["lastMessageAt"], {
        name: "idx_conversations_lastMessageAt",
      });

      await queryInterface.addIndex("conversations", ["isActive"], {
        name: "idx_conversations_isActive",
      });
    } else {
      console.log("Table conversations already exists, skipping creation");

      // Add indexes if they don't exist
      try {
        await queryInterface.addIndex("conversations", ["user1Id"], {
          name: "idx_conversations_user1",
        });
      } catch (error) {
        console.log("Index idx_conversations_user1 already exists");
      }

      try {
        await queryInterface.addIndex("conversations", ["user2Id"], {
          name: "idx_conversations_user2",
        });
      } catch (error) {
        console.log("Index idx_conversations_user2 already exists");
      }

      try {
        await queryInterface.addIndex("conversations", ["lastMessageAt"], {
          name: "idx_conversations_lastMessageAt",
        });
      } catch (error) {
        console.log("Index idx_conversations_lastMessageAt already exists");
      }

      try {
        await queryInterface.addIndex("conversations", ["isActive"], {
          name: "idx_conversations_isActive",
        });
      } catch (error) {
        console.log("Index idx_conversations_isActive already exists");
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("conversations");
  },
};
