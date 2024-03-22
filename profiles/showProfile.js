const db = require('../database/db-pool');
const { Telegraf, Markup, Scenes, session } = require('telegraf');


const showProfile = async (ctx) => {
    function telegramId(ctx) {
        return ctx.from.id;
    }

    let conn;
    let user; // Define the user variable at the function level

    try {
        const userId = telegramId(ctx);

        conn = await db.getConnection();

        [user] = await conn.query('SELECT * FROM users WHERE telegram_id = ?', [userId]);

        if (!user) {
            ctx.reply('❌ Ваша анкета не найдена. Давайте создадим новую анкету!');
            // Create your profile here
            return;
        }
        if (user.showProfile === 0) {
            ctx.reply('❌ Ваша анкета не показывается.');
            return;
        }

        const {name, surname, city, age, info, search, goal} = user;

        let text = "👤 ВАША АНКЕТА:\n\n";
        text += `👤 Имя: ${name}\n\n`;
        text += `👥 Фамилия: ${surname}\n\n`;
        text += `🌎 Город, Страна: ${city}\n\n`;
        text += `📓 Возраст: ${age}\n\n`;
        text += `📬 О себе: ${info}\n\n`;
        text += `🔍 Ищу: ${search}\n\n`;
        text += `💕 Цель знакомства: ${goal}\n\n`;

        ctx.reply(text, {
            reply_markup: {
                keyboard: [
                    [{text: 'Вернуться в главное меню'}],
                ],
                resize_keyboard: true,
                one_time_keyboard: true,
            },
        });
    } catch (err) {
        console.error(err);
        ctx.reply('⚠️ Произошла ошибка при получении анкеты');
    } finally {
        if (conn) conn.end();
    }

    try {
        // Asynchronous block that displays a photo or video after the main data
        if (user && user.fileId && user.fileType) {
            if (user.fileType === 'photo') {
                await ctx.telegram.sendPhoto(ctx.chat.id, user.fileId);
            } else if (user.fileType === 'video') {
                await ctx.telegram.sendVideo(ctx.chat.id, user.fileId);
            }
        }
        // Create a keyboard
        const keyboard = [
            [{text: 'Изменить анкету 📝', callback_data: 'fill_form'}],
            [{text: 'Смотреть анкеты 💎', callback_data: 'search'}],
            // [{text: 'Пожаловаться на анкету 👮🏼', callback_data: 'complain'}],
        ];
        await ctx.telegram.sendMessage(ctx.chat.id, 'Как вам анкета? ', {
            reply_markup: {
                inline_keyboard: keyboard,
            },
        });

    } catch (err) {
        console.error(err);
        ctx.reply('❌ Ошибка при выводе файла');
    }
};

module.exports = {
    showProfile
};