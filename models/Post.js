const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class Post extends Model {}

Post.init(
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
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    isJobPost: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    jobType: {
      type: DataTypes.ENUM(
        "event",
        "portrait",
        "wedding",
        "commercial",
        "other"
      ),
      allowNull: true,
    },
    budget: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    eventDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    likesCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    commentsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: "Post",
    tableName: "posts",
    timestamps: true,
    indexes: [
      {
        fields: ["userId"],
      },
      {
        fields: ["isJobPost"],
      },
      {
        fields: ["createdAt"],
      },
    ],
  }
);

module.exports = Post;
