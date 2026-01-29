const { query } = require("../config/db.js");

const addNotification = async (message, type = "info", iconName = "Bell") => {
    try {
        await query(
            "INSERT INTO activity.notifications (message, type, icon_name) VALUES ($1, $2, $3)",
            [message, type, iconName]
        );
    } catch (err) {
        console.error("Failed to add notification:", err);
    }   
};

module.exports = { addNotification };