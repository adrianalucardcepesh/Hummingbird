const db = require('../database/db-pool'); // Убедитесь, что путь правильный
const { showProfile } = require('../profiles/showProfile');

const createProfileData = async (ctx, data) => {
    let conn;
    try {
        conn = await db.getConnection();

        // Определяем тип файла на основе контекста сообщения
        let fileType = 'unknown';

        if (ctx.message.photo) {
            fileType = 'photo';
        } else if (ctx.message.video) {
            fileType = 'video';
        }

        const params = [
            ctx.from.id, // или ctx.message.from.id в зависимости от вашего контекста
            ctx.from.username,
            data.name,
            data.surname,
            data.age,
            data.info,
            data.search,
            data.goal,
            data.fileId, // Убедитесь, что эти поля существуют в объекте data
            data.filePath, // Убедитесь, что эти поля существуют в объекте data
            fileType
        ];

        const sql = `
            INSERT INTO users
                (telegram_id, username, name, surname, age, info, search, goal, fileId, filePath, fileType)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                username = VALUES(username), 
                name = VALUES(name), 
                surname = VALUES(surname), 
                age = VALUES(age), 
                info = VALUES(info), 
                search = VALUES(search), 
                goal = VALUES(goal), 
                fileId = VALUES(fileId), 
                filePath = VALUES(filePath), 
                fileType = VALUES(fileType);
        `;

        console.log("Вставляемые параметры:", params);

        // Выполняем запрос к базе данных
        await conn.query(sql, params);
        console.log("Данные успешно сохранены в БД.");

    } catch (error) {
        console.error("Ошибка при вставке данных в БД:", error);
        // Обработка ошибки
        throw error;
    } finally {
        // Важно закрыть соединение, когда оно больше не нужно
        if (conn) conn.release();
    }
};

module.exports = {
    createProfileData
};