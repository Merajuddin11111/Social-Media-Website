import uploadOnCloudinary from "../config/cloudinary.js"
import Story from "../models/story.model.js"
import User from "../models/user.model.js"
import { Op } from "sequelize"

const storyInclude = [
    { model: User, as: "author", attributes: ["id", "name", "userName", "profileImage"] },
    { model: User, as: "viewers", attributes: ["id", "name", "userName", "profileImage"] }
]

// Remove stories older than 24 hours (replaces MongoDB TTL index)
export const cleanupExpiredStories = async () => {
    const expiry = new Date(Date.now() - 24 * 60 * 60 * 1000)
    await Story.destroy({ where: { createdAt: { [Op.lt]: expiry } } })
}

export const uploadStory = async (req, res) => {
    try {
        const user = await User.findByPk(req.userId)

        // Delete existing story if any
        if (user.storyId) {
            await Story.destroy({ where: { id: user.storyId } })
            user.storyId = null
            await user.save()
        }

        const { mediaType } = req.body
        let media
        if (req.file) {
            media = await uploadOnCloudinary(req.file.path)
        } else {
            return res.status(400).json({ message: "media is required" })
        }

        const story = await Story.create({ authorId: req.userId, mediaType, media })
        user.storyId = story.id
        await user.save()

        const populatedStory = await Story.findByPk(story.id, { include: storyInclude })
        return res.status(200).json(populatedStory)
    } catch (error) {
        return res.status(500).json({ message: "story upload error" })
    }
}

export const viewStory = async (req, res) => {
    try {
        const storyId = req.params.storyId
        const story = await Story.findByPk(storyId, { include: storyInclude })

        if (!story) {
            return res.status(400).json({ message: "story not found" })
        }

        const alreadyViewed = await story.hasViewers(req.userId)
        if (!alreadyViewed) {
            await story.addViewers(req.userId)
        }

        const updatedStory = await Story.findByPk(storyId, { include: storyInclude })
        return res.status(200).json(updatedStory)
    } catch (error) {
        return res.status(500).json({ message: "story view error" })
    }
}

export const getStoryByUserName = async (req, res) => {
    try {
        const userName = req.params.userName
        const user = await User.findOne({ where: { userName } })
        if (!user) {
            return res.status(400).json({ message: "user not found" })
        }

        const stories = await Story.findAll({
            where: { authorId: user.id },
            include: storyInclude
        })
        return res.status(200).json(stories)
    } catch (error) {
        return res.status(500).json({ message: "story get by userName error" })
    }
}

export const getAllStories = async (req, res) => {
    try {
        const currentUser = await User.findByPk(req.userId, {
            include: [{ model: User, as: "following", attributes: ["id"] }]
        })
        const followingIds = currentUser.following.map(u => u.id)

        const stories = await Story.findAll({
            where: { authorId: followingIds },
            include: storyInclude,
            order: [["createdAt", "DESC"]]
        })
        return res.status(200).json(stories)
    } catch (error) {
        return res.status(500).json({ message: "All story get error" })
    }
}