import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Conversation = sequelize.define("Conversation", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
}, { tableName: "conversations", timestamps: true });

export default Conversation;