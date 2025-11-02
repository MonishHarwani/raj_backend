"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add foreign key constraint for lastMessageId now that messages table exists
    await queryInterface.addConstraint("conversations", {
      fields: ["lastMessageId"],
      type: "foreign key",
      name: "fk_conversations_lastMessageId",
      references: {
        table: "messages",
        field: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    // Add index for lastMessageId
    await queryInterface.addIndex("conversations", ["lastMessageId"], {
      name: "idx_conversations_lastMessageId",
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the foreign key constraint
    await queryInterface.removeConstraint(
      "conversations",
      "fk_conversations_lastMessageId"
    );

    // Remove the index
    await queryInterface.removeIndex(
      "conversations",
      "idx_conversations_lastMessageId"
    );
  },
};
