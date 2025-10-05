"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const stockPhotos = [
      // Hiring category
      {
        title: "We're Hiring - Creative Team",
        description: "Professional hiring announcement background",
        filename: "hiring-creative-team.jpg",
        url: "/uploads/stock-photos/hiring/hiring-creative-team.jpg",
        category: "hiring",
        tags: JSON.stringify(["hiring", "job", "creative", "team"]),
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: "Photography Job Opening",
        description: "Perfect for photography job posts",
        filename: "photography-job.jpg",
        url: "/uploads/stock-photos/hiring/photography-job.jpg",
        category: "hiring",
        tags: JSON.stringify(["hiring", "photography", "job", "photographer"]),
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: "Join Our Team",
        description: "Generic join our team background",
        filename: "join-our-team.jpg",
        url: "/uploads/stock-photos/hiring/join-our-team.jpg",
        category: "hiring",
        tags: JSON.stringify(["hiring", "team", "job", "career"]),
        order: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Wedding category
      {
        title: "Wedding Photography Service",
        description: "Beautiful wedding background",
        filename: "wedding-service.jpg",
        url: "/uploads/stock-photos/wedding/wedding-service.jpg",
        category: "wedding",
        tags: JSON.stringify(["wedding", "marriage", "photography", "service"]),
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Portrait category
      {
        title: "Portrait Photography",
        description: "Professional portrait photography background",
        filename: "portrait-service.jpg",
        url: "/uploads/stock-photos/portrait/portrait-service.jpg",
        category: "portrait",
        tags: JSON.stringify([
          "portrait",
          "photography",
          "professional",
          "headshot",
        ]),
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // General category
      {
        title: "Professional Camera Setup",
        description: "Professional photography equipment",
        filename: "camera-setup.jpg",
        url: "/uploads/stock-photos/general/camera-setup.jpg",
        category: "general",
        tags: JSON.stringify([
          "camera",
          "equipment",
          "professional",
          "photography",
        ]),
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await queryInterface.bulkInsert("stock_photos", stockPhotos);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("stock_photos", null, {});
  },
};
