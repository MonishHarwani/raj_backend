"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Change content field to allow null and add default value
    await queryInterface.changeColumn("messages", "content", {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: "",
    });

    // Add composite index for better performance
    await queryInterface.addIndex("messages", ["conversationId", "createdAt"], {
      name: "idx_messages_conversation_created",
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert content field changes
    await queryInterface.changeColumn("messages", "content", {
      type: Sequelize.TEXT,
      allowNull: false,
    });

    // Remove composite index
    await queryInterface.removeIndex(
      "messages",
      "idx_messages_conversation_created"
    );
  },
};
