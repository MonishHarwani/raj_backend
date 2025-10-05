const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class Job extends Model {}

Job.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    hirerId: {
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
      allowNull: false,
    },
    jobType: {
      type: DataTypes.ENUM(
        "event",
        "portrait",
        "wedding",
        "commercial",
        "other"
      ),
      allowNull: false,
    },
    budget: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    eventDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    requirements: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("open", "in_progress", "completed", "cancelled"),
      defaultValue: "open",
    },
    applicationsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: "Job",
    tableName: "jobs",
    timestamps: true,
    indexes: [
      {
        fields: ["hirerId"],
      },
      {
        fields: ["jobType"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["createdAt"],
      },
    ],
  }
);

module.exports = Job;
