const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class Application extends Model {}

Application.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    jobId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "jobs",
        key: "id",
      },
    },
    photographerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    resumeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "resumes",
        key: "id",
      },
    },
    coverLetter: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    proposedRate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "reviewed", "accepted", "rejected"),
      defaultValue: "pending",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Application",
    tableName: "applications",
    timestamps: true,
    indexes: [
      {
        fields: ["jobId"],
      },
      {
        fields: ["photographerId"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["jobId", "photographerId"],
        unique: true,
      },
    ],
  }
);

module.exports = Application;
