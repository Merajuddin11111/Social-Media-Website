import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Message = sequelize.define("Message", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    message: { type: DataTypes.TEXT },
    image: { type: DataTypes.STRING },
}, { tableName: "messages", timestamps: true });

export default Message;