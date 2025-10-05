const express = require("express");
const router = express.Router();
const { StockPhoto } = require("../models");
const { optionalAuth } = require("../middleware/auth");

// Get all stock photos
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { category, tags } = req.query;
    const where = { isActive: true };

    if (category && category !== "all") {
      where.category = category;
    }

    if (tags) {
      const tagArray = tags.split(",");
      where.tags = {
        [require("sequelize").Op.overlap]: tagArray,
      };
    }

    const stockPhotos = await StockPhoto.findAll({
      where,
      order: [
        ["order", "ASC"],
        ["createdAt", "DESC"],
      ],
    });

    res.json({
      stockPhotos: stockPhotos.map((photo) => ({
        ...photo.toJSON(),
        fullUrl: `${req.protocol}://${req.get("host")}${photo.url}`,
      })),
    });
  } catch (error) {
    console.error("Get stock photos error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get stock photos by category
router.get("/categories", optionalAuth, async (req, res) => {
  try {
    const categories = await StockPhoto.findAll({
      attributes: [
        "category",
        [require("sequelize").fn("COUNT", "id"), "count"],
      ],
      where: { isActive: true },
      group: ["category"],
      order: [["category", "ASC"]],
    });

    res.json({ categories });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
