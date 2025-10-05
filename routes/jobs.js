const express = require("express");
const router = express.Router();
const { Job, User, Application, Post, JobApplication } = require("../models");

// Get all jobs
router.get("/", async (req, res) => {
  try {
    const jobs = await Post.findAndCountAll({
      where: {
        isJobPost: true, // or isJobPost: 1 if it's stored as integer
      },
      include: [
        {
          model: User,
          as: "postAuthor", // Use the correct alias from your models/index.js
          attributes: ["id", "firstName", "lastName", "profilePhoto"],
        },
        {
          model: JobApplication, // Use JobApplication instead of Application
          as: "postJobApplications", // Use the correct alias from your models/index.js
          attributes: ["id"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    console.log(jobs);
    // Map back to expected format
    const mappedJobs = jobs.rows.map((job) => ({
      ...job.toJSON(),
      hirer: job.jobHirer,
      applications: job.jobApplications,
      applicationsCount: job.jobApplications?.length || 0,
    }));

    res.json({
      jobs: mappedJobs,
      total: jobs.count,
    });
  } catch (error) {
    console.error("Get jobs error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
