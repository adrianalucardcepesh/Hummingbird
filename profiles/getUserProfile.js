const db = require('../database/db-pool');

const getUserProfile = async (ctx) => {
    function telegramId(ctx) {
        return ctx.from.id;
    }

    let conn;
    let user;

    try {
        const userId = telegramId(ctx);

        conn = await db.getConnection();

        [user] = await conn.query('SELECT * FROM users WHERE telegram_id = ?', [userId]);

        return user; // Возвращаем анкету пользователя

    } catch (err) {
        console.error(err);
        return null; // Если возникла ошибка, возвращаем null
    } finally {
        if (conn) conn.end();
    }
};

module.exports = {
    getUserProfile
}