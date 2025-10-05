"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("job_applications", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      postId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "posts",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      applicantId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      coverLetter: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      proposedRate: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      availability: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      portfolioLinks: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      resumeUrl: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM(
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
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      reviewedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Add indexes
    await queryInterface.addIndex("job_applications", ["postId"]);
    await queryInterface.addIndex("job_applications", ["applicantId"]);
    await queryInterface.addIndex("job_applications", ["status"]);

    // Add unique constraint to prevent duplicate applications
    await queryInterface.addIndex(
      "job_applications",
      ["postId", "applicantId"],
      {
        unique: true,
        name: "unique_post_applicant",
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("job_applications");
  },
};
