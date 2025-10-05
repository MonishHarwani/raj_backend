const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class Like extends Model {}

Like.init(
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
  },
  {
    sequelize,
    modelName: "Like",
    tableName: "likes",
    timestamps: true,
    indexes: [
      {
        fields: ["userId", "postId"],
        unique: true,
      },
      {
        fields: ["postId"],
      },
    ],
  }
);

module.exports = Like;
