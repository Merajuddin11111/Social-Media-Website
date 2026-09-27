import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Notification = sequelize.define("Notification", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    type: { type: DataTypes.ENUM("like", "comment", "follow"), allowNull: false },
    message: { type: DataTypes.STRING, allowNull: false },
    isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: "notifications", timestamps: true });

export default Notification;