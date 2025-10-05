const { Job, Application, User, Resume } = require("../models");
const { Op } = require("sequelize");

const createJob = async (req, res) => {
  try {
    const {
      title,
      description,
      requirements,
      budget,
      budgetType,
      location,
      isRemote,
      jobType,
      experienceLevel,
      deadline,
      tags,
      maxApplications,
      duration,
      skills,
    } = req.body;

    // Only hirers can create jobs
    if (req.user.role !== "hirer") {
      return res
        .status(403)
        .json({ message: "Only hirers can create job posts" });
    }

    const job = await Job.create({
      userId: req.user.id,
      title,
      description,
      requirements,
      budget,
      budgetType: budgetType || "negotiable",
      location,
      isRemote: isRemote || false,
      jobType,
      experienceLevel,
      deadline,
      tags: tags || [],
      maxApplications,
      duration,
      skills: skills || [],
    });

    const jobWithUser = await Job.findByPk(job.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: [
            "id",
            "firstName",
            "lastName",
            "profilePhoto",
            "role",
            "location",
          ],
        },
      ],
    });

    res.status(201).json({
      message: "Job created successfully",
      job: jobWithUser,
    });
  } catch (error) {
    console.error("Create job error:", error);
    res.status(500).json({ message: "Server error during job creation" });
  }
};

const getJobs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const {
      userId,
      jobType,
      experienceLevel,
      isRemote,
      budgetMin,
      budgetMax,
      search,
      tags,
      status = "open",
    } = req.query;

    const whereClause = { status };

    if (userId) whereClause.userId = userId;
    if (jobType) whereClause.jobType = jobType;
    if (experienceLevel) whereClause.experienceLevel = experienceLevel;
    if (isRemote !== undefined) whereClause.isRemote = isRemote === "true";

    if (budgetMin || budgetMax) {
      whereClause.budget = {};
      if (budgetMin) whereClause.budget[Op.gte] = parseFloat(budgetMin);
      if (budgetMax) whereClause.budget[Op.lte] = parseFloat(budgetMax);
    }

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      whereClause.tags = {
        [Op.contains]: tagArray,
      };
    }

    const jobs = await Job.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "user",
          attributes: [
            "id",
            "firstName",
            "lastName",
            "profilePhoto",
            "role",
            "location",
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    res.json({
      jobs: jobs.rows,
      totalPages: Math.ceil(jobs.count / limit),
      currentPage: page,
      hasMore: page * limit < jobs.count,
      total: jobs.count,
    });
  } catch (error) {
    console.error("Get jobs error:", error);
    res.status(500).json({ message: "Server error during jobs fetch" });
  }
};

const applyToJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const {
      resumeId,
      coverLetter,
      proposedBudget,
      expectedDuration,
      portfolio,
    } = req.body;

    // Only photographers can apply to jobs
    if (req.user.role !== "photographer") {
      return res
        .status(403)
        .json({ message: "Only photographers can apply to jobs" });
    }

    const job = await Job.findByPk(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.status !== "open") {
      return res
        .status(400)
        .json({ message: "Job is not accepting applications" });
    }

    // Check if max applications reached
    if (job.maxApplications && job.applicationsCount >= job.maxApplications) {
      return res
        .status(400)
        .json({ message: "Job has reached maximum applications" });
    }

    // Check if user already applied
    const existingApplication = await Application.findOne({
      where: { userId: req.user.id, jobId },
    });

    if (existingApplication) {
      return res
        .status(400)
        .json({ message: "You have already applied to this job" });
    }

    // Verify resume exists and belongs to user
    const resume = await Resume.findOne({
      where: { id: resumeId, userId: req.user.id },
    });

    if (!resume) {
      return res
        .status(400)
        .json({ message: "Resume not found or does not belong to you" });
    }

    const application = await Application.create({
      userId: req.user.id,
      jobId,
      resumeId,
      coverLetter,
      proposedBudget,
      expectedDuration,
      portfolio: portfolio || [],
    });

    // Increment applications count
    await job.increment("applicationsCount");

    // Create notification for job owner
    const { Notification } = require("../models");
    await Notification.create({
      userId: job.userId,
      type: "application",
      title: "New Job Application",
      message: `${req.user.firstName} applied to your job: ${job.title}`,
      data: {
        jobId: job.id,
        applicationId: application.id,
        applicantId: req.user.id,
      },
      actionUrl: `/jobs/${job.id}/applications`,
    });

    const applicationWithDetails = await Application.findByPk(application.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: [
            "id",
            "firstName",
            "lastName",
            "profilePhoto",
            "location",
          ],
        },
        { model: Resume, as: "resume" },
      ],
    });

    res.status(201).json({
      message: "Application submitted successfully",
      application: applicationWithDetails,
    });
  } catch (error) {
    console.error("Apply to job error:", error);
    res.status(500).json({ message: "Server error during job application" });
  }
};

module.exports = {
  createJob,
  getJobs,
  applyToJob,
  // ... other job-related functions
};
