import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const User = sequelize.define("User", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    userName: { type: DataTypes.STRING, allowNull: false, unique: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    profileImage: { type: DataTypes.STRING },
    bio: { type: DataTypes.TEXT },
    profession: { type: DataTypes.STRING },
    gender: { type: DataTypes.STRING },
    resetOtp: { type: DataTypes.STRING },
    otpExpires: { type: DataTypes.DATE },
    isOtpVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
    storyId: { type: DataTypes.INTEGER, allowNull: true },
}, { tableName: "users", timestamps: true });

export default User;