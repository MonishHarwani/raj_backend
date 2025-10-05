"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add source column to photos table
    await queryInterface.addColumn("photos", "source", {
      type: Sequelize.ENUM("upload", "stock"),
      allowNull: false,
      defaultValue: "upload",
    });

    // Add stockPhotoId column to photos table
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

    // Add indexes for better performance
    await queryInterface.addIndex("photos", ["source"], {
      name: "photos_source",
    });
    await queryInterface.addIndex("photos", ["stockPhotoId"], {
      name: "photos_stock_photo_id",
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove foreign key constraint first
    await queryInterface.removeConstraint("photos", "photos_ibfk_2"); // This might vary

    // Or try a more generic approach
    try {
      // Remove foreign key constraint (name may vary)
      const constraints = await queryInterface.getForeignKeyReferencesForTable(
        "photos"
      );
      for (const constraint of constraints) {
        if (constraint.referencedTableName === "stock_photos") {
          await queryInterface.removeConstraint(
            "photos",
            constraint.constraintName
          );
        }
      }
    } catch (error) {
      console.log(
        "Could not remove foreign key constraint automatically:",
        error.message
      );
    }

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
    await queryInterface.removeColumn("photos", "stockPhotoId");
    await queryInterface.removeColumn("photos", "source");
  },
};
