"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if stock_photos table exists
    const stockPhotosExists = await queryInterface.tableExists("stock_photos");

    if (!stockPhotosExists) {
      await queryInterface.createTable("stock_photos", {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        title: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        filename: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        url: {
          type: Sequelize.STRING(500),
          allowNull: false,
        },
        category: {
          type: Sequelize.ENUM(
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
          type: Sequelize.JSON,
          allowNull: true,
        },
        size: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: 0,
        },
        mimeType: {
          type: Sequelize.STRING(50),
          defaultValue: "image/jpeg",
        },
        order: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
        },
        isActive: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
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
    }

    // Check photos table structure
    const photosTable = await queryInterface.describeTable("photos");

    // Add source column if missing
    if (!photosTable.source) {
      await queryInterface.addColumn("photos", "source", {
        type: Sequelize.ENUM("upload", "stock"),
        allowNull: false,
        defaultValue: "upload",
      });
    }

    // Add stockPhotoId column if missing
    if (!photosTable.stockPhotoId) {
      await queryInterface.addColumn("photos", "stockPhotoId", {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const photosTable = await queryInterface.describeTable("photos");

    if (photosTable.stockPhotoId) {
      await queryInterface.removeColumn("photos", "stockPhotoId");
    }

    if (photosTable.source) {
      await queryInterface.removeColumn("photos", "source");
    }

    const stockPhotosExists = await queryInterface.tableExists("stock_photos");
    if (stockPhotosExists) {
      await queryInterface.dropTable("stock_photos");
    }
  },
};
