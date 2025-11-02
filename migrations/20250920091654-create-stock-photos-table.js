"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if source column exists before adding
    const tableDescription = await queryInterface.describeTable("photos");

    if (!tableDescription.source) {
      await queryInterface.addColumn("photos", "source", {
        type: Sequelize.ENUM("upload", "stock"),
        allowNull: false,
        defaultValue: "upload",
      });
    }

    // Check if stockPhotoId column exists before adding
    if (!tableDescription.stockPhotoId) {
      await queryInterface.addColumn("photos", "stockPhotoId", {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "stock_photos",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });
    }

    // Add indexes if they don't exist
    try {
      await queryInterface.addIndex("photos", ["source"], {
        name: "photos_source",
      });
    } catch (error) {
      console.log("Index photos_source already exists");
    }

    try {
      await queryInterface.addIndex("photos", ["stockPhotoId"], {
        name: "photos_stock_photo_id",
      });
    } catch (error) {
      console.log("Index photos_stock_photo_id already exists");
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    try {
      await queryInterface.removeIndex("photos", "photos_source");
    } catch (error) {
      console.log("Index photos_source already removed or does not exist");
    }

    try {
      await queryInterface.removeIndex("photos", "photos_stock_photo_id");
    } catch (error) {
      console.log(
        "Index photos_stock_photo_id already removed or does not exist"
      );
    }

    // Remove columns
    try {
      await queryInterface.removeColumn("photos", "stockPhotoId");
    } catch (error) {
      console.log("Column stockPhotoId already removed or does not exist");
    }

    try {
      await queryInterface.removeColumn("photos", "source");
    } catch (error) {
      console.log("Column source already removed or does not exist");
    }
  },
};
