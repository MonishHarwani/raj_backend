const express = require("express");
const router = express.Router();
const { JobApplication, Post, User } = require("../models");
const { authenticateToken } = require("../middleware/auth");
const { body, validationResult } = require("express-validator");
const multer = require("multer");
const path = require("path");

// Configure multer for resume uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/resumes"));
  },
  filename: (req, file, cb) => {
    const filename =
      "resume-" +
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);
    cb(null, filename);
  },
});

const uploadResume = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only PDF, DOC, and DOCX files are allowed!"), false);
    }
  },
});

// Apply for a job
router.post(
  "/apply/:postId",
  authenticateToken,
  uploadResume.single("resume"),
  [
    body("coverLetter")
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage("Cover letter must be less than 2000 characters"),
    body("proposedRate")
      .optional()
      .isNumeric()
      .withMessage("Proposed rate must be a number"),
    body("availability")
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage("Availability must be less than 255 characters"),
    body("portfolioLinks")
      .optional()
      .custom((value) => {
        // If it's already an array, that's good
        if (Array.isArray(value)) {
          return true;
        }
        // If it's a string, try to parse it as JSON
        if (typeof value === "string") {
          try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed);
          } catch (e) {
            throw new Error("Portfolio links must be a valid array");
          }
        }
        throw new Error("Portfolio links must be an array");
      })
      .withMessage("Portfolio links must be an array"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const postId = req.params.postId;
      const applicantId = req.user.id;
      const { coverLetter, proposedRate, availability, portfolioLinks } =
        req.body;

      // Check if post exists and is a job post
      const post = await Post.findByPk(postId);
      if (!post) {
        return res.status(404).json({ message: "Job post not found" });
      }

      if (!post.isJobPost) {
        return res.status(400).json({ message: "This is not a job post" });
      }

      // Check if user already applied
      const existingApplication = await JobApplication.findOne({
        where: { postId, applicantId },
      });

      if (existingApplication) {
        return res
          .status(409)
          .json({ message: "You have already applied for this job" });
      }

      // Create application
      const resumeUrl = req.file
        ? `/uploads/resumes/${req.file.filename}`
        : null;

      const application = await JobApplication.create({
        postId,
        applicantId,
        coverLetter: coverLetter || null,
        proposedRate: proposedRate ? parseFloat(proposedRate) : null,
        availability: availability || null,
        portfolioLinks: portfolioLinks || [],
        resumeUrl,
        status: "pending",
        appliedAt: new Date(),
      });

      // Fetch complete application with user data
      const completeApplication = await JobApplication.findByPk(
        application.id,
        {
          include: [
            {
              model: User,
              as: "jobApplicationApplicant", // Updated alias
              attributes: [
                "id",
                "firstName",
                "lastName",
                "email",
                "profilePhoto",
              ],
            },
          ],
        }
      );

      // Map response to expected format
      const mappedApplication = {
        ...completeApplication.toJSON(),
        applicant: completeApplication.jobApplicationApplicant,
      };

      res.status(201).json({
        message: "Application submitted successfully",
        application: mappedApplication,
      });
    } catch (error) {
      console.error("Apply for job error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Get applications for a specific job (for job poster)
router.get("/job/:postId", authenticateToken, async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id;

    // Check if user owns the job post
    const post = await Post.findOne({
      where: { id: postId, userId, isJobPost: true },
    });

    if (!post) {
      return res
        .status(404)
        .json({ message: "Job post not found or you are not authorized" });
    }

    const applications = await JobApplication.findAll({
      where: { postId },
      include: [
        {
          model: User,
          as: "jobApplicationApplicant", // Updated alias
          attributes: [
            "id",
            "firstName",
            "lastName",
            "email",
            "profilePhoto",
            "bio",
          ],
        },
      ],
      order: [["appliedAt", "DESC"]],
    });

    // Map applications to expected format
    const mappedApplications = applications.map((app) => ({
      ...app.toJSON(),
      applicant: app.jobApplicationApplicant,
    }));

    res.json({ applications: mappedApplications });
  } catch (error) {
    console.error("Get job applications error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get user's applications
router.get("/my-applications", authenticateToken, async (req, res) => {
  try {
    const applicantId = req.user.id;

    const applications = await JobApplication.findAll({
      where: { applicantId },
      include: [
        {
          model: Post,
          as: "jobApplicationPost", // Updated alias
          include: [
            {
              model: User,
              as: "postAuthor", // Updated alias
              attributes: ["id", "firstName", "lastName", "profilePhoto"],
            },
          ],
        },
      ],
      order: [["appliedAt", "DESC"]],
    });

    // Map applications to expected format
    const mappedApplications = applications.map((app) => ({
      ...app.toJSON(),
      post: {
        ...app.jobApplicationPost?.toJSON(),
        user: app.jobApplicationPost?.postAuthor,
      },
    }));

    res.json({ applications: mappedApplications });
  } catch (error) {
    console.error("Get my applications error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update application status (for job poster)
router.patch("/:applicationId/status", authenticateToken, async (req, res) => {
  try {
    const applicationId = req.params.applicationId;
    const { status, notes } = req.body;
    const userId = req.user.id;

    const application = await JobApplication.findByPk(applicationId, {
      include: [
        {
          model: Post,
          as: "jobApplicationPost", // Updated alias
          where: { userId }, // Ensure user owns the job post
        },
      ],
    });

    if (!application) {
      return res
        .status(404)
        .json({ message: "Application not found or you are not authorized" });
    }

    await application.update({
      status,
      notes: notes || application.notes,
      reviewedAt: new Date(),
    });

    // Fetch updated application with all data
    const updatedApplication = await JobApplication.findByPk(applicationId, {
      include: [
        {
          model: Post,
          as: "jobApplicationPost", // Updated alias
          include: [
            {
              model: User,
              as: "postAuthor", // Updated alias
              attributes: ["id", "firstName", "lastName", "profilePhoto"],
            },
          ],
        },
        {
          model: User,
          as: "jobApplicationApplicant", // Updated alias
          attributes: ["id", "firstName", "lastName", "email", "profilePhoto"],
        },
      ],
    });

    // Map response to expected format
    const mappedApplication = {
      ...updatedApplication.toJSON(),
      post: {
        ...updatedApplication.jobApplicationPost?.toJSON(),
        user: updatedApplication.jobApplicationPost?.postAuthor,
      },
      applicant: updatedApplication.jobApplicationApplicant,
    };

    res.json({
      message: "Application status updated successfully",
      application: mappedApplication,
    });
  } catch (error) {
    console.error("Update application status error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Check if user has applied for a job
router.get("/check/:postId", authenticateToken, async (req, res) => {
  try {
    const postId = req.params.postId;
    const applicantId = req.user.id;

    const application = await JobApplication.findOne({
      where: { postId, applicantId },
      attributes: ["id", "status", "appliedAt"],
    });

    res.json({
      hasApplied: !!application,
      application: application || null,
    });
  } catch (error) {
    console.error("Check application error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get application details (for applicant or job poster)
router.get("/:applicationId", authenticateToken, async (req, res) => {
  try {
    const applicationId = req.params.applicationId;
    const userId = req.user.id;

    const application = await JobApplication.findByPk(applicationId, {
      include: [
        {
          model: Post,
          as: "jobApplicationPost", // Updated alias
          include: [
            {
              model: User,
              as: "postAuthor", // Updated alias
              attributes: ["id", "firstName", "lastName", "profilePhoto"],
            },
          ],
        },
        {
          model: User,
          as: "jobApplicationApplicant", // Updated alias
          attributes: [
            "id",
            "firstName",
            "lastName",
            "email",
            "profilePhoto",
            "bio",
          ],
        },
      ],
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Check if user is authorized (either the applicant or the job poster)
    const isApplicant = application.applicantId === userId;
    const isJobPoster = application.jobApplicationPost?.userId === userId;

    if (!isApplicant && !isJobPoster) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this application" });
    }

    // Map response to expected format
    const mappedApplication = {
      ...application.toJSON(),
      post: {
        ...application.jobApplicationPost?.toJSON(),
        user: application.jobApplicationPost?.postAuthor,
      },
      applicant: application.jobApplicationApplicant,
    };

    res.json({ application: mappedApplication });
  } catch (error) {
    console.error("Get application error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Withdraw application (for applicant)
router.patch(
  "/:applicationId/withdraw",
  authenticateToken,
  async (req, res) => {
    try {
      const applicationId = req.params.applicationId;
      const userId = req.user.id;

      const application = await JobApplication.findOne({
        where: { id: applicationId, applicantId: userId },
      });

      if (!application) {
        return res
          .status(404)
          .json({ message: "Application not found or you are not authorized" });
      }

      if (application.status === "withdrawn") {
        return res
          .status(400)
          .json({ message: "Application is already withdrawn" });
      }

      await application.update({
        status: "withdrawn",
        reviewedAt: new Date(),
      });

      res.json({
        message: "Application withdrawn successfully",
        application: application.toJSON(),
      });
    } catch (error) {
      console.error("Withdraw application error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Get application statistics for a job (for job poster)
router.get("/stats/:postId", authenticateToken, async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id;

    // Check if user owns the job post
    const post = await Post.findOne({
      where: { id: postId, userId, isJobPost: true },
    });

    if (!post) {
      return res
        .status(404)
        .json({ message: "Job post not found or you are not authorized" });
    }

    const stats = await JobApplication.findAll({
      where: { postId },
      attributes: ["status", [require("sequelize").fn("COUNT", "id"), "count"]],
      group: ["status"],
      raw: true,
    });

    const totalApplications = await JobApplication.count({ where: { postId } });

    const formattedStats = {
      total: totalApplications,
      byStatus: {},
    };

    stats.forEach((stat) => {
      formattedStats.byStatus[stat.status] = parseInt(stat.count);
    });

    res.json({ stats: formattedStats });
  } catch (error) {
    console.error("Get application stats error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
