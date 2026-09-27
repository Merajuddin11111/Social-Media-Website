import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Post = sequelize.define("Post", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    mediaType: { type: DataTypes.ENUM("image", "video"), allowNull: false },
    media: { type: DataTypes.STRING, allowNull: false },
    caption: { type: DataTypes.TEXT },
}, { tableName: "posts", timestamps: true });

export default Post;