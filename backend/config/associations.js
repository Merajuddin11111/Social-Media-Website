/**
 * associations.js
 * Defines all Sequelize associations (relationships) between models.
 * Import this ONCE in index.js after all models are imported.
 */

import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Loop from "../models/loop.model.js";
import Story from "../models/story.model.js";
import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import Notification from "../models/notification.model.js";
import sequelize from "./db.js";
import { DataTypes } from "sequelize";

// ─────────────────────────────────────────────
// Junction tables (many-to-many)
// ─────────────────────────────────────────────

// User followers  (who follows whom)
const UserFollower = sequelize.define("UserFollower", {}, { tableName: "user_followers", timestamps: false });
User.belongsToMany(User, { through: UserFollower, as: "followers", foreignKey: "followingId", otherKey: "followerId" });
User.belongsToMany(User, { through: UserFollower, as: "following", foreignKey: "followerId",  otherKey: "followingId" });

// Post likes
const PostLike = sequelize.define("PostLike", {}, { tableName: "post_likes", timestamps: false });
Post.belongsToMany(User, { through: PostLike, as: "likes", foreignKey: "postId", otherKey: "userId" });
User.belongsToMany(Post, { through: PostLike, as: "likedPosts", foreignKey: "userId", otherKey: "postId" });

// Loop likes
const LoopLike = sequelize.define("LoopLike", {}, { tableName: "loop_likes", timestamps: false });
Loop.belongsToMany(User, { through: LoopLike, as: "likes", foreignKey: "loopId", otherKey: "userId" });
User.belongsToMany(Loop, { through: LoopLike, as: "likedLoops", foreignKey: "userId", otherKey: "loopId" });

// Saved posts
const PostSaved = sequelize.define("PostSaved", {}, { tableName: "post_saved", timestamps: false });
User.belongsToMany(Post, { through: PostSaved, as: "saved", foreignKey: "userId", otherKey: "postId" });
Post.belongsToMany(User, { through: PostSaved, as: "savedByUsers", foreignKey: "postId", otherKey: "userId" });

// Story viewers
const StoryViewer = sequelize.define("StoryViewer", {}, { tableName: "story_viewers", timestamps: false });
Story.belongsToMany(User, { through: StoryViewer, as: "viewers", foreignKey: "storyId", otherKey: "userId" });

// Conversation participants
const ConversationParticipant = sequelize.define("ConversationParticipant", {}, { tableName: "conversation_participants", timestamps: false });
Conversation.belongsToMany(User, { through: ConversationParticipant, as: "participants", foreignKey: "conversationId", otherKey: "userId" });
User.belongsToMany(Conversation, { through: ConversationParticipant, foreignKey: "userId", otherKey: "conversationId" });

// Conversation messages
const ConversationMessage = sequelize.define("ConversationMessage", {}, { tableName: "conversation_messages", timestamps: false });
Conversation.belongsToMany(Message, { through: ConversationMessage, as: "messages", foreignKey: "conversationId", otherKey: "messageId" });

// ─────────────────────────────────────────────
// Post comments  (separate table)
// ─────────────────────────────────────────────
const PostComment = sequelize.define("PostComment", {
    id:      { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    message: { type: DataTypes.TEXT },
}, { tableName: "post_comments", timestamps: true });

Post.hasMany(PostComment, { as: "comments", foreignKey: "postId" });
PostComment.belongsTo(Post,  { foreignKey: "postId" });
PostComment.belongsTo(User,  { as: "author", foreignKey: "authorId" });
User.hasMany(PostComment,    { foreignKey: "authorId" });

// ─────────────────────────────────────────────
// Loop comments  (separate table)
// ─────────────────────────────────────────────
const LoopComment = sequelize.define("LoopComment", {
    id:      { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    message: { type: DataTypes.TEXT },
}, { tableName: "loop_comments", timestamps: true });

Loop.hasMany(LoopComment, { as: "comments", foreignKey: "loopId" });
LoopComment.belongsTo(Loop, { foreignKey: "loopId" });
LoopComment.belongsTo(User, { as: "author", foreignKey: "authorId" });
User.hasMany(LoopComment,   { foreignKey: "authorId" });

// ─────────────────────────────────────────────
// Post / Loop / Story authored by User
// ─────────────────────────────────────────────
User.hasMany(Post,  { as: "posts",  foreignKey: "authorId" });
Post.belongsTo(User, { as: "author", foreignKey: "authorId" });

User.hasMany(Loop,  { as: "loops",  foreignKey: "authorId" });
Loop.belongsTo(User, { as: "author", foreignKey: "authorId" });

User.hasOne(Story, { as: "story", foreignKey: "authorId" });
Story.belongsTo(User, { as: "author", foreignKey: "authorId" });

// ─────────────────────────────────────────────
// Messages: sender / receiver
// ─────────────────────────────────────────────
Message.belongsTo(User, { as: "sender",   foreignKey: "senderId" });
Message.belongsTo(User, { as: "receiver", foreignKey: "receiverId" });
User.hasMany(Message,   { as: "sentMessages",     foreignKey: "senderId" });
User.hasMany(Message,   { as: "receivedMessages", foreignKey: "receiverId" });

// ─────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────
Notification.belongsTo(User, { as: "sender",   foreignKey: "senderId" });
Notification.belongsTo(User, { as: "receiver", foreignKey: "receiverId" });
Notification.belongsTo(Post, { as: "post", foreignKey: "postId" });
Notification.belongsTo(Loop, { as: "loop", foreignKey: "loopId" });
User.hasMany(Notification,   { as: "sentNotifications",     foreignKey: "senderId" });
User.hasMany(Notification,   { as: "receivedNotifications", foreignKey: "receiverId" });

export {
    UserFollower, PostLike, LoopLike, PostSaved,
    StoryViewer, ConversationParticipant, ConversationMessage,
    PostComment, LoopComment
};
