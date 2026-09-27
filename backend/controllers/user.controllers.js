import { Op } from "sequelize"
import uploadOnCloudinary from "../config/cloudinary.js"
import Notification from "../models/notification.model.js"
import User from "../models/user.model.js"
import Post from "../models/post.model.js"
import Loop from "../models/loop.model.js"
import Story from "../models/story.model.js"
import { PostComment } from "../config/associations.js"
import { getSocketId, io } from "../socket.js"

export const getCurrentUser = async (req, res) => {
    try {
        const userId = req.userId
        const user = await User.findByPk(userId, {
            attributes: { exclude: ["password"] },
            include: [
                {
                    model: Post, as: "posts",
                    include: [
                        { model: User, as: "author", attributes: ["id", "name", "userName", "profileImage"] },
                        { model: PostComment, as: "comments", include: [{ model: User, as: "author", attributes: ["id", "name", "userName", "profileImage"] }] }
                    ]
                },
                { model: Loop, as: "loops", include: [{ model: User, as: "author", attributes: ["id", "name", "userName", "profileImage"] }] },
                { model: Story, as: "story" },
                { model: User, as: "following", attributes: ["id", "name", "userName", "profileImage"] },
            ]
        })
        if (!user) {
            return res.status(400).json({ message: "user not found" })
        }
        return res.status(200).json(user)
    } catch (error) {
        return res.status(500).json({ message: `get current user error ${error}` })
    }
}

export const suggestedUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            where: { id: { [Op.ne]: req.userId } },
            attributes: { exclude: ["password"] }
        })
        return res.status(200).json(users)
    } catch (error) {
        return res.status(500).json({ message: `get suggested user error ${error}` })
    }
}

export const editProfile = async (req, res) => {
    try {
        const { name, userName, bio, profession, gender } = req.body
        const user = await User.findByPk(req.userId, { attributes: { exclude: ["password"] } })
        if (!user) {
            return res.status(400).json({ message: "user not found" })
        }

        const sameUserWithUserName = await User.findOne({ where: { userName } })
        if (sameUserWithUserName && sameUserWithUserName.id != req.userId) {
            return res.status(400).json({ message: "userName already exist" })
        }

        if (req.file) {
            user.profileImage = await uploadOnCloudinary(req.file.path)
        }

        user.name = name
        user.userName = userName
        user.bio = bio
        user.profession = profession
        user.gender = gender
        await user.save()

        return res.status(200).json(user)
    } catch (error) {
        return res.status(500).json({ message: `edit profile error ${error}` })
    }
}

export const getProfile = async (req, res) => {
    try {
        const userName = req.params.userName
        const user = await User.findOne({
            where: { userName },
            attributes: { exclude: ["password"] },
            include: [
                { model: Post, as: "posts", include: [{ model: User, as: "author", attributes: ["id", "name", "userName", "profileImage"] }] },
                { model: Loop, as: "loops", include: [{ model: User, as: "author", attributes: ["id", "name", "userName", "profileImage"] }] },
                { model: User, as: "followers", attributes: ["id", "name", "userName", "profileImage"] },
                { model: User, as: "following", attributes: ["id", "name", "userName", "profileImage"] },
            ]
        })
        if (!user) {
            return res.status(400).json({ message: "user not found" })
        }
        return res.status(200).json(user)
    } catch (error) {
        return res.status(500).json({ message: `get profile error ${error}` })
    }
}

export const follow = async (req, res) => {
    try {
        const currentUserId = req.userId
        const targetUserId = req.params.targetUserId

        if (!targetUserId) {
            return res.status(400).json({ message: "target user is not found" })
        }
        if (currentUserId == targetUserId) {
            return res.status(400).json({ message: "you can not follow yourself." })
        }

        const currentUser = await User.findByPk(currentUserId)
        const targetUser = await User.findByPk(targetUserId)

        if (!currentUser || !targetUser) {
            return res.status(400).json({ message: "user not found" })
        }

        // Check if already following via junction table
        const isFollowing = await currentUser.hasFollowing(targetUser)

        if (isFollowing) {
            await currentUser.removeFollowing(targetUser)
            return res.status(200).json({ following: false, message: "unfollow successfully" })
        } else {
            await currentUser.addFollowing(targetUser)

            const notification = await Notification.create({
                senderId: currentUser.id,
                receiverId: targetUser.id,
                type: "follow",
                message: "started following you"
            })
            const populatedNotification = await Notification.findByPk(notification.id, {
                include: [
                    { model: User, as: "sender", attributes: ["id", "name", "userName", "profileImage"] },
                    { model: User, as: "receiver", attributes: ["id", "name", "userName", "profileImage"] }
                ]
            })
            const receiverSocketId = getSocketId(targetUser.id)
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("newNotification", populatedNotification)
            }
            return res.status(200).json({ following: true, message: "follow successfully" })
        }
    } catch (error) {
        return res.status(500).json({ message: `follow error ${error}` })
    }
}

export const followingList = async (req, res) => {
    try {
        const user = await User.findByPk(req.userId, {
            include: [{ model: User, as: "following", attributes: ["id", "name", "userName", "profileImage"] }]
        })
        return res.status(200).json(user?.following || [])
    } catch (error) {
        return res.status(500).json({ message: `following error ${error}` })
    }
}

export const search = async (req, res) => {
    try {
        const keyWord = req.query.keyWord
        if (!keyWord) {
            return res.status(400).json({ message: "keyword is required" })
        }

        const users = await User.findAll({
            where: {
                [Op.or]: [
                    { userName: { [Op.like]: `%${keyWord}%` } },
                    { name: { [Op.like]: `%${keyWord}%` } }
                ]
            },
            attributes: { exclude: ["password"] }
        })

        return res.status(200).json(users)
    } catch (error) {
        return res.status(500).json({ message: `search error ${error}` })
    }
}

export const getAllNotifications = async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            where: { receiverId: req.userId },
            include: [
                { model: User, as: "sender", attributes: ["id", "name", "userName", "profileImage"] },
                { model: User, as: "receiver", attributes: ["id", "name", "userName", "profileImage"] },
                { model: Post, as: "post" },
                { model: Loop, as: "loop" }
            ],
            order: [["createdAt", "DESC"]]
        })
        return res.status(200).json(notifications)
    } catch (error) {
        return res.status(500).json({ message: `get notification error ${error}` })
    }
}

export const markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.body

        if (Array.isArray(notificationId)) {
            await Notification.update(
                { isRead: true },
                { where: { id: notificationId, receiverId: req.userId } }
            )
        } else {
            await Notification.update(
                { isRead: true },
                { where: { id: notificationId, receiverId: req.userId } }
            )
        }
        return res.status(200).json({ message: "marked as read" })
    } catch (error) {
        return res.status(500).json({ message: `read notification error ${error}` })
    }
}