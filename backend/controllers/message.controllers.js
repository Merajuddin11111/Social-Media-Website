import uploadOnCloudinary from "../config/cloudinary.js"
import Conversation from "../models/conversation.model.js"
import Message from "../models/message.model.js"
import User from "../models/user.model.js"
import { Op } from "sequelize"
import { getSocketId, io } from "../socket.js"

export const sendMessage = async (req, res) => {
    try {
        const senderId = req.userId
        const receiverId = req.params.receiverId
        const { message } = req.body

        let image
        if (req.file) {
            image = await uploadOnCloudinary(req.file.path)
        }

        const newMessage = await Message.create({ senderId, receiverId, message, image })

        // Find conversation that has BOTH participants
        const sender = await User.findByPk(senderId)
        const receiver = await User.findByPk(receiverId)

        // Find all conversations for sender, then check if receiver is also a participant
        const senderConvs = await sender.getConversations()
        let conversation = null
        for (const conv of senderConvs) {
            const hasReceiver = await conv.hasParticipants(receiver)
            if (hasReceiver) { conversation = conv; break }
        }

        if (!conversation) {
            conversation = await Conversation.create()
            await conversation.addParticipants([sender, receiver])
        }
        await conversation.addMessages(newMessage)

        const receiverSocketId = getSocketId(receiverId)
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage)
        }

        return res.status(200).json(newMessage)
    } catch (error) {
        return res.status(500).json({ message: `send Message error ${error}` })
    }
}

export const getAllMessages = async (req, res) => {
    try {
        const senderId = req.userId
        const receiverId = req.params.receiverId

        const sender = await User.findByPk(senderId)
        const receiver = await User.findByPk(receiverId)

        const senderConvs = await sender.getConversations()
        let conversation = null
        for (const conv of senderConvs) {
            const hasReceiver = await conv.hasParticipants(receiver)
            if (hasReceiver) { conversation = conv; break }
        }

        if (!conversation) return res.status(200).json([])

        const messages = await conversation.getMessages({ order: [["createdAt", "ASC"]] })
        return res.status(200).json(messages)
    } catch (error) {
        return res.status(500).json({ message: `get Message error ${error}` })
    }
}

export const getPrevUserChats = async (req, res) => {
    try {
        const currentUserId = req.userId
        const currentUser = await User.findByPk(currentUserId)
        const conversations = await currentUser.getConversations({
            include: [{ model: User, as: "participants", attributes: { exclude: ["password"] } }],
            order: [["updatedAt", "DESC"]]
        })

        const userMap = {}
        conversations.forEach(conv => {
            conv.participants.forEach(user => {
                if (user.id != currentUserId) {
                    userMap[user.id] = user
                }
            })
        })

        const previousUsers = Object.values(userMap)
        return res.status(200).json(previousUsers)
    } catch (error) {
        return res.status(500).json({ message: `prev user error ${error}` })
    }
}