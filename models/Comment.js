const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class Comment extends Model {}

Comment.init(
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
    postId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "posts",
        key: "id",
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "comments",
        key: "id",
      },
    },
  },
  {
    sequelize,
    modelName: "Comment",
    tableName: "comments",
    timestamps: true,
    indexes: [
      {
        fields: ["postId"],
      },
      {
        fields: ["userId"],
      },
      {
        fields: ["parentId"],
      },
    ],
  }
);

module.exports = Comment;
