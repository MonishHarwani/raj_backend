const express = require("express");
const { body, validationResult } = require("express-validator");
const { User, Post, Photo } = require("../models");
const { authenticateToken } = require("../middleware/auth");
const { uploadProfile } = require("../middleware/upload");
const router = express.Router();

// Get user profile
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: [
        "id",
        "firstName",
        "lastName",
        "email",
        "profilePhoto",
        "bio",
        "role",
        "createdAt",
      ],
      include: [
        {
          model: Post,
          as: "userPosts", // Use the updated alias
          where: { isActive: true },
          required: false,
          include: [
            {
              model: Photo,
              as: "postPhotos", // Use the updated alias
              limit: 1,
              order: [["order", "ASC"]],
            },
          ],
          order: [["createdAt", "DESC"]],
          limit: 6,
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Map back to expected property names
    const userData = user.toJSON();
    const mappedUser = {
      ...userData,
      posts: userData.userPosts?.map((post) => ({
        ...post,
        photos: post.postPhotos,
      })),
    };

    res.json({ user: mappedUser });
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update profile
router.put(
  "/profile",
  authenticateToken,
  [
    body("firstName").optional().trim().isLength({ min: 2 }),
    body("lastName").optional().trim().isLength({ min: 2 }),
    body("bio").optional().trim().isLength({ max: 500 }),
    body("location").optional().trim().isLength({ max: 100 }),
    body("phone").optional().trim().isMobilePhone(),
    body("website").optional().isURL(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        firstName,
        lastName,
        bio,
        location,
        phone,
        website,
        specialties,
      } = req.body;

      await req.user.update({
        firstName: firstName || req.user.firstName,
        lastName: lastName || req.user.lastName,
        bio: bio || req.user.bio,
        location: location || req.user.location,
        phone: phone || req.user.phone,
        website: website || req.user.website,
        specialties: specialties || req.user.specialties,
      });

      const updatedUser = await User.findByPk(req.user.id, {
        attributes: { exclude: ["password"] },
      });

      res.json({
        message: "Profile updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Upload profile photo
router.post(
  "/profile-photo",
  authenticateToken,
  uploadProfile.single("photo"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const photoUrl = `/uploads/profiles/${req.file.filename}`;

      await req.user.update({
        profilePhoto: photoUrl,
      });

      res.json({
        message: "Profile photo updated successfully",
        profilePhoto: photoUrl,
      });
    } catch (error) {
      console.error("Upload profile photo error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Search users
router.get("/", async (req, res) => {
  try {
    const {
      role,
      location,
      specialties,
      search,
      page = 1,
      limit = 12,
    } = req.query;

    const offset = (page - 1) * limit;
    const where = { isActive: true };

    if (role) {
      where.role = role;
    }

    if (location) {
      where.location = { [require("sequelize").Op.like]: `%${location}%` };
    }

    if (search) {
      where[require("sequelize").Op.or] = [
        { firstName: { [require("sequelize").Op.like]: `%${search}%` } },
        { lastName: { [require("sequelize").Op.like]: `%${search}%` } },
        { bio: { [require("sequelize").Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: { exclude: ["password"] },
      include: [
        {
          model: Post,
          as: "posts",
          include: [
            {
              model: Photo,
              as: "photos",
              limit: 1,
            },
          ],
          limit: 3,
          order: [["createdAt", "DESC"]],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
    });

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
