import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Story = sequelize.define("Story", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    mediaType: { type: DataTypes.ENUM("image", "video"), allowNull: false },
    media: { type: DataTypes.STRING, allowNull: false },
}, { tableName: "stories", timestamps: true });

export default Story;