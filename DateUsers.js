const db = require('./database/db-pool.js');
const { Telegraf, Markup, Scenes, session } = require('telegraf');
const { sendProfile } = require('./profiles/sendProfile')
const { sortProfilesByDistance } = require('./city/cities')


async function dateUsers(ctx) {
    let conn;
    try {
        // Получаем соединение с базой данных
        conn = await db.getConnection();
        // Текущий пользователь
        const currentUserTelegramId = String(ctx.from.id);

        // Выполняем запрос к базе данных для получения пола пользователя и его предпочтений
        const userInfoQuery = 'SELECT gender, gendersearch FROM users WHERE telegram_id = ?';
        const [userInfoResults] = await conn.query(userInfoQuery, [currentUserTelegramId]); // Правильный способ извлечения первого элемента
        console.log(userInfoResults);
        // Проверяем, была ли найдена информация о пользователе
        if (!userInfoResults) {
            console.log('Текущий пользователь не найден');
            return;
        }

        // Получаем данные о пользователе напрямую, так как уже извлекли первый элемент выше
        const currentUser = userInfoResults;
        console.log(currentUser);



        // Инициализируем запрос для поиска пользователей
        let usersQuery = 'SELECT * FROM users WHERE telegram_id != ?';
        const queryParams = [parseInt(currentUserTelegramId)];
        console.log(queryParams)

// Выполнение SQL запроса

        if (currentUser.gendersearch === 'любой') {
            // Не добавляем дополнительные условия для фильтрации
        } else if (currentUser.gendersearch === 'парень') {
            usersQuery += " AND gender = 'парень'";
        } else if (currentUser.gendersearch === 'девушка') {
            usersQuery += " AND gender = 'девушка'";
        }


// Выводим итоговый запрос и используемые параметры для проверки
        console.log(usersQuery);
        console.log(queryParams);

// Выполняем запрос к базе данных
        const profiles = await conn.query(usersQuery, queryParams);
        console.log(profiles)

// Проверяем, найдены ли пользователи
        if (!profiles || profiles.length === 0) {
            ctx.reply('Нет доступных анкет участников.');
            return;
        }

        ctx.session.profiles = profiles;
        ctx.session.currentProfileIndex = 0;

// Вызываем функцию sendProfile для отправки профиля
        await sortProfilesByDistance()
        await sendProfile(ctx);
    } catch (err) {
        console.error('Ошибка при получении данных из базы данных:', err);
        ctx.reply('Произошла ошибка при получении данных из базы данных.');
    } finally {
        if (conn) conn.end();
    }
}

module.exports = {
    dateUsers
}