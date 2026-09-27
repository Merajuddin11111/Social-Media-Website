import uploadOnCloudinary from "../config/cloudinary.js"
import Loop from "../models/loop.model.js"
import Notification from "../models/notification.model.js"
import User from "../models/user.model.js"
import { LoopComment } from "../config/associations.js"
import { getSocketId, io } from "../socket.js"

const loopInclude = [
    { model: User, as: "author", attributes: ["id", "name", "userName", "profileImage"] },
    {
        model: LoopComment, as: "comments",
        include: [{ model: User, as: "author", attributes: ["id", "name", "userName", "profileImage"] }]
    },
    { model: User, as: "likes", attributes: ["id", "name", "userName", "profileImage"] }
]

export const uploadLoop = async (req, res) => {
    try {
        const { caption } = req.body
        let media
        if (req.file) {
            media = await uploadOnCloudinary(req.file.path)
        } else {
            return res.status(400).json({ message: "media is required" })
        }

        const loop = await Loop.create({ caption, media, authorId: req.userId })
        const populatedLoop = await Loop.findByPk(loop.id, { include: loopInclude })
        return res.status(201).json(populatedLoop)
    } catch (error) {
        return res.status(500).json({ message: `uploadloop error ${error}` })
    }
}

export const like = async (req, res) => {
    try {
        const loopId = req.params.loopId
        const loop = await Loop.findByPk(loopId, { include: loopInclude })
        if (!loop) {
            return res.status(400).json({ message: "loop not found" })
        }

        const alreadyLiked = await loop.hasLikes(req.userId)

        if (alreadyLiked) {
            await loop.removeLikes(req.userId)
        } else {
            await loop.addLikes(req.userId)
            if (loop.authorId != req.userId) {
                const notification = await Notification.create({
                    senderId: req.userId,
                    receiverId: loop.authorId,
                    type: "like",
                    loopId: loop.id,
                    message: "liked your loop"
                })
                const populatedNotification = await Notification.findByPk(notification.id, {
                    include: [
                        { model: User, as: "sender", attributes: ["id", "name", "userName", "profileImage"] },
                        { model: User, as: "receiver", attributes: ["id", "name", "userName", "profileImage"] },
                        { model: Loop, as: "loop" }
                    ]
                })
                const receiverSocketId = getSocketId(loop.authorId)
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("newNotification", populatedNotification)
                }
            }
        }

        const updatedLoop = await Loop.findByPk(loopId, { include: loopInclude })
        io.emit("likedLoop", { loopId: updatedLoop.id, likes: updatedLoop.likes })
        return res.status(200).json(updatedLoop)
    } catch (error) {
        return res.status(500).json({ message: `like loop error ${error}` })
    }
}

export const comment = async (req, res) => {
    try {
        const { message } = req.body
        const loopId = req.params.loopId
        const loop = await Loop.findByPk(loopId)
        if (!loop) {
            return res.status(400).json({ message: "loop not found" })
        }

        await LoopComment.create({ loopId: loop.id, authorId: req.userId, message })

        if (loop.authorId != req.userId) {
            const notification = await Notification.create({
                senderId: req.userId,
                receiverId: loop.authorId,
                type: "comment",
                loopId: loop.id,
                message: "commented on your loop"
            })
            const populatedNotification = await Notification.findByPk(notification.id, {
                include: [
                    { model: User, as: "sender", attributes: ["id", "name", "userName", "profileImage"] },
                    { model: User, as: "receiver", attributes: ["id", "name", "userName", "profileImage"] },
                    { model: Loop, as: "loop" }
                ]
            })
            const receiverSocketId = getSocketId(loop.authorId)
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("newNotification", populatedNotification)
            }
        }

        const updatedLoop = await Loop.findByPk(loopId, { include: loopInclude })
        io.emit("commentedLoop", { loopId: updatedLoop.id, comments: updatedLoop.comments })
        return res.status(200).json(updatedLoop)
    } catch (error) {
        return res.status(500).json({ message: `comment loop error ${error}` })
    }
}

export const getAllLoops = async (req, res) => {
    try {
        const loops = await Loop.findAll({ include: loopInclude })
        return res.status(200).json(loops)
    } catch (error) {
        return res.status(500).json({ message: `get all loop error ${error}` })
    }
}