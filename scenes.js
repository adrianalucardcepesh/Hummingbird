const { Telegraf, Markup, Scenes, session } = require('telegraf');
const axios = require('axios');
const db = require('./database/db-pool');
const { createAndShowProfile } = require('./profiles/createAndShowProfile.js');
const { insertOrUpdateGender } = require('./insertOrUpdateGender')
const { insertOrUpdateGenderSearch } = require('./insertOrUpdateGender')





const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');


function createScenes(bot) {

    const firstQuestionScene = new Scenes.BaseScene('firstQuestion');

    firstQuestionScene.enter(async (ctx) => {
        let text = 'Что бы составить анкету. Вам нужно ответить на несколько небольших вопросов  💯  : ';
        await ctx.reply(text, {
            reply_markup: {
                keyboard: [
                    [{ text: 'Вернуться в главное меню ' }],
                ],
                resize_keyboard: true,
                one_time_keyboard: true,
            },
        });

        await ctx.reply(
            'Сначала определимся с вашим полом ⚧:',
            Markup.inlineKeyboard([
                Markup.button.callback('Я парень 👨', 'mann'),
                Markup.button.callback('Я девушка 👱‍♀️', 'womann'),
            ])
        );
    });


    firstQuestionScene.action('mann', async (ctx) => {
        const userId = ctx.from.id; // ID пользователя в Telegram
        const gender = 'парень'; // Значение для пола

        await ctx.answerCbQuery();
        await ctx.reply('Вы выбрали "Я парень" 👨');
        await insertOrUpdateGender(userId, gender);

        return ctx.scene.enter('secondQuestion');
    });

    firstQuestionScene.action('womann', async (ctx) => {
        const userId = ctx.from.id; // ID пользователя в Telegram
        const gender = 'девушка'; // Значение для пола

        await ctx.answerCbQuery();
        await ctx.reply('Вы выбрали "Я девушка" 👱‍♀️');
        await insertOrUpdateGender(userId, gender);

        return ctx.scene.enter('secondQuestion');
    });

    const secondQuestionScene = new Scenes.BaseScene('secondQuestion');

    secondQuestionScene.enter(async (ctx) => {
        await ctx.reply("Теперь выберите кого вы ищете:  💕 ", Markup.inlineKeyboard([
            [
                Markup.button.callback('Парня 👨', 'search_mann'),
                Markup.button.callback('Девушку 👱‍♀️', 'search_womann')
            ],
            [
                Markup.button.callback('Любой пол 👤', 'any')
            ],
        ]));
    });

    secondQuestionScene.action('search_mann', async (ctx) => {
        const userId = ctx.from.id; // ID пользователя в Telegram
        const gender_to_search = 'парень'; // Значение для пола

        await ctx.answerCbQuery();
        await ctx.reply(`Вы выбрали: Парня 👨 `);
        await insertOrUpdateGenderSearch(userId, gender_to_search);

        return  ctx.scene.enter('name');
    });

    secondQuestionScene.action('search_womann', async (ctx) => {
        const userId = ctx.from.id; // ID пользователя в Telegram
        const gender_to_search = 'девушка'; // Значение для пола

        await ctx.answerCbQuery();
        await ctx.reply(`Вы выбрали:  Девушку 👱‍♀ `);
        await insertOrUpdateGenderSearch(userId, gender_to_search);

        return ctx.scene.enter('name');
    });

// Обработчик кнопки "Любой пол 👤"
    secondQuestionScene.action('any', async (ctx) => {
        const userId = ctx.from.id; // ID пользователя в Telegram
        const gender_to_search = 'любой'; // Значение для пола


        await ctx.answerCbQuery();
        await ctx.reply(`Вы выбрали: Любой пол 👤 `);
        await insertOrUpdateGenderSearch(userId, gender_to_search);
         ctx.scene.enter('name'); // Переход на сцену ввода имени
    });

    const nameScene = new Scenes.BaseScene('name');
    nameScene.enter((ctx) => ctx.reply('Пожалуйста, введите свое имя:'));
    nameScene.on('text', (ctx) => {
        ctx.session.name = ctx.message.text;
        ctx.scene.enter('surname');
    });



    // Сцена 'surname'
    const surnameScene = new Scenes.BaseScene('surname');
    surnameScene.enter((ctx) => ctx.reply('Введите вашу фамилию:'));
    surnameScene.on('text', (ctx) => {
        ctx.session.surname = ctx.message.text;
        ctx.scene.enter('city');
    });

    const cityScene = new Scenes.BaseScene('city');

    const ITEMS_PER_PAGE = 10; // Define how many items you want per page
    cityScene.enter(async (ctx) => {
        await renderCityPage(ctx, 0); // Start page at 0
    });
    async function renderCityPage(ctx, currentPage) {
        try {
            const response = await axios.get('https://raw.githubusercontent.com/adrianalucardcepesh/russian-cities-json/main/cities.json');
            const cities = response.data.map(city => city.name).sort((a, b) => a.localeCompare(b));

            const CHUNK_SIZE = 10; // Определяем размер части списка городов
            let chunkedCities = [];
            for (let i = 0; i < cities.length; i += CHUNK_SIZE) {
                chunkedCities.push(cities.slice(i, i + CHUNK_SIZE));
            }

            await ctx.reply('Выберите свой город: 🏙');

            let text = 'Чтобы быстрее найти ваш город, напишите его название снизу 🌇\n\nИли впишите первые три-четыре буквы города и нажмите Enter 👇';
            await ctx.reply(text, {
                reply_markup: {
                    keyboard: [
                        [{text: 'Вернуться в главное меню'}],
                    ],
                    resize_keyboard: true,
                    one_time_keyboard: true,
                },
            });

        } catch (error) {
            console.error('Ошибка при получении списка городов:', error);
            await ctx.reply('Произошла ошибка при получении списка городов.');
        }
    }


    cityScene.action(/^city_select_(.+)$/, async (ctx) => {
        const selectedCity = ctx.match[1];
        const telegramId = ctx.from.id; // Поправили название переменной, чтобы оно совпадало с названием поля в БД
        try {
            await insertCityForUser(telegramId, selectedCity);
            await ctx.reply(`Вы выбрали город: ${selectedCity}`);
            await ctx.scene.enter('age');
        } catch (error) {
            console.error('Ошибка при вставке города в базу данных:', error);
            await ctx.reply('Произошла ошибка при сохранении вашего выбора города.');
        }
        await ctx.answerCbQuery();
    });


    async function insertCityForUser(telegramId, selectedCity) {
        let conn;
        try {
            conn = await db.getConnection();
            const query = `
            INSERT INTO users (telegram_id, city)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE city = VALUES(city);
        `;
            const result = await conn.query(query, [telegramId, selectedCity]);
            return result;
        } catch (error) {
            console.error('An error occurred while inserting/updating the city for the user:', error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    }


// Function for rendering search results of cities
    async function searchForCity(searchQuery, ctx) {
        try {
            // Fetch cities list from the API
            const response = await axios.get('https://raw.githubusercontent.com/adrianalucardcepesh/russian-cities-json/main/cities.json');
            const searchResults = response.data
                .filter(city => city.name.toLowerCase().includes(searchQuery.toLowerCase()));

            if (!searchResults.length) {
                await ctx.reply('Не найдено городов, соответствующих запросу. Попробуйте ещё раз.');
            } else {
                // Можно ограничить количество кнопок, если их слишком много
                const cityButtons = searchResults.map((city) =>
                    Markup.button.callback(city.name, `city_select_${city.name}`)
                );

                // Покажите клавиатуру с кнопками городов
                await ctx.reply(
                    'Выберите город из списка:',
                    Markup.inlineKeyboard(cityButtons, { columns: 2 })
                );
            }
        } catch (error) {
            console.error('Error while searching for cities:', error);
            await ctx.reply('Произошла ошибка при поиске города.');
        }
    }

// ...cityScene and renderCityPage code...

    cityScene.on('text', async (ctx) => {
        // Пытаемся найти город
        const searchQuery = ctx.message.text; // Сохраняем введенный пользователем текст.
        await searchForCity(searchQuery, ctx);
    });


// Сцена 'age'
    const ageScene = new Scenes.BaseScene('age');
    ageScene.enter((ctx) => ctx.reply('Введите ваш возраст (от 18 до 60 лет):'));
    ageScene.on('text', (ctx) => {
        const age = Number(ctx.message.text);

        if (isNaN(age)) {
            ctx.reply('Пожалуйста, введите возраст числом (например, 30):');
            return;
        }

        if (age < 18 || age > 60) {
            ctx.reply('Ваш возраст должен быть от 18 до 60 лет.');
            return;
        }

        // Проверка для погрешности в три года
        if (age - 3 < 18 || age + 3 > 60) {
            ctx.reply('Ваш возраст ' + age + ' находится в диапазоне от ' + (age - 3) + ' до ' + (age + 3) + ' лет с учетом погрешности в три года.');
            return;
        }

        ctx.session.age = age;

        // Определение периода возраста с учетом погрешности
        const minRange = age - 3 < 18 ? 18 : age - 3;
        const maxRange = age + 3 > 60 ? 60 : age + 3;

        ctx.reply('Ваш возраст ' + age + ' находится в периоде от ' + minRange + ' до ' + maxRange + ' лет с учетом погрешности в три года.');

        return ctx.scene.enter('info');
    });



// Сцена 'info'
    const infoScene = new Scenes.BaseScene('info');

    infoScene.enter((ctx) => {
        ctx.reply('Напишите немного о себе: 💮: ');
    });

    infoScene.on('text', (ctx) => {
        if (!ctx.message.text) {
            ctx.reply('Эта информация обязательна для заполнения!');
            return;
        }

        ctx.session.info = ctx.message.text;

        return ctx.scene.enter('search');
    });

// Сцена 'search'
    const searchScene = new Scenes.BaseScene('search');
    searchScene.enter((ctx) => ctx.reply('Опишите кратко кого или что вы ищите, например: \n✅\n друга, \n✅\n партнера на вечер, \n✅\n отношения, \n✅\n делового партнера, \n✅\n  товарища по переписке, \n✅\n  работу, \n✅\n  финансовую или моральную помощь, \n✅\n другое и т.д'));
    searchScene.on('text', (ctx) => {
        ctx.session.search = ctx.message.text;
        return ctx.scene.enter('goal');

    });

    const goalScene = new Scenes.BaseScene('goal');
    goalScene.enter((ctx) => ctx.reply('Напишите цель знакомства:'));
    goalScene.on('text', (ctx) => {
        ctx.session.goal = ctx.message.text;
        return ctx.scene.enter('media');
    });


    const mediaScene = new Scenes.BaseScene('media');


    mediaScene.enter((ctx) => {


        ctx.reply('Загрузите своё фото 🖼 или видео 🎥 (mp4) \n \n Макс. размер фото должен составлять не больше - 5 МБ ' +
            '\n Макс. размер видео должен составлять не больше - 50 МБ' +
            '\n \n Внимание! ⚠️ \n \n  Если вы загружаете фото или видео на котором изображение другого человека (т.е. не ваше фото), вы моментально попадаете в черный бан 🚫 нашего бота. \n \n Загрузить можно только одну фотографию или видео! ‍✈️' +
            '\n \n Можете использовать:\n' +
            '\n' +
            '⚧ Свою фотографию \n' +
            '\n' +
            '⚧ Аниме картинку\n' +
            '\n' +
            '⚧ Фотографии на которых нету лиц людей\n' +
            '\n' +
            '⚧ Мемасики\n' +
            '\n' +
            '⚧ Отрывки из фильмов\n' +
            '\n' +
            '⚧ Мем-видео\n' +
            '\n' +
            '⚧ Ваше Tik-Tok видео (mp4)\n' +
            '\n' +
            '⚧ Анимированные стикеры');
    });

    mediaScene.on(['photo', 'video'], async (ctx) => {

        const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // Максимальный размер видео (50 MB)
        const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // Максимальный размер фото (5 МБ)

        const fileId = ctx.message.video ? ctx.message.video.file_id : ctx.message.photo[ctx.message.photo.length - 1].file_id;
        const fileSize = ctx.message.video ? ctx.message.video.file_size : ctx.message.photo[ctx.message.photo.length - 1].file_size;


        const validVideoExtensions = ['mp4'];
        const validPhotoExtensions = ['jpg', 'jpeg', 'png', 'gif'];

        const isVideo = !!ctx.message.video; // Проверяем, является ли файл видео
        const isPhoto = !!ctx.message.photo; // Проверяем, является ли файл фото

        const fileType = isVideo ? 'video' : 'photo';


        if (isVideo) {
            const extension = fileExtension(fileId);
            if (extension && !validVideoExtensions.includes(extension.toLowerCase())) {
                ctx.reply('Формат видео должен быть MP4.');
                return;
            }
        } else if (isPhoto) {
            const extension = fileExtension(fileId);
            if (extension && !validPhotoExtensions.includes(extension.toLowerCase())) {
                ctx.reply('Формат фото должен быть JPG, JPEG, PNG или GIF.');
                return;
            }
        }


        console.log('MAX_VIDEO_SIZE в байтах:', MAX_VIDEO_SIZE);
        console.log('MAX_PHOTO_SIZE в байтах:', MAX_PHOTO_SIZE);
        console.log('Размер загруженного файла в байтах:', fileSize);
        console.log('Размер загруженного файла:', fileSize);

        let errorMessage = null;

        // Проверяем размер файла и формат
        if (fileSize > MAX_PHOTO_SIZE && fileType === 'photo') {
            errorMessage = '\n Внимание! ⚠ \n \n  Макс. размер фото должен составлять не больше - 5 МБ \n \n Загрузить можно только одну фотографию или видео! ‍✈️';
        }
        if (fileSize > MAX_PHOTO_SIZE && fileType === 'video') {
            errorMessage = '\n Внимание! ⚠ \n \n  Макс. размер видео не больше 50 МБ \n \n  Загрузить можно только одну фотографию или видео! ‍✈️';
        }
        if (ctx.session.uploadedFile) {
            ctx.reply('Вы уже загрузили файл. Вы можете загрузить только один файл.');
            return;
        }


        if (errorMessage) {
            ctx.reply(errorMessage);
            await ctx.scene.reenter(); // Повторно вызываем текущую сцену
            // В этом месте вы можете добавить дополнительные инструкции для пользователя
        } else {
            // Если размер и формат файла прошли валидацию, продолжаем его обработку и загрузку в базу данных
            const file = await ctx.telegram.getFile(fileId);
            const url = `https://api.telegram.org/file/6538687089:AAFc5JkevqmFzQNAFt9nSS7iJN68kig_iYQ/${file.file_path}`;
            const response = await fetch(url);
            const buffer = await response.buffer();
            const savedPath = path.join(__dirname, 'downloads', fileId);
            fs.writeFileSync(savedPath, buffer);

            await createAndShowProfile(ctx, fileId, fileType, savedPath, ctx.session);

        }
    });

    const Stage = new Scenes.Stage([
        firstQuestionScene,
        secondQuestionScene,
        nameScene,
        surnameScene,
        cityScene,
        ageScene,
        infoScene,
        searchScene,
        goalScene,
        mediaScene,
    ]);

    bot.use(Stage.middleware());
    return Stage;


}
function checkUploadedFiles(ctx) {
    if (!ctx.session.uploadedFiles) {
        ctx.session.uploadedFiles = [];
    }

    if (ctx.session.uploadedFiles.length > 0) {
        ctx.reply('Вы уже загрузили файл. Вы можете загрузить только один файл.');
        return true;
    }
    return false;
}

const fileExtension = (fileId) => {
    const parts = fileId.split('.');
    if (parts.length > 1) {
        return parts[parts.length - 1].toLowerCase();
    }
    return null;
};

module.exports = {
    createScenes,

};