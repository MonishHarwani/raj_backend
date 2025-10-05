const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class JobApplication extends Model {}

JobApplication.init(
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
    applicantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
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
    availability: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    portfolioLinks: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    resumeUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "reviewed",
        "accepted",
        "rejected",
        "withdrawn"
      ),
      allowNull: false,
      defaultValue: "pending",
    },
    appliedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "JobApplication",
    tableName: "job_applications",
    timestamps: true,
    indexes: [
      {
        fields: ["postId"],
      },
      {
        fields: ["applicantId"],
      },
      {
        fields: ["status"],
      },
      {
        unique: true,
        fields: ["postId", "applicantId"], // Prevent duplicate applications
      },
    ],
  }
);

module.exports = JobApplication;
