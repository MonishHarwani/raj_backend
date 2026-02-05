const normalizeComment = (comment) => {
  if (!comment) return null;

  return {
    id: comment.id,
    userId: comment.userId,
    postId: comment.postId,
    content: comment.content,
    parentId: comment.parentId,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,

    // 🔥 SINGLE SOURCE OF TRUTH
    user: comment.commentUser
      ? {
          id: comment.commentUser.id,
          firstName: comment.commentUser.firstName,
          lastName: comment.commentUser.lastName,
          profilePhoto: comment.commentUser.profilePhoto,
        }
      : null,
  };
};

const normalizePost = (post, options = {}) => {
  return {
    id: post.id,
    userId: post.userId,
    title: post.title,
    description: post.description,
    tags: post.tags,
    isJobPost: post.isJobPost,
    jobType: post.jobType,
    budget: post.budget,
    location: post.location,
    eventDate: post.eventDate,
    isActive: post.isActive,
    likesCount: post.likesCount,
    commentsCount: post.commentsCount,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,

    // ✅ like state
    isLikedByCurrentUser: options.isLikedByCurrentUser ?? false,

    // ✅ author
    user: post.postAuthor
      ? {
          id: post.postAuthor.id,
          firstName: post.postAuthor.firstName,
          lastName: post.postAuthor.lastName,
          profilePhoto: post.postAuthor.profilePhoto,
        }
      : null,

    // ✅ photos (THIS WAS MISSING)
    photos: Array.isArray(post.postPhotos)
      ? post.postPhotos
          .sort((a, b) => a.order - b.order)
          .map((p) => ({
            id: p.id,
            url: p.url,
            source: p.source,
            order: p.order,
          }))
      : [],

    // ✅ comments
    comments: Array.isArray(post.postComments)
      ? post.postComments.map(normalizeComment)
      : [],
  };
};

module.exports = { normalizeComment, normalizePost };
