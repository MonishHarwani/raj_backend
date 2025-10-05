const sequelize = require("../config/database");

// Import all models
const User = require("./User");
const Post = require("./Post");
const Photo = require("./Photo");
const Resume = require("./Resume");
const Job = require("./Job");
const Application = require("./Application");
const Message = require("./Message");
const Like = require("./Like");
const Comment = require("./Comment");
const Notification = require("./Notification");
const StockPhoto = require("./StockPhoto");
const JobApplication = require("./JobApplication");

// Store models in an object
const models = {
  User,
  Post,
  Photo,
  Resume,
  Job,
  Application,
  Message,
  Like,
  Comment,
  Notification,
  StockPhoto,
  JobApplication,
  sequelize,
};

// Define associations with completely unique aliases
const defineAssociations = () => {
  // User associations - all unique aliases
  models.User.hasMany(models.Post, { foreignKey: "userId", as: "userPosts" });
  models.User.hasMany(models.Resume, {
    foreignKey: "userId",
    as: "userResumes",
  });
  models.User.hasMany(models.Job, { foreignKey: "hirerId", as: "hiredJobs" });
  models.User.hasMany(models.Application, {
    foreignKey: "photographerId",
    as: "oldApplications", // Unique alias
  });
  models.User.hasMany(models.Like, { foreignKey: "userId", as: "userLikes" });
  models.User.hasMany(models.Comment, {
    foreignKey: "userId",
    as: "userComments",
  });
  models.User.hasMany(models.Notification, {
    foreignKey: "userId",
    as: "userNotifications",
  });
  models.User.hasMany(models.JobApplication, {
    foreignKey: "applicantId",
    as: "userJobApplications", // Unique alias
  });

  // Post associations - all unique aliases
  models.Post.belongsTo(models.User, {
    foreignKey: "userId",
    as: "postAuthor",
  });
  models.Post.hasMany(models.Photo, {
    foreignKey: "postId",
    as: "postPhotos",
    onDelete: "CASCADE",
  });
  models.Post.hasMany(models.Like, {
    foreignKey: "postId",
    as: "postLikes",
    onDelete: "CASCADE",
  });
  models.Post.hasMany(models.Comment, {
    foreignKey: "postId",
    as: "postComments",
    onDelete: "CASCADE",
  });
  models.Post.hasMany(models.JobApplication, {
    foreignKey: "postId",
    as: "postJobApplications", // Unique alias
  });

  // Photo associations
  models.Photo.belongsTo(models.Post, {
    foreignKey: "postId",
    as: "photoPost",
  });
  models.Photo.belongsTo(models.StockPhoto, {
    foreignKey: "stockPhotoId",
    as: "photoStock",
  });

  // Resume associations
  models.Resume.belongsTo(models.User, {
    foreignKey: "userId",
    as: "resumeOwner",
  });
  models.Resume.hasMany(models.Application, {
    foreignKey: "resumeId",
    as: "resumeApplications",
  });

  // Job associations
  models.Job.belongsTo(models.User, { foreignKey: "hirerId", as: "jobHirer" });
  models.Job.hasMany(models.Application, {
    foreignKey: "jobId",
    as: "jobApplications",
    onDelete: "CASCADE",
  });

  // Application associations (old model)
  models.Application.belongsTo(models.Job, {
    foreignKey: "jobId",
    as: "applicationJob",
  });
  models.Application.belongsTo(models.User, {
    foreignKey: "photographerId",
    as: "applicationPhotographer",
  });
  models.Application.belongsTo(models.Resume, {
    foreignKey: "resumeId",
    as: "applicationResume",
  });

  // Message associations
  models.Message.belongsTo(models.User, {
    foreignKey: "senderId",
    as: "messageSender",
  });
  models.Message.belongsTo(models.User, {
    foreignKey: "receiverId",
    as: "messageReceiver",
  });

  // Like associations
  models.Like.belongsTo(models.User, { foreignKey: "userId", as: "likeUser" });
  models.Like.belongsTo(models.Post, { foreignKey: "postId", as: "likedPost" });

  // Comment associations
  models.Comment.belongsTo(models.User, {
    foreignKey: "userId",
    as: "commentUser",
  });
  models.Comment.belongsTo(models.Post, {
    foreignKey: "postId",
    as: "commentPost",
  });

  // Notification associations
  models.Notification.belongsTo(models.User, {
    foreignKey: "userId",
    as: "notificationUser",
  });

  // JobApplication associations (new model)
  models.JobApplication.belongsTo(models.Post, {
    foreignKey: "postId",
    as: "jobApplicationPost",
  });
  models.JobApplication.belongsTo(models.User, {
    foreignKey: "applicantId",
    as: "jobApplicationApplicant",
  });

  // StockPhoto associations
  models.StockPhoto.hasMany(models.Photo, {
    foreignKey: "stockPhotoId",
    as: "stockPhotoUsages",
  });
};

// Call the association function
defineAssociations();

module.exports = models;
