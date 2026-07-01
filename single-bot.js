const mineflayer = require('mineflayer');

// Простой скрипт для запуска одного бота
// Использование: node single-bot.js [имя_бота]

const botName = process.argv[2] || 'TestBot';

console.log(`Создание бота: ${botName}`);

const bot = mineflayer.createBot({
    host: 'mc.deltaworld.go-mc.pro',
    // Альтернативный IP: '166.1.144.20'
    port: 25565,
    username: botName,
    version: '1.20.1',
    auth: 'offline'
});

bot.on('login', () => {
    console.log(`✓ Бот ${botName} авторизовался`);
});

bot.once('spawn', () => {
    console.log(`✓ Бот ${botName} заспавнился на сервере`);
    console.log(`Позиция: X=${bot.entity.position.x.toFixed(2)}, Y=${bot.entity.position.y.toFixed(2)}, Z=${bot.entity.position.z.toFixed(2)}`);
    console.log(`Здоровье: ${bot.health}`);
    
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
});

bot.on('chat', (username, message) => {
    if (username === bot.username) return;
    console.log(`<${username}> ${message}`);
    
    const msg = message.toLowerCase();
    
    // Приветствия
    if (msg.includes('привет') || msg.includes('hello') || msg.includes('hi')) {
        setTimeout(() => bot.chat(`Привет, ${username}!`), 500);
    }
    // Упоминание имени бота
    else if (msg.includes(botName.toLowerCase())) {
        setTimeout(() => bot.chat(`${username}, я тут!`), 500);
    }
    // Упоминание бота
    else if (msg.includes('бот') || msg.includes('bot')) {
        setTimeout(() => bot.chat('Слушаю!'), 500);
    }
    // Как дела
    else if (msg.includes('как дела') || msg.includes('как ты')) {
        setTimeout(() => bot.chat('Всё отлично! 👍'), 500);
    }
    // Прощание
    else if (msg.includes('пока') || msg.includes('bye')) {
        setTimeout(() => bot.chat(`До встречи, ${username}!`), 500);
    }
});

bot.on('health', () => {
    console.log(`Здоровье: ${bot.health}, Голод: ${bot.food}`);
});

bot.on('death', () => {
    console.log('☠ Бот умер!');
    setTimeout(() => {
        bot.chat('/respawn');
    }, 1000);
});

bot.on('kicked', (reason) => {
    console.log(`✗ Выкинут с сервера: ${reason}`);
});

bot.on('error', (err) => {
    console.error(`✗ Ошибка: ${err.message}`);
});

bot.on('end', () => {
    console.log('Соединение закрыто');
});

// Случайное активное движение
bot.on('spawn', () => {
    console.log('🏃 Начинаю бегать во все стороны...');
    
    setInterval(() => {
        if (bot.entity) {
            // Случайный поворот в любую сторону
            const yaw = Math.random() * Math.PI * 2;
            const pitch = (Math.random() - 0.5) * 0.3;
            bot.look(yaw, pitch, true);
            
            // Останавливаем все предыдущие движения
            bot.clearControlStates();
            
            // Выбираем случайное действие
            const action = Math.floor(Math.random() * 12);
            
            if (action < 5) {
                // Бежать вперед (спринт)
                bot.setControlState('forward', true);
                bot.setControlState('sprint', true);
            } else if (action < 7) {
                // Бежать вперед и прыгать
                bot.setControlState('forward', true);
                bot.setControlState('sprint', true);
                bot.setControlState('jump', true);
            } else if (action < 8) {
                // Бежать назад
                bot.setControlState('back', true);
            } else if (action < 9) {
                // Бежать влево
                bot.setControlState('left', true);
            } else if (action < 10) {
                // Бежать вправо
                bot.setControlState('right', true);
            } else if (action < 11) {
                // Бежать по диагонали
                bot.setControlState('forward', true);
                bot.setControlState('left', true);
            } else {
                // Просто прыгать
                bot.setControlState('jump', true);
                setTimeout(() => {
                    bot.setControlState('jump', false);
                }, 500);
            }
            
            // Останавливаем движение через случайное время
            setTimeout(() => {
                bot.clearControlStates();
            }, 1000 + Math.random() * 2000);
        }
    }, 1500 + Math.random() * 2000);
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

// Простые команды через консоль
process.stdin.on('data', (data) => {
    const message = data.toString().trim();
    if (message) {
        bot.chat(message);
    }
});

console.log('\nБот запущен! Вы можете писать сообщения в чат через консоль.');
console.log('Нажмите Ctrl+C для выхода.\n');
