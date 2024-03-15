require('dotenv').config();
const { Telegraf, Markup, Scenes, session } = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);
const util = require('util');
const { startCommand } = require ("./keyboards/greatKey");
const { deleteFunction } = require ("./delete")
const { createScenes } = require ('./scenes')
const { getUserProfile } = require ('./profiles/getUserProfile')
const { dateUsers } = require('./DateUsers')
const { sendProfile } = require('./profiles/sendProfile')



bot.use(session());

bot.hears('Вернуться в главное меню', startCommand);
bot.command('start', startCommand);
bot.use((ctx, next) => {
    if (!ctx.session) {
        ctx.session = {};
    }
    if (!ctx.session.profiles) {
        ctx.session.profiles = []; // Инициализируйте массив анкет здесь
    }
    if (ctx.session.currentUserIndex === undefined) {
        ctx.session.currentUserIndex = 0; // Инициализируйте индекс текущего пользователя
    }
    return next()
});




createScenes(bot)



bot.action('fill_form', async (ctx) => {
    try {
        await ctx.answerCbQuery();
        await ctx.scene.enter('firstQuestion');
    } catch (err) {
        console.error("Error responding to callback query:", err);
        // Optionally, inform the user (consider the usability implications)
        await ctx.reply('Oops! There was an issue processing your request.');
    }
});

bot.action('update', (ctx) => {
    startCommand(ctx);
});

bot.action('updater', (ctx) => {
    startCommand(ctx);
});

bot.action('delete', async (ctx) => {
    try {
        await deleteFunction(ctx);
    } catch (err) {
        console.error(err);
        ctx.reply('У вас нету заполненной анкеты.');
    }
});


bot.action('search', async (ctx) => {
    try {
        await ctx.answerCbQuery();


        await dateUsers(ctx);


    } catch (err) {
        console.error("Error responding to callback query:", err);
        await ctx.reply('Oops! There was an issue processing your request.');
    }
});
bot.on('text', (ctx) => {
    if (ctx.session.complainStep === 'waiting_for_marketing') {
        const complaintText = ctx.message.text;
        // Исправлено использование шаблонной строки
        bot.telegram.sendMessage(6247308978, `Запрос рекламы от ${ctx.from.username || ctx.from.id}: ${complaintText}`);
        ctx.reply('Мы отправили ваш запрос в нашу пиар компанию. И свяжемся с вами в ближайшее время!');
        ctx.session.complainStep = null;
    }
});
bot.action('fill_form', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.scene.enter('firstQuestion');
});

bot.action('next', async (ctx) => {
    // Убедитесь, что ctx.session.currentProfileIndex и ctx.session.profiles определены
    if (ctx.session.profiles && typeof ctx.session.currentProfileIndex !== 'undefined') {
        ctx.session.currentProfileIndex++; // Переместиться к следующей анкете
        // Проверяем, не вышли ли мы за пределы списка анкет
        if (ctx.session.currentProfileIndex < ctx.session.profiles.length) {
            await sendProfile(ctx); // Отправить следующую анкету
        } else {
            // Если анкеты закончились, можно отправить сообщение об этом пользователю
            ctx.reply('Больше анкет нет.');
            // Или можно обнулить индекс, чтобы начать с первой анкеты снова
            // ctx.session.currentProfileIndex = 0;
            // await sendProfile(ctx);
        }
    } else {
        // В случае отсутствия анкет или индекса, уведомить пользователя или загрузить анкеты
        ctx.reply('Анкеты не найдены или возникла проблема с их загрузкой. Попробуйте снова.');
    }
});
bot.action('next', async (ctx) => {
    // Убедитесь, что ctx.session.profiles определен
    if (ctx.session.profiles) {
        // Генерируем случайный индекс анкеты
        const randomIndex = Math.floor(Math.random() * ctx.session.profiles.length);

        // Отправляем анкету по случайному индексу
        const randomProfile = ctx.session.profiles[randomIndex];
        await sendProfile(ctx, randomProfile);
    } else {
        // В случае отсутствия анкет, уведомить пользователя или загрузить анкеты
        ctx.reply('Анкеты не найдены или возникла проблема с их загрузкой. Попробуйте снова.');
    }
});

bot.action('like', async (ctx) => {
    const { profiles, currentProfileIndex } = ctx.session;

    if (profiles && Array.isArray(profiles) && currentProfileIndex < profiles.length) {
        const profile = profiles[currentProfileIndex];

        // Проверяем, есть ли у профиля имя пользователя (username)
        if (profile.username) {
            const telegramUrl = `https://t.me/${profile.username}`;
            ctx.reply(`Приятного общения 😼 ${telegramUrl}`);

        } else if (profile.telegram_id) {
            const firstName = `${profile.name} ${profile.surname}`;

            const formattedName = `[${firstName}](tg://user?id=${profile.telegram_id})`;
            const textPredict = "Приятного общения 😼"; // Замените эту строку на ваш текст
            const messageText = `${formattedName}, ${textPredict}`;

            ctx.replyWithMarkdownV2(messageText);

        } else {
            // Если нет ни имени пользователя, ни telegram_id
            ctx.reply('Информация о контакте пользователя отсутствует.');
        }

        let text = `👻`;

        ctx.reply(text, {
            reply_markup: {
                keyboard: [
                    [{text: 'Вернуться в главное меню'}],
                ],
                resize_keyboard: true,
                one_time_keyboard: true,
            },
        });
    }
});

bot.action('complain', (ctx) => {
    ctx.session.complainStep = 'waiting_for_complaint';
    ctx.reply('Пожалуйста, напишите текст вашей жалобы:');
});





bot.launch();


