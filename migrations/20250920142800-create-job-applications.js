"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if table exists first
    const tableExists = await queryInterface.sequelize.query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'job_applications' AND TABLE_SCHEMA = DATABASE()",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (tableExists.length === 0) {
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

      // Add indexes only if table was created
      try {
        await queryInterface.addIndex("job_applications", ["postId"], {
          name: "job_applications_post_id",
        });
      } catch (error) {
        console.log("Index job_applications_post_id already exists");
      }

      try {
        await queryInterface.addIndex("job_applications", ["applicantId"], {
          name: "job_applications_applicant_id",
        });
      } catch (error) {
        console.log("Index job_applications_applicant_id already exists");
      }

      try {
        await queryInterface.addIndex("job_applications", ["status"], {
          name: "job_applications_status",
        });
      } catch (error) {
        console.log("Index job_applications_status already exists");
      }

      // Add unique constraint to prevent duplicate applications
      try {
        await queryInterface.addIndex(
          "job_applications",
          ["postId", "applicantId"],
          {
            unique: true,
            name: "unique_post_applicant",
          }
        );
      } catch (error) {
        console.log("Unique constraint unique_post_applicant already exists");
      }
    } else {
      console.log("Table job_applications already exists, skipping creation");
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("job_applications");
  },
};
