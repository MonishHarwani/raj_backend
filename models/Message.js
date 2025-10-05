const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class Message extends Model {}

Message.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    receiverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    chatId: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Message",
    tableName: "messages",
    timestamps: true,
    indexes: [
      {
        fields: ["senderId"],
      },
      {
        fields: ["receiverId"],
      },
      {
        fields: ["chatId"],
      },
      {
        fields: ["createdAt"],
      },
    ],
  }
);

module.exports = Message;
