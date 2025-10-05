const express = require("express");
const { body, validationResult } = require("express-validator");
const {
  Post,
  Photo,
  User,
  Like,
  Comment,
  JobApplication,
} = require("../models");
const { authenticateToken } = require("../middleware/auth");
const { uploadPhoto } = require("../middleware/upload");
const router = express.Router();

// Get all posts
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, userId, tags, isJobPost } = req.query;
    const currentUserId = req.user?.id;

    const offset = (page - 1) * limit;
    const where = { isActive: true };

    if (userId) {
      where.userId = userId;
    }

    if (isJobPost !== undefined) {
      where.isJobPost = isJobPost === "true";
    }

    if (tags) {
      const tagArray = tags.split(",");
      where.tags = {
        [require("sequelize").Op.overlap]: tagArray,
      };
    }

    const { count, rows: posts } = await Post.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "postAuthor", // Use the updated alias
          attributes: ["id", "firstName", "lastName", "profilePhoto", "role"],
        },
        {
          model: Photo,
          as: "postPhotos", // Use the updated alias
          order: [["order", "ASC"]],
        },
        {
          model: Like,
          as: "postLikes", // Use the updated alias
          attributes: ["id", "userId"],
          include: [
            {
              model: User,
              as: "likeUser", // Use the updated alias
              attributes: ["id", "firstName", "lastName", "profilePhoto"],
            },
          ],
        },
        {
          model: Comment,
          as: "postComments", // Use the updated alias
          attributes: ["id"],
        },
        {
          model: JobApplication,
          as: "postJobApplications", // Use the updated alias
          attributes: ["id"],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
    });

    // Map back to expected property names for frontend
    const postsWithLikeInfo = posts.map((post) => {
      const postData = post.toJSON();

      return {
        ...postData,
        user: postData.postAuthor,
        photos: postData.postPhotos,
        likes: postData.postLikes,
        comments: postData.postComments,
        applications: postData.postJobApplications,
        likesCount: postData.postLikes ? postData.postLikes.length : 0,
        commentsCount: postData.postComments ? postData.postComments.length : 0,
        applicationsCount: postData.postJobApplications
          ? postData.postJobApplications.length
          : 0,
        isLikedByCurrentUser: currentUserId
          ? postData.postLikes?.some((like) => like.userId === currentUserId)
          : false,
      };
    });

    res.json({
      posts: postsWithLikeInfo,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get posts error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get single post
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user?.id;

    const post = await Post.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "postAuthor", // Use the updated alias
          attributes: [
            "id",
            "firstName",
            "lastName",
            "profilePhoto",
            "role",
            "bio",
          ],
        },
        {
          model: Photo,
          as: "postPhotos", // Use the updated alias
          order: [["order", "ASC"]],
        },
        {
          model: Like,
          as: "postLikes", // Use the updated alias
          include: [
            {
              model: User,
              as: "likeUser", // Use the updated alias
              attributes: ["id", "firstName", "lastName", "profilePhoto"],
            },
          ],
        },
        {
          model: Comment,
          as: "postComments", // Use the updated alias
          include: [
            {
              model: User,
              as: "commentUser", // Use the updated alias
              attributes: ["id", "firstName", "lastName", "profilePhoto"],
            },
          ],
          order: [["createdAt", "DESC"]],
        },
      ],
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const postData = post.toJSON();

    // Map back to expected property names
    const postWithLikeInfo = {
      ...postData,
      user: postData.postAuthor,
      photos: postData.postPhotos,
      likes: postData.postLikes,
      comments: postData.postComments?.map((comment) => ({
        ...comment,
        user: comment.commentUser,
      })),
      likesCount: postData.postLikes ? postData.postLikes.length : 0,
      commentsCount: postData.postComments ? postData.postComments.length : 0,
      isLikedByCurrentUser: currentUserId
        ? postData.postLikes?.some((like) => like.userId === currentUserId)
        : false,
    };

    res.json({ post: postWithLikeInfo });
  } catch (error) {
    console.error("Get post error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create post
router.post(
  "/",
  authenticateToken,
  uploadPhoto.array("photos", 10),
  [
    body("title")
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage("Title is required and must be less than 200 characters"),
    body("description")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Description must be less than 1000 characters"),
    body("tags")
      .optional()
      .custom((value) => {
        if (typeof value === "string") {
          try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed);
          } catch (e) {
            throw new Error("Tags must be a valid JSON array");
          }
        }
        return Array.isArray(value);
      })
      .withMessage("Tags must be a valid array"),
    body("stockPhotoIds").optional(),

    body("isJobPost")
      .optional()
      .custom((value) => {
        return (
          value === "true" || value === "false" || typeof value === "boolean"
        );
      })
      .withMessage("isJobPost must be true or false"),
    body("jobType")
      .optional()
      .isIn(["event", "portrait", "wedding", "commercial", "other"])
      .withMessage("Invalid job type"),
    body("budget")
      .optional()
      .custom((value) => {
        if (value === "" || value === null || value === undefined) return true;
        return !isNaN(parseFloat(value)) && isFinite(value);
      })
      .withMessage("Budget must be a valid number"),
    body("location")
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage("Location must be less than 200 characters"),
    body("eventDate")
      .optional()
      .custom((value) => {
        if (!value) return true;
        return !isNaN(Date.parse(value));
      })
      .withMessage("Invalid event date format"),
  ],
  async (req, res) => {
    try {
      console.log("=== CREATE POST REQUEST ===");
      console.log("User ID:", req.user.id);
      console.log("Request body:", req.body);
      console.log("Files received:", req.files ? req.files.length : 0);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const {
        title,
        description,
        tags,
        stockPhotoIds,
        isJobPost,
        jobType,
        budget,
        location,
        eventDate,
      } = req.body;

      // Parse stock photo IDs
      let parsedStockPhotoIds = [];
      if (stockPhotoIds) {
        try {
          parsedStockPhotoIds = JSON.parse(stockPhotoIds);
        } catch (e) {
          console.log("Error parsing stock photo IDs:", e);
        }
      }

      // Validate that we have at least one photo (uploaded or stock)
      const totalPhotos =
        (req.files ? req.files.length : 0) + parsedStockPhotoIds.length;
      if (totalPhotos === 0) {
        return res.status(400).json({
          message: "At least one photo is required",
          error: "NO_PHOTOS",
        });
      }

      // Parse other data
      let parsedTags = [];
      if (tags) {
        try {
          parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
        } catch (error) {
          return res.status(400).json({
            message: "Invalid tags format",
            error: "INVALID_TAGS",
          });
        }
      }

      const isJobPostBool = isJobPost === "true" || isJobPost === true;
      const budgetNum = budget && budget !== "" ? parseFloat(budget) : null;

      // Create post
      const post = await Post.create({
        userId: req.user.id,
        title: title.trim(),
        description: description ? description.trim() : null,
        tags: parsedTags,
        isJobPost: isJobPostBool,
        jobType: isJobPostBool ? jobType : null,
        budget: budgetNum,
        location: location ? location.trim() : null,
        eventDate: eventDate && eventDate !== "" ? new Date(eventDate) : null,
      });

      console.log("Post created with ID:", post.id);

      // Create photos from uploaded files
      const uploadedPhotoPromises = req.files
        ? req.files.map((file, index) => {
            return Photo.create({
              postId: post.id,
              filename: file.filename,
              originalName: file.originalname,
              url: `/uploads/photos/${file.filename}`,
              size: file.size,
              mimeType: file.mimetype,
              order: index,
              source: "upload",
            });
          })
        : [];

      // Create photos from stock photos
      const stockPhotoPromises = parsedStockPhotoIds.map(
        async (stockPhotoId, index) => {
          const stockPhoto = await StockPhoto.findByPk(stockPhotoId);
          if (stockPhoto) {
            return Photo.create({
              postId: post.id,
              filename: stockPhoto.filename,
              originalName: stockPhoto.title,
              url: stockPhoto.url,
              size: 0, // Stock photos don't have size
              mimeType: "image/jpeg", // Default for stock photos
              order: uploadedPhotoPromises.length + index,
              source: "stock",
              stockPhotoId: stockPhotoId,
            });
          }
        }
      );

      const allPhotoPromises = [
        ...uploadedPhotoPromises,
        ...stockPhotoPromises,
      ];
      await Promise.all(allPhotoPromises);

      // Fetch complete post with photos and user
      const completePost = await Post.findByPk(post.id, {
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "firstName", "lastName", "profilePhoto", "role"],
          },
          {
            model: Photo,
            as: "photos",
            order: [["order", "ASC"]],
          },
        ],
      });

      res.status(201).json({
        message: "Post created successfully",
        post: completePost,
      });
    } catch (error) {
      console.error("Create post error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Update post
router.put(
  "/:id",
  authenticateToken,
  [
    body("title").optional().trim().isLength({ min: 1, max: 200 }),
    body("description").optional().trim().isLength({ max: 1000 }),
    body("tags").optional().isArray(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const post = await Post.findOne({
        where: { id: req.params.id, userId: req.user.id },
      });

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const { title, description, tags } = req.body;

      await post.update({
        title: title || post.title,
        description: description || post.description,
        tags: tags || post.tags,
      });

      const updatedPost = await Post.findByPk(post.id, {
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "firstName", "lastName", "profilePhoto", "role"],
          },
          {
            model: Photo,
            as: "photos",
            order: [["order", "ASC"]],
          },
        ],
      });

      res.json({
        message: "Post updated successfully",
        post: updatedPost,
      });
    } catch (error) {
      console.error("Update post error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Delete post
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const post = await Post.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    await post.destroy();

    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Like/Unlike post
router.post("/:id/like", authenticateToken, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const existingLike = await Like.findOne({
      where: { userId: req.user.id, postId: post.id },
    });

    if (existingLike) {
      await existingLike.destroy();
      await post.decrement("likesCount");
      res.json({ message: "Post unliked", liked: false });
    } else {
      await Like.create({
        userId: req.user.id,
        postId: post.id,
      });
      await post.increment("likesCount");
      res.json({ message: "Post liked", liked: true });
    }
  } catch (error) {
    console.error("Like post error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Add comment
router.post(
  "/:id/comments",
  authenticateToken,
  [
    body("content")
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage(
        "Comment content is required and must be less than 500 characters"
      ),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const post = await Post.findByPk(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const { content, parentId } = req.body;

      const comment = await Comment.create({
        userId: req.user.id,
        postId: post.id,
        content,
        parentId: parentId || null,
      });

      await post.increment("commentsCount");

      const commentWithUser = await Comment.findByPk(comment.id, {
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "firstName", "lastName", "profilePhoto"],
          },
        ],
      });

      res.status(201).json({
        message: "Comment added successfully",
        comment: commentWithUser,
      });
    } catch (error) {
      console.error("Add comment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

module.exports = router;
