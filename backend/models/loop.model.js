import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Loop = sequelize.define("Loop", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    media: { type: DataTypes.STRING, allowNull: false },
    caption: { type: DataTypes.TEXT },
}, { tableName: "loops", timestamps: true });

export default Loop;