const mineflayer = require('mineflayer');
const config = require('./config.json');

/**
 * Продвинутый бот с расширенными возможностями
 */

const botName = process.argv[2] || 'SmartBot';

console.log(`Создание продвинутого бота: ${botName}`);

const bot = mineflayer.createBot({
    host: config.server.host,
    port: config.server.port,
    username: botName,
    version: config.server.version,
    auth: 'offline'
});

// Статистика бота
const stats = {
    messagesReceived: 0,
    messagesReplied: 0,
    deaths: 0,
    jumps: 0
};

bot.on('login', () => {
    console.log(`✓ ${botName} авторизовался`);
});

bot.once('spawn', () => {
    console.log(`✓ ${botName} заспавнился на сервере`);
    console.log(`Позиция: X=${bot.entity.position.x.toFixed(2)}, Y=${bot.entity.position.y.toFixed(2)}, Z=${bot.entity.position.z.toFixed(2)}`);
    
    // Последовательное выполнение команд
    // 1. Логин (через 1 сек)
    setTimeout(() => {
        bot.chat('/login qwer123Q');
        console.log('🔑 Команда: /login qwer123Q');
    }, 1000);
    
    // 2. Kit start (через 2.5 сек)
    setTimeout(() => {
        bot.chat('/kit start');
        console.log('📦 Команда: /kit start');
    }, 2500);
    
    // 3. RTP safe (через 4 сек)
    setTimeout(() => {
        bot.chat('/rtp safe');
        console.log('🌍 Команда: /rtp safe');
    }, 4000);
    
    // Приветствие в чате после всех команд
    setTimeout(() => {
        bot.chat('Привет всем! Я готов к работе 🤖');
    }, 6000);
});

// Расширенная обработка чата
bot.on('chat', (username, message) => {
    if (username === bot.username) return;
    
    stats.messagesReceived++;
    console.log(`<${username}> ${message}`);
    
    const msg = message.toLowerCase();
    let responded = false;
    
    // Приветствия
    if (msg.includes('привет') || msg.includes('hello') || msg.includes('hi') || msg.includes('здравствуй')) {
        reply(`Привет, ${username}! 👋`);
        responded = true;
    }
    // Прощания
    else if (msg.includes('пока') || msg.includes('bye') || msg.includes('goodbye')) {
        reply(`До встречи, ${username}! 👋`);
        responded = true;
    }
    // Как дела
    else if (msg.includes('как дела') || msg.includes('как ты') || msg.includes('how are you')) {
        reply('Отлично! Всё работает как надо 😊');
        responded = true;
    }
    // Упоминание имени бота
    else if (msg.includes(botName.toLowerCase())) {
        reply(`${username}, я слушаю! Чем могу помочь?`);
        responded = true;
    }
    // Команды
    else if (msg.startsWith('!')) {
        handleCommand(username, message);
        responded = true;
    }
    // Вопросы о боте
    else if (msg.includes('кто ты') || msg.includes('who are you')) {
        reply(`Я ${botName}, умный бот для сервера DeltaWorld 🤖`);
        responded = true;
    }
    // Спасибо
    else if (msg.includes('спасибо') || msg.includes('thanks') || msg.includes('thank you')) {
        reply(`Пожалуйста, ${username}! 😊`);
        responded = true;
    }
    // Помощь
    else if (msg.includes('помощь') || msg.includes('help') || msg.includes('команды')) {
        reply('Команды: !стат, !прыжок, !инфо, !время, !позиция');
        responded = true;
    }
    
    if (responded) {
        stats.messagesReplied++;
    }
});

// Обработка команд
function handleCommand(username, message) {
    const cmd = message.toLowerCase().trim();
    
    if (cmd === '!стат' || cmd === '!stats') {
        reply(`Статистика: Получено ${stats.messagesReceived} сообщений, Ответов ${stats.messagesReplied}, Смертей ${stats.deaths}`);
    }
    else if (cmd === '!прыжок' || cmd === '!jump') {
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 100);
        stats.jumps++;
        reply('Прыг! 🦘');
    }
    else if (cmd === '!инфо' || cmd === '!info') {
        reply(`Здоровье: ${bot.health}, Голод: ${bot.food}, Уровень: ${bot.experience.level}`);
    }
    else if (cmd === '!время' || cmd === '!time') {
        const time = bot.time.timeOfDay;
        const hours = Math.floor((time / 1000 + 6) % 24);
        reply(`Игровое время: ${hours}:00`);
    }
    else if (cmd === '!позиция' || cmd === '!pos') {
        const pos = bot.entity.position;
        reply(`X: ${pos.x.toFixed(1)}, Y: ${pos.y.toFixed(1)}, Z: ${pos.z.toFixed(1)}`);
    }
    else if (cmd === '!следуй' || cmd === '!follow') {
        reply(`${username}, я иду за тобой!`);
        followPlayer(username);
    }
    else if (cmd === '!стоп' || cmd === '!stop') {
        stopFollowing();
        reply('Остановился!');
    }
    else {
        reply('Неизвестная команда. Напиши "помощь" для списка команд');
    }
}

// Функция для ответа с задержкой
function reply(message) {
    setTimeout(() => {
        bot.chat(message);
    }, 500 + Math.random() * 500); // Случайная задержка 0.5-1 сек
}

// Следование за игроком
let followingPlayer = null;
let followInterval = null;

function followPlayer(username) {
    stopFollowing();
    followingPlayer = username;
    
    followInterval = setInterval(() => {
        const player = bot.players[followingPlayer];
        if (player && player.entity) {
            const target = player.entity.position;
            const myPos = bot.entity.position;
            const distance = myPos.distanceTo(target);
            
            if (distance > 3) {
                bot.lookAt(target);
                bot.setControlState('forward', true);
                if (distance > 10) {
                    bot.setControlState('sprint', true);
                }
            } else {
                bot.setControlState('forward', false);
                bot.setControlState('sprint', false);
            }
        } else {
            stopFollowing();
        }
    }, 100);
}

function stopFollowing() {
    if (followInterval) {
        clearInterval(followInterval);
        followInterval = null;
    }
    followingPlayer = null;
    bot.setControlState('forward', false);
    bot.setControlState('sprint', false);
}

// Автоматическое возрождение
bot.on('death', () => {
    stats.deaths++;
    console.log(`☠ ${botName} умер! (Всего смертей: ${stats.deaths})`);
    setTimeout(() => {
        bot.chat('/respawn');
        setTimeout(() => {
            bot.chat('Я вернулся! 💪');
        }, 1000);
    }, 1000);
});

bot.on('health', () => {
    // Предупреждение о низком здоровье
    if (bot.health < 6 && bot.health > 0) {
        console.log(`⚠ Низкое здоровье: ${bot.health}`);
    }
});

bot.on('kicked', (reason) => {
    console.log(`✗ Выкинут с сервера: ${reason}`);
});

bot.on('error', (err) => {
    console.error(`✗ Ошибка: ${err.message}`);
});

bot.on('end', () => {
    console.log('Соединение закрыто');
    stopFollowing();
});

// Случайное активное движение (если не следуем за игроком)
bot.on('spawn', () => {
    setInterval(() => {
        if (bot.entity && !followingPlayer) {
            // Случайный поворот
            const yaw = Math.random() * Math.PI * 2;
            const pitch = (Math.random() - 0.5) * 0.3;
            bot.look(yaw, pitch, true);
            
            // Останавливаем предыдущие движения
            bot.clearControlStates();
            
            // Случайное действие
            const action = Math.floor(Math.random() * 10);
            
            if (action < 5) {
                // Бежать вперед со спринтом
                bot.setControlState('forward', true);
                bot.setControlState('sprint', true);
            } else if (action < 6) {
                // Бежать и прыгать
                bot.setControlState('forward', true);
                bot.setControlState('sprint', true);
                bot.setControlState('jump', true);
            } else if (action < 7) {
                // Бежать назад
                bot.setControlState('back', true);
            } else if (action < 8) {
                // Бежать влево
                bot.setControlState('left', true);
            } else if (action < 9) {
                // Бежать вправо
                bot.setControlState('right', true);
            } else {
                // Прыгать
                bot.setControlState('jump', true);
            }
            
            // Останавливаем через время
            setTimeout(() => {
                if (!followingPlayer) {
                    bot.clearControlStates();
                }
            }, 1000 + Math.random() * 2500);
        }
    }, 1500 + Math.random() * 2000);
});

// Анти-AFK: регулярные действия каждые 10 секунд
setInterval(() => {
    if (bot.entity && !followingPlayer) {
        const yaw = Math.random() * Math.PI * 2;
        bot.look(yaw, 0, false);
        
        if (Math.random() > 0.8) {
            bot.setControlState('jump', true);
            setTimeout(() => bot.setControlState('jump', false), 100);
        }
    }
}, 10000);

// Ввод команд через консоль
process.stdin.on('data', (data) => {
    const input = data.toString().trim();
    if (input) {
        if (input.startsWith('/')) {
            // Серверная команда
            bot.chat(input);
        } else {
            // Обычное сообщение в чат
            bot.chat(input);
        }
    }
});

console.log('\n=================================');
console.log(`  ${botName} запущен!`);
console.log('=================================');
console.log('Доступные команды в игре:');
console.log('  !стат - статистика бота');
console.log('  !прыжок - бот прыгнет');
console.log('  !инфо - информация о боте');
console.log('  !время - игровое время');
console.log('  !позиция - координаты');
console.log('  !следуй - следовать за вами');
console.log('  !стоп - остановиться');
console.log('\nВы можете писать в чат через консоль.');
console.log('Нажмите Ctrl+C для выхода.\n');
