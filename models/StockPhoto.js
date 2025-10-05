const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class StockPhoto extends Model {}

StockPhoto.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    filename: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM(
        "hiring",
        "wedding",
        "portrait",
        "commercial",
        "event",
        "general"
      ),
      allowNull: false,
      defaultValue: "general",
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    mimeType: {
      type: DataTypes.STRING(50),
      defaultValue: "image/jpeg",
    },
    order: {
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
    modelName: "StockPhoto",
    tableName: "stock_photos",
    timestamps: true,
    indexes: [
      {
        fields: ["category"],
      },
      {
        fields: ["isActive"],
      },
      {
        fields: ["order"],
      },
    ],
  }
);

module.exports = StockPhoto;
