const express = require("express");
const { body, validationResult } = require("express-validator");
const { Resume } = require("../models");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { uploadResume } = require("../middleware/upload");
const router = express.Router();

// Get user's resumes
router.get(
  "/",
  authenticateToken,
  requireRole(["photographer"]),
  async (req, res) => {
    try {
      const resumes = await Resume.findAll({
        where: { userId: req.user.id },
        order: [
          ["isDefault", "DESC"],
          ["createdAt", "DESC"],
        ],
      });

      res.json({ resumes });
    } catch (error) {
      console.error("Get resumes error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Upload resume
router.post(
  "/",
  authenticateToken,
  requireRole(["photographer"]),
  uploadResume.single("resume"),
  [
    body("title")
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage("Title is required and must be less than 200 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Resume file is required" });
      }

      const { title } = req.body;
      const isDefault = req.body.isDefault === "true";

      // If this is set as default, update others
      if (isDefault) {
        await Resume.update(
          { isDefault: false },
          { where: { userId: req.user.id } }
        );
      }

      const resume = await Resume.create({
        userId: req.user.id,
        title,
        filename: req.file.filename,
        originalName: req.file.originalname,
        url: `/uploads/resumes/${req.file.filename}`,
        size: req.file.size,
        isDefault,
      });

      res.status(201).json({
        message: "Resume uploaded successfully",
        resume,
      });
    } catch (error) {
      console.error("Upload resume error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Update resume
router.put(
  "/:id",
  authenticateToken,
  requireRole(["photographer"]),
  [
    body("title").optional().trim().isLength({ min: 1, max: 200 }),
    body("isDefault").optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const resume = await Resume.findOne({
        where: { id: req.params.id, userId: req.user.id },
      });

      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }

      const { title, isDefault } = req.body;

      // If this is set as default, update others
      if (isDefault) {
        await Resume.update(
          { isDefault: false },
          {
            where: {
              userId: req.user.id,
              id: { [require("sequelize").Op.ne]: resume.id },
            },
          }
        );
      }

      await resume.update({
        title: title || resume.title,
        isDefault: isDefault !== undefined ? isDefault : resume.isDefault,
      });

      res.json({
        message: "Resume updated successfully",
        resume,
      });
    } catch (error) {
      console.error("Update resume error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Delete resume
router.delete(
  "/:id",
  authenticateToken,
  requireRole(["photographer"]),
  async (req, res) => {
    try {
      const resume = await Resume.findOne({
        where: { id: req.params.id, userId: req.user.id },
      });

      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }

      // If this was the default resume, make another one default
      if (resume.isDefault) {
        const otherResume = await Resume.findOne({
          where: {
            userId: req.user.id,
            id: { [require("sequelize").Op.ne]: resume.id },
          },
          order: [["createdAt", "DESC"]],
        });

        if (otherResume) {
          await otherResume.update({ isDefault: true });
        }
      }

      await resume.destroy();

      res.json({ message: "Resume deleted successfully" });
    } catch (error) {
      console.error("Delete resume error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Get single resume
router.get("/:id", async (req, res) => {
  try {
    const resume = await Resume.findByPk(req.params.id);

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    res.json({ resume });
  } catch (error) {
    console.error("Get resume error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
