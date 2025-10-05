const express = require("express");
const {
  uploadPhoto,
  uploadResume,
  uploadProfile,
} = require("../middleware/upload");
const { authenticateToken } = require("../middleware/auth");
const router = express.Router();

// Upload single photo
router.post(
  "/photo",
  authenticateToken,
  uploadPhoto.single("photo"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      res.json({
        message: "Photo uploaded successfully",
        file: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          url: `/uploads/photos/${req.file.filename}`,
          size: req.file.size,
          mimeType: req.file.mimetype,
        },
      });
    } catch (error) {
      console.error("Photo upload error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Upload multiple photos
router.post(
  "/photos",
  authenticateToken,
  uploadPhoto.array("photos", 10),
  (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const files = req.files.map((file) => ({
        filename: file.filename,
        originalName: file.originalname,
        url: `/uploads/photos/${file.filename}`,
        size: file.size,
        mimeType: file.mimetype,
      }));

      res.json({
        message: "Photos uploaded successfully",
        files,
      });
    } catch (error) {
      console.error("Photos upload error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Upload resume
router.post(
  "/resume",
  authenticateToken,
  uploadResume.single("resume"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      res.json({
        message: "Resume uploaded successfully",
        file: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          url: `/uploads/resumes/${req.file.filename}`,
          size: req.file.size,
          mimeType: req.file.mimetype,
        },
      });
    } catch (error) {
      console.error("Resume upload error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Upload profile photo
router.post(
  "/profile",
  authenticateToken,
  uploadProfile.single("profile"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      res.json({
        message: "Profile photo uploaded successfully",
        file: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          url: `/uploads/profiles/${req.file.filename}`,
          size: req.file.size,
          mimeType: req.file.mimetype,
        },
      });
    } catch (error) {
      console.error("Profile photo upload error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

module.exports = router;
