const { Telegraf, Markup, Scenes, session } = require('telegraf');



const isAdmin = async (ctx) => {
    const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
    return ['creator', 'administrator'].includes(member.status);
};

const startCommand = async (ctx) => {
    console.log('Пользователь запустил бота');
    try {
        ctx.session = {}; // Обнуляем всю сессию
        ctx.session.genderChoice = null; // Это пример обнуления конкретных данных сессии

        // Отправляем изображение с клавиатурой и текстом приветствия
        const imageUrl = 'https://raw.githubusercontent.com/ospreystudio/photo-gallery/main/logo.jpg';
        await ctx.replyWithPhoto({ url: imageUrl });

        // Проверяем, является ли пользователь администратором
        const userIsAdmin = await isAdmin(ctx);

        // Создаем базовую клавиатуру
        let keyboard = [
            [
                Markup.button.callback('ЗАПОЛНИТЕ АНКЕТУ 🚀', 'fill_form'),
                Markup.button.callback('Смотреть анкеты 💎', 'search'),
            ],
            [
                Markup.button.callback('Изменить свою анкету 📂', 'fill_form'),
                Markup.button.callback('Удалить свою анкету 🗑', 'delete'),
            ],
            [
                Markup.button.callback('Узнать о пиар компании 📣', 'piar')
            ],
                [
                Markup.button.callback('Приватный чат 🎉', 'piarr')
                ]

        ];

        // Добавляем кнопку для администратора, если пользователь является администратором
        if (userIsAdmin) {
            keyboard.push([Markup.button.callback('Администрация 🛡', 'admin')]);
        }

        // Затем отправляем текст приветствия и клавиатуру
        await ctx.reply("Привет, друзья! 💫\n\nВас приветствует бот знакомств Hummingbird 💟\n\nЕсли Вам уже 18 лет, то присоеденяйтесь к нашей соц-сети 🥳 \n\n Если вдруг что-то пойдет не так воспользуйтесь командой /start"  /* сокращено для экономии места */,
            Markup.inlineKeyboard(keyboard)
        );

    } catch (error) {
        console.error('Произошла ошибка:', error);
        ctx.reply('Зарегестрируйте, пожалуйста вашу анкеету! 📰',);
        ctx.reply('Произошла ошибка при загрузке картинки или отправке сообщения.');
    }
};



module.exports = { startCommand };