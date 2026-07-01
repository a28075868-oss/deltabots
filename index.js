const mineflayer = require('mineflayer');
const config = require('./config.json');
const fs = require('fs');
const yaml = require('js-yaml');

// Массив для хранения всех ботов
const bots = [];

// Загрузка никнеймов из data.yml
let availableNames = [];
try {
    const dataFile = fs.readFileSync('./data.yml', 'utf8');
    const data = yaml.load(dataFile);
    availableNames = data['collected-names'] || [];
    console.log(`✓ Загружено ${availableNames.length} никнеймов из data.yml`);
} catch (error) {
    console.error('✗ Ошибка загрузки data.yml:', error.message);
}

// Функция для получения случайного ника
function getRandomName() {
    if (config.bots.useRandomNames && availableNames.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableNames.length);
        return availableNames[randomIndex];
    }
    return null;
}

/**
 * Создание и подключение бота
 * @param {number} botNumber - Номер бота
 */
function createBot(botNumber) {
    // Используем случайный ник из data.yml или стандартный префикс
    const botName = getRandomName() || `${config.bots.namePrefix}${botNumber}`;
    
    // Случайно выбираем поведение для каждого бота
    const behaviors = ['runner', 'commander', 'chatter'];
    const botBehavior = behaviors[botNumber % behaviors.length];
    
    console.log(`[${botName}] Создание бота... (Поведение: ${botBehavior})`);
    
    const bot = mineflayer.createBot({
        host: config.server.host,
        port: config.server.port,
        username: botName,
        version: config.server.version,
        // Для офлайн серверов (без авторизации)
        auth: 'offline'
    });

    // События подключения
    bot.once('spawn', () => {
        console.log(`[${botName}] ✓ Успешно подключен к серверу!`);
        console.log(`[${botName}] Позиция: ${bot.entity.position}`);
        
        // Последовательное выполнение команд с задержкой
        if (config.auth && config.auth.autoLogin) {
            // 1. Логин (через 1 сек)
            setTimeout(() => {
                bot.chat(`/login ${config.auth.password}`);
                console.log(`[${botName}] 🔑 Команда: /login ${config.auth.password}`);
            }, 1000);
            
            // 2. Kit start (через 2.5 сек)
            setTimeout(() => {
                bot.chat('/kit start');
                console.log(`[${botName}] 📦 Команда: /kit start`);
            }, 2500);
            
            // 3. RTP safe (через 4 сек)
            setTimeout(() => {
                bot.chat('/rtp safe');
                console.log(`[${botName}] 🌍 Команда: /rtp safe`);
            }, 4000);
        }
        
        // Запускаем поведение после всех команд
        setTimeout(() => {
            if (botBehavior === 'commander') {
                startCommanderBehavior(bot, botName);
            } else if (botBehavior === 'chatter') {
                startChatterBehavior(bot, botName);
            } else {
                startRunnerBehavior(bot, botName);
            }
        }, 6000);
    });

    bot.on('login', () => {
        console.log(`[${botName}] Авторизация прошла успешно`);
    });

    // Автоматическое возрождение
    if (config.behavior.autoRespawn) {
        bot.on('death', () => {
            console.log(`[${botName}] ☠ Бот умер, возрождение...`);
            setTimeout(() => {
                bot.chat('/respawn');
            }, 1000);
        });
    }

    // Обработка выкидывания с сервера
    bot.on('kicked', (reason) => {
        console.log(`[${botName}] ✗ Выкинут с сервера: ${reason}`);
        console.log(`[${botName}] Переподключение через ${config.bots.reconnectDelay / 1000} сек...`);
        
        setTimeout(() => {
            createBot(botNumber);
        }, config.bots.reconnectDelay);
    });

    // Обработка ошибок
    bot.on('error', (err) => {
        console.error(`[${botName}] ✗ Ошибка: ${err.message}`);
    });

    bot.on('end', (reason) => {
        console.log(`[${botName}] Отключен: ${reason}`);
        console.log(`[${botName}] Переподключение через ${config.bots.reconnectDelay / 1000} сек...`);
        
        setTimeout(() => {
            createBot(botNumber);
        }, config.bots.reconnectDelay);
    });
    
    // Анти-AFK: регулярные действия каждые 10 секунд
    setInterval(() => {
        if (bot.entity) {
            // Поворачиваем голову чтобы не кикнуло за неактивность
            const yaw = Math.random() * Math.PI * 2;
            bot.look(yaw, 0, false);
            
            // Иногда прыгаем
            if (Math.random() > 0.8) {
                bot.setControlState('jump', true);
                setTimeout(() => bot.setControlState('jump', false), 100);
            }
        }
    }, 10000);

    bots[botNumber - 1] = bot;
    return bot;
}

/**
 * Поведение бота-командира (использует команды)
 */
function startCommanderBehavior(bot, botName) {
    console.log(`[${botName}] 🎮 Режим: Командир (использует команды)`);
    
    const commands = ['/rtp safe', '/spawn', '/home', '/warp'];
    
    // Используем команды периодически (исключаем /kit start и /rtp safe так как они уже выполнены)
    setInterval(() => {
        const cmd = commands[Math.floor(Math.random() * commands.length)];
        bot.chat(cmd);
        console.log(`[${botName}] Выполнена команда: ${cmd}`);
    }, 30000 + Math.random() * 60000); // каждые 30-90 секунд
    
    // Анти-AFK: регулярные минимальные движения
    setInterval(() => {
        if (bot.entity) {
            const yaw = Math.random() * Math.PI * 2;
            bot.look(yaw, 0, false);
            
            if (Math.random() > 0.7) {
                bot.setControlState('jump', true);
                setTimeout(() => bot.setControlState('jump', false), 100);
            }
        }
    }, 12000);
}

/**
 * Поведение бота-болтуна (общается в чате)
 */
function startChatterBehavior(bot, botName) {
    console.log(`[${botName}] 💬 Режим: Болтун (пишет в чат)`);
    
    const messages = [
        'Привет всем!',
        'Как дела?',
        'Что делаете?',
        'Кто-нибудь онлайн?',
        'Приятной игры!',
        'Какой красивый сервер!',
        'Кто хочет поиграть?',
        'Всем хорошего дня!',
        'Кто в выживании?',
        'Эй, есть кто?'
    ];
    
    // Пишет сообщения в чат
    setInterval(() => {
        const msg = messages[Math.floor(Math.random() * messages.length)];
        bot.chat(msg);
        console.log(`[${botName}] Написал: ${msg}`);
    }, 45000 + Math.random() * 75000); // каждые 45-120 секунд
    
    // Первое сообщение
    setTimeout(() => {
        bot.chat('Привет! Как дела?');
    }, 5000);
    
    // Реагирует на других игроков
    bot.on('chat', (username, message) => {
        if (username === bot.username) return;
        
        const msg = message.toLowerCase();
        
        if (msg.includes('привет') || msg.includes('hello') || msg.includes('hi')) {
            setTimeout(() => {
                bot.chat(`Привет, ${username}! 👋`);
                console.log(`[${botName}] Ответил ${username}`);
            }, 2000 + Math.random() * 3000);
        } else if (msg.includes('как дела') || msg.includes('how are you')) {
            setTimeout(() => {
                const responses = ['Отлично!', 'Всё хорошо!', 'Классно!', 'Супер!'];
                bot.chat(responses[Math.floor(Math.random() * responses.length)]);
            }, 2000 + Math.random() * 3000);
        } else if (msg.includes('спасибо') || msg.includes('thanks')) {
            setTimeout(() => {
                bot.chat('Пожалуйста! 😊');
            }, 2000 + Math.random() * 3000);
        }
    });
    
    // Анти-AFK: регулярные минимальные движения
    setInterval(() => {
        if (bot.entity) {
            const yaw = Math.random() * Math.PI * 2;
            bot.look(yaw, 0, false);
            
            if (Math.random() > 0.8) {
                bot.setControlState('jump', true);
                setTimeout(() => bot.setControlState('jump', false), 100);
            }
        }
    }, 15000);
}

/**
 * Поведение бота-бегуна (просто бегает)
 */
function startRunnerBehavior(bot, botName) {
    console.log(`[${botName}] 🏃 Режим: Бегун (активное движение)`);
    
    setInterval(() => {
        if (bot.entity) {
            // Случайный поворот
            const yaw = Math.random() * Math.PI * 2;
            const pitch = (Math.random() - 0.5) * 0.3;
            bot.look(yaw, pitch, true);
            
            // Останавливаем все движения
            bot.clearControlStates();
            
            // Случайное действие
            const action = Math.floor(Math.random() * 12);
            
            if (action < 5) {
                bot.setControlState('forward', true);
                bot.setControlState('sprint', true);
            } else if (action < 7) {
                bot.setControlState('forward', true);
                bot.setControlState('sprint', true);
                bot.setControlState('jump', true);
            } else if (action < 8) {
                bot.setControlState('back', true);
            } else if (action < 9) {
                bot.setControlState('left', true);
            } else if (action < 10) {
                bot.setControlState('right', true);
            } else if (action < 11) {
                bot.setControlState('forward', true);
                bot.setControlState('left', true);
            } else {
                bot.setControlState('jump', true);
                setTimeout(() => {
                    bot.setControlState('jump', false);
                }, 500);
            }
            
            // Останавливаем через время
            setTimeout(() => {
                bot.clearControlStates();
            }, 1000 + Math.random() * 2500);
        }
    }, 1500 + Math.random() * 2000);
    
    // Дополнительная защита от AFK - регулярные минимальные движения
    setInterval(() => {
        if (bot.entity) {
            const yaw = Math.random() * Math.PI * 2;
            bot.look(yaw, 0, false);
        }
    }, 8000);
}

/**
 * Запуск всех ботов
 */
function startBots() {
    console.log('=================================');
    console.log('  Minecraft Bots для DeltaWorld  ');
    console.log('=================================');
    console.log(`Сервер: ${config.server.host}:${config.server.port}`);
    console.log(`Количество ботов: ${config.bots.count}`);
    console.log('=================================\n');

    for (let i = 1; i <= config.bots.count; i++) {
        setTimeout(() => {
            createBot(i);
        }, (i - 1) * config.bots.spawnDelay);
    }
}

// Обработка завершения программы
process.on('SIGINT', () => {
    console.log('\n\nОтключение всех ботов...');
    bots.forEach((bot, index) => {
        if (bot) {
            console.log(`Отключение Bot${index + 1}...`);
            bot.quit();
        }
    });
    process.exit(0);
});

// Запуск
startBots();
