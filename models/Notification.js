const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class Notification extends Model {}

Notification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    type: {
      type: DataTypes.ENUM(
        "like",
        "comment",
        "application",
        "message",
        "job_update"
      ),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    relatedId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    relatedType: {
      type: DataTypes.STRING(50),
      allowNull: true,
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
    modelName: "Notification",
    tableName: "notifications",
    timestamps: true,
    indexes: [
      {
        fields: ["userId"],
      },
      {
        fields: ["isRead"],
      },
      {
        fields: ["createdAt"],
      },
    ],
  }
);

module.exports = Notification;
