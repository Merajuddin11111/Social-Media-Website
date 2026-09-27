import uploadOnCloudinary from "../config/cloudinary.js"
import Notification from "../models/notification.model.js"
import Post from "../models/post.model.js"
import User from "../models/user.model.js"
import { PostComment } from "../config/associations.js"
import { getSocketId, io } from "../socket.js"

const postInclude = [
    { model: User, as: "author", attributes: ["id", "name", "userName", "profileImage"] },
    {
        model: PostComment, as: "comments",
        include: [{ model: User, as: "author", attributes: ["id", "name", "userName", "profileImage"] }]
    },
    { model: User, as: "likes", attributes: ["id", "name", "userName", "profileImage"] }
]

export const uploadPost = async (req, res) => {
    try {
        const { caption, mediaType } = req.body
        let media
        if (req.file) {
            media = await uploadOnCloudinary(req.file.path)
        } else {
            return res.status(400).json({ message: "media is required" })
        }

        const post = await Post.create({ caption, media, mediaType, authorId: req.userId })
        const populatedPost = await Post.findByPk(post.id, { include: postInclude })
        return res.status(201).json(populatedPost)
    } catch (error) {
        return res.status(500).json({ message: `uploadPost error ${error}` })
    }
}

export const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.findAll({
            include: postInclude,
            order: [["createdAt", "DESC"]]
        })
        return res.status(200).json(posts)
    } catch (error) {
        return res.status(500).json({ message: `getallpost error ${error}` })
    }
}

export const like = async (req, res) => {
    try {
        const postId = req.params.postId
        const post = await Post.findByPk(postId, { include: postInclude })
        if (!post) {
            return res.status(400).json({ message: "post not found" })
        }

        const alreadyLiked = await post.hasLikes(req.userId)

        if (alreadyLiked) {
            await post.removeLikes(req.userId)
        } else {
            await post.addLikes(req.userId)
            if (post.authorId != req.userId) {
                const notification = await Notification.create({
                    senderId: req.userId,
                    receiverId: post.authorId,
                    type: "like",
                    postId: post.id,
                    message: "liked your post"
                })
                const populatedNotification = await Notification.findByPk(notification.id, {
                    include: [
                        { model: User, as: "sender", attributes: ["id", "name", "userName", "profileImage"] },
                        { model: User, as: "receiver", attributes: ["id", "name", "userName", "profileImage"] },
                        { model: Post, as: "post" }
                    ]
                })
                const receiverSocketId = getSocketId(post.authorId)
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("newNotification", populatedNotification)
                }
            }
        }

        const updatedPost = await Post.findByPk(postId, { include: postInclude })
        io.emit("likedPost", { postId: updatedPost.id, likes: updatedPost.likes })
        return res.status(200).json(updatedPost)
    } catch (error) {
        return res.status(500).json({ message: `likepost error ${error}` })
    }
}

export const comment = async (req, res) => {
    try {
        const { message } = req.body
        const postId = req.params.postId
        const post = await Post.findByPk(postId)
        if (!post) {
            return res.status(400).json({ message: "post not found" })
        }

        await PostComment.create({ postId: post.id, authorId: req.userId, message })

        if (post.authorId != req.userId) {
            const notification = await Notification.create({
                senderId: req.userId,
                receiverId: post.authorId,
                type: "comment",
                postId: post.id,
                message: "commented on your post"
            })
            const populatedNotification = await Notification.findByPk(notification.id, {
                include: [
                    { model: User, as: "sender", attributes: ["id", "name", "userName", "profileImage"] },
                    { model: User, as: "receiver", attributes: ["id", "name", "userName", "profileImage"] },
                    { model: Post, as: "post" }
                ]
            })
            const receiverSocketId = getSocketId(post.authorId)
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("newNotification", populatedNotification)
            }
        }

        const updatedPost = await Post.findByPk(postId, { include: postInclude })
        io.emit("commentedPost", { postId: updatedPost.id, comments: updatedPost.comments })
        return res.status(200).json(updatedPost)
    } catch (error) {
        return res.status(500).json({ message: `comment post error ${error}` })
    }
}

export const saved = async (req, res) => {
    try {
        const postId = req.params.postId
        const user = await User.findByPk(req.userId)

        const alreadySaved = await user.hasSaved(postId)
        if (alreadySaved) {
            await user.removeSaved(postId)
        } else {
            await user.addSaved(postId)
        }

        const updatedUser = await User.findByPk(req.userId, {
            attributes: { exclude: ["password"] },
            include: [{ model: Post, as: "saved" }]
        })
        return res.status(200).json(updatedUser)
    } catch (error) {
        return res.status(500).json({ message: `saved error ${error}` })
    }
}