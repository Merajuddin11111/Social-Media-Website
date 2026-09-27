import express from "express"
import dotenv from "dotenv"
import cookieParser from "cookie-parser"
import cors from "cors"
import authRouter from "./routes/auth.routes.js"
import userRouter from "./routes/user.routes.js"
import postRouter from "./routes/post.routes.js"
import loopRouter from "./routes/loop.routes.js"
import storyRouter from "./routes/story.routes.js"
import messageRouter from "./routes/message.routes.js"
import { app, server } from "./socket.js"
import sequelize from "./config/db.js"

// ⚠️ Associations MUST be imported before sequelize.sync()
import "./config/associations.js"

import { cleanupExpiredStories } from "./controllers/story.controllers.js"

dotenv.config()

const port = process.env.PORT || 5000

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())

app.use("/api/auth", authRouter)
app.use("/api/user", userRouter)
app.use("/api/post", postRouter)
app.use("/api/loop", loopRouter)
app.use("/api/story", storyRouter)
app.use("/api/message", messageRouter)

server.listen(port, async () => {
    try {
        // Sync all Sequelize models → creates tables if they don't exist
        await sequelize.sync({ alter: false })
        console.log("✅ SQLite database synced (database.db)")

        // Clean up stories older than 24h on startup
        await cleanupExpiredStories()
        console.log("✅ Expired stories cleaned up")

        console.log(`🚀 Server started on port ${port}`)
    } catch (err) {
        console.error("❌ Database sync error:", err)
    }
})
