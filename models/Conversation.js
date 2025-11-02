const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class Conversation extends Model {}

Conversation.init(
  {
    id: {
      type: DataTypes.STRING(100),
      primaryKey: true,
      // Format: "userId1-userId2" where userId1 < userId2
    },
    user1Id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    user2Id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    lastMessageId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "messages",
        key: "id",
      },
    },
    lastMessageAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    user1UnreadCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    user2UnreadCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: "Conversation",
    tableName: "conversations",
    timestamps: true,
    indexes: [
      {
        fields: ["user1Id"],
      },
      {
        fields: ["user2Id"],
      },
      {
        fields: ["lastMessageAt"],
      },
    ],
  }
);

module.exports = Conversation;
