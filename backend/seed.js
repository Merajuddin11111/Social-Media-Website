/**
 * seed.js — Populates the SQLite database with dummy data
 * Uses real public image URLs (Unsplash/Picsum) and sample videos (Google CDN)
 * Run: node seed.js
 */

import dotenv from "dotenv"
dotenv.config()

import sequelize from "./config/db.js"
import "./config/associations.js"
import { PostComment, LoopComment } from "./config/associations.js"

import User from "./models/user.model.js"
import Post from "./models/post.model.js"
import Loop from "./models/loop.model.js"
import Story from "./models/story.model.js"
import Message from "./models/message.model.js"
import Conversation from "./models/conversation.model.js"
import Notification from "./models/notification.model.js"
import bcrypt from "bcryptjs"

// ─────────────────────────────────────────────────────────────
// Seed Data
// ─────────────────────────────────────────────────────────────

const USERS = [
    {
        name: "Aryan Mehta",
        userName: "aryan.vibes",
        email: "aryan@vybe.com",
        bio: "Chasing sunsets & good music 🎵 | Photographer | Delhi",
        profession: "Photographer",
        gender: "Male",
        profileImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80"
    },
    {
        name: "Zara Khan",
        userName: "zara.aesthetic",
        email: "zara@vybe.com",
        bio: "Art director by day, dreamer by night ✨ | Mumbai",
        profession: "Art Director",
        gender: "Female",
        profileImage: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80"
    },
    {
        name: "Rohan Dev",
        userName: "rohan.creates",
        email: "rohan@vybe.com",
        bio: "Building things & breaking limits 💻 | Bangalore",
        profession: "Developer",
        gender: "Male",
        profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80"
    },
    {
        name: "Priya Sharma",
        userName: "priya.spark",
        email: "priya@vybe.com",
        bio: "Travel | Food | Life 🌍 | Living every moment",
        profession: "Travel Blogger",
        gender: "Female",
        profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80"
    },
    {
        name: "Karan Singh",
        userName: "karan.lens",
        email: "karan@vybe.com",
        bio: "Street photography is my therapy 📸 | Kolkata",
        profession: "Videographer",
        gender: "Male",
        profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80"
    },
    {
        name: "Aisha Noor",
        userName: "aisha.glow",
        email: "aisha@vybe.com",
        bio: "Fashion | Beauty | Confidence 💄 | Hyderabad",
        profession: "Fashion Designer",
        gender: "Female",
        profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80"
    },
    {
        name: "Dev Patel",
        userName: "dev.fitness",
        email: "dev@vybe.com",
        bio: "No days off 💪 | Fitness Coach | Pune",
        profession: "Fitness Coach",
        gender: "Male",
        profileImage: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&q=80"
    },
    {
        name: "Neha Gupta",
        userName: "neha.art",
        email: "neha@vybe.com",
        bio: "Every canvas tells a story 🎨 | Artist | Jaipur",
        profession: "Artist",
        gender: "Female",
        profileImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80"
    }
]

const POST_IMAGES = [
    { media: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80", caption: "Golden hour never misses ☀️ #travel #sunset" },
    { media: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80", caption: "Nature is the best filter 🌿 #nature #explore" },
    { media: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80", caption: "Every road leads somewhere beautiful 🛤️ #adventure" },
    { media: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=800&q=80", caption: "Mountains calling and I must go 🏔️ #hiking" },
    { media: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80", caption: "Above the clouds ☁️ #photography #sky" },
    { media: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80", caption: "Food is love made visible 🍜 #foodie #yummy" },
    { media: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80", caption: "Brunch done right 🥞☕ #brunch #weekend" },
    { media: "https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=800&q=80", caption: "City lights 🏙️ feeling the vybe tonight #nightlife" },
    { media: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80", caption: "Urban jungle exploring 🌆 #citylife #architecture" },
    { media: "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=800&q=80", caption: "Beach days are the best days 🏖️ #beach #vibes" },
    { media: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80", caption: "Ocean therapy 🌊 #waves #peace" },
    { media: "https://images.unsplash.com/photo-1556742393-d75f468bfcb0?w=800&q=80", caption: "Coffee and code ☕💻 #devlife #morning" },
    { media: "https://images.unsplash.com/photo-1511988617509-a57c8a288659?w=800&q=80", caption: "Squad goals 👫 #friends #memories" },
    { media: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80", caption: "Summer is a state of mind ☀️ #summer #mood" },
    { media: "https://images.unsplash.com/photo-1543168256-418811576931?w=800&q=80", caption: "New camera, same passion 📷 #photography" },
    { media: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80", caption: "Peaks and valleys 🏔️ #mountains #nature" },
    { media: "https://images.unsplash.com/photo-1468413253160-af00ad72ad7e?w=800&q=80", caption: "Lost in the right direction 🌄 #wander" },
    { media: "https://images.unsplash.com/photo-1490750967868-88df5691cc8f?w=800&q=80", caption: "Blooming every day 🌸 #flowers #spring" },
]

const LOOP_VIDEOS = [
    { media: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4", caption: "That feeling when everything clicks 🔥 #vybe" },
    { media: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", caption: "Escaping the ordinary ✈️ #travel #loop" },
    { media: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", caption: "On fire today 💥 #motivation #grind" },
    { media: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4", caption: "Roads less travelled 🛣️ #adventure #drive" },
    { media: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4", caption: "Living in the moment ⚡ #explore #life" },
    { media: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4", caption: "Joy ride every day 🎢 #fun #loop" },
]

const STORY_IMAGES = [
    "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600&q=80",
    "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=600&q=80",
    "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=600&q=80",
    "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&q=80",
]

const COMMENTS = [
    "Absolutely love this! 🔥",
    "This is incredible 😍",
    "Goals! Totally obsessed 💯",
    "You never disappoint! ❤️",
    "Can't stop looking at this 👀",
    "Saved! This is everything ✨",
    "Okay but this is STUNNING 🌟",
    "More of this please! 🙌",
    "Living for this content 💫",
    "Pure art 🎨",
    "Wow the vibes!! 🎶",
    "This hits different 💥",
]

const MESSAGES_DATA = [
    ["Hey! Loved your latest post 🔥", "Thanks! Been working on that shot for a while 😊"],
    ["Are you coming to the meetup?", "Yes! Can't wait to see everyone ✨"],
    ["Your loops are insane bro!", "Appreciate it, more coming soon 🎬"],
    ["We should collab sometime!", "100%! Let's plan something 🙌"],
    ["That sunset photo was everything 🌅", "The light was perfect that day!"],
]

// ─────────────────────────────────────────────────────────────
// Main seed function
// ─────────────────────────────────────────────────────────────

async function seed() {
    try {
        console.log("🌱 Starting seed...")

        await sequelize.sync({ force: true }) // Drop and recreate tables
        console.log("✅ Tables reset")

        const hashedPw = await bcrypt.hash("password123", 10)

        // 1. Create Users
        const users = []
        for (const u of USERS) {
            const user = await User.create({ ...u, password: hashedPw })
            users.push(user)
        }
        console.log(`✅ Created ${users.length} users`)

        // 2. Create follow relationships (everyone follows everyone in a circular pattern)
        for (let i = 0; i < users.length; i++) {
            const follower = users[i]
            // Each user follows the next 4 users (circular)
            for (let j = 1; j <= 4; j++) {
                const target = users[(i + j) % users.length]
                await follower.addFollowing(target)
            }
        }
        console.log("✅ Created follow relationships")

        // 3. Create Posts (distribute among users)
        const posts = []
        for (let i = 0; i < POST_IMAGES.length; i++) {
            const author = users[i % users.length]
            const post = await Post.create({
                authorId: author.id,
                mediaType: "image",
                media: POST_IMAGES[i].media,
                caption: POST_IMAGES[i].caption
            })
            posts.push(post)
        }
        console.log(`✅ Created ${posts.length} posts`)

        // 4. Add likes to posts (each user likes ~half the posts)
        for (const post of posts) {
            const likers = users.filter((_, idx) => idx % 2 === posts.indexOf(post) % 2)
            for (const liker of likers) {
                if (liker.id !== post.authorId) await post.addLikes(liker)
            }
        }
        console.log("✅ Added post likes")

        // 5. Add comments to posts
        for (const post of posts) {
            const commenters = users.slice(0, 3)
            for (const commenter of commenters) {
                if (commenter.id !== post.authorId) {
                    await PostComment.create({
                        postId: post.id,
                        authorId: commenter.id,
                        message: COMMENTS[Math.floor(Math.random() * COMMENTS.length)]
                    })
                }
            }
        }
        console.log("✅ Added post comments")

        // 6. Create Loops (short videos)
        const loops = []
        for (let i = 0; i < LOOP_VIDEOS.length; i++) {
            const author = users[i % users.length]
            const loop = await Loop.create({
                authorId: author.id,
                media: LOOP_VIDEOS[i].media,
                caption: LOOP_VIDEOS[i].caption
            })
            loops.push(loop)
        }
        console.log(`✅ Created ${loops.length} loops`)

        // 7. Add likes to loops
        for (const loop of loops) {
            const likers = users.filter((_, idx) => idx % 3 !== loops.indexOf(loop) % 3)
            for (const liker of likers) {
                if (liker.id !== loop.authorId) await loop.addLikes(liker)
            }
        }
        console.log("✅ Added loop likes")

        // 8. Add comments to loops
        for (const loop of loops) {
            const commenters = users.slice(0, 2)
            for (const commenter of commenters) {
                if (commenter.id !== loop.authorId) {
                    await LoopComment.create({
                        loopId: loop.id,
                        authorId: commenter.id,
                        message: COMMENTS[Math.floor(Math.random() * COMMENTS.length)]
                    })
                }
            }
        }
        console.log("✅ Added loop comments")

        // 9. Create Stories (for first 4 users)
        for (let i = 0; i < 4; i++) {
            const author = users[i]
            const story = await Story.create({
                authorId: author.id,
                mediaType: "image",
                media: STORY_IMAGES[i]
            })
            author.storyId = story.id
            await author.save()

            // Add a few viewers
            for (let j = 1; j <= 2; j++) {
                const viewer = users[(i + j) % users.length]
                await story.addViewers(viewer)
            }
        }
        console.log("✅ Created stories")

        // 10. Create Notifications
        for (let i = 0; i < posts.length && i < 8; i++) {
            const post = posts[i]
            const sender = users[(i + 1) % users.length]
            if (sender.id !== post.authorId) {
                await Notification.create({
                    senderId: sender.id,
                    receiverId: post.authorId,
                    type: "like",
                    postId: post.id,
                    message: "liked your post"
                })
            }
        }
        // Follow notifications
        for (let i = 0; i < 4; i++) {
            await Notification.create({
                senderId: users[i].id,
                receiverId: users[(i + 1) % users.length].id,
                type: "follow",
                message: "started following you"
            })
        }
        console.log("✅ Created notifications")

        // 11. Create Conversations & Messages
        for (let i = 0; i < MESSAGES_DATA.length; i++) {
            const userA = users[i]
            const userB = users[(i + 1) % users.length]
            const [msgA, msgB] = MESSAGES_DATA[i]

            const conv = await Conversation.create()
            await conv.addParticipants([userA, userB])

            const m1 = await Message.create({ senderId: userA.id, receiverId: userB.id, message: msgA })
            const m2 = await Message.create({ senderId: userB.id, receiverId: userA.id, message: msgB })
            await conv.addMessages([m1, m2])
        }
        console.log("✅ Created conversations & messages")

        console.log("\n🎉 Seed complete! Database is ready.")
        console.log("─────────────────────────────────────")
        console.log("👤 Login with any user:")
        console.log("   Username: aryan.vibes  | Password: password123")
        console.log("   Username: zara.aesthetic | Password: password123")
        console.log("   Username: rohan.creates | Password: password123")
        console.log("   Username: priya.spark   | Password: password123")
        console.log("─────────────────────────────────────")

        process.exit(0)
    } catch (err) {
        console.error("❌ Seed error:", err)
        process.exit(1)
    }
}

seed()
