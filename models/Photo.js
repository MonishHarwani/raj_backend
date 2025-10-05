const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class Photo extends Model {}

Photo.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    postId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "posts",
        key: "id",
      },
    },
    filename: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    originalName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    caption: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    mimeType: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    source: {
      type: DataTypes.ENUM("upload", "stock"),
      allowNull: false,
      defaultValue: "upload",
    },
    stockPhotoId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "stock_photos",
        key: "id",
      },
    },
  },
  {
    sequelize,
    modelName: "Photo",
    tableName: "photos",
    timestamps: true,
    indexes: [
      {
        fields: ["postId"],
      },
      {
        fields: ["order"],
      },
    ],
  }
);

module.exports = Photo;
