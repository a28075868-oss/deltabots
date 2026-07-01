const express = require('express');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const mineflayer = require('mineflayer');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Хранилище активных ботов
const activeBots = new Map();
const botLogs = new Map();

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
    const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    if (config.bots.useRandomNames && availableNames.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableNames.length);
        return availableNames[randomIndex];
    }
    return null;
}

// Получить конфигурацию
app.get('/api/config', (req, res) => {
    try {
        const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
        res.json(config);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка чтения конфигурации' });
    }
});

// Сохранить конфигурацию
app.post('/api/config', (req, res) => {
    try {
        fs.writeFileSync('./config.json', JSON.stringify(req.body, null, 2));
        res.json({ success: true, message: 'Конфигурация сохранена' });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сохранения конфигурации' });
    }
});

// Получить список активных ботов
app.get('/api/bots', (req, res) => {
    const bots = [];
    activeBots.forEach((bot, name) => {
        bots.push({
            name: name,
            status: bot.entity ? 'online' : 'connecting',
            health: bot.health || 0,
            food: bot.food || 0,
            position: bot.entity ? {
                x: bot.entity.position.x.toFixed(2),
                y: bot.entity.position.y.toFixed(2),
                z: bot.entity.position.z.toFixed(2)
            } : null
        });
    });
    res.json(bots);
});

// Получить логи бота
app.get('/api/logs/:botName', (req, res) => {
    const logs = botLogs.get(req.params.botName) || [];
    res.json(logs);
});

// Запустить ботов
app.post('/api/start', (req, res) => {
    try {
        const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
        const count = req.body.count || config.bots.count;
        
        for (let i = 1; i <= count; i++) {
            const botName = `${config.bots.namePrefix}${i}`;
            
            if (activeBots.has(botName)) {
                continue; // Бот уже запущен
            }
            
            setTimeout(() => {
                createBot(botName, config, i);
            }, (i - 1) * config.bots.spawnDelay);
        }
        
        res.json({ success: true, message: `Запуск ${count} ботов` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Остановить всех ботов
app.post('/api/stop', (req, res) => {
    try {
        activeBots.forEach((bot, name) => {
            bot.quit();
        });
        activeBots.clear();
        res.json({ success: true, message: 'Все боты остановлены' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Остановить конкретного бота
app.post('/api/stop/:botName', (req, res) => {
    try {
        const bot = activeBots.get(req.params.botName);
        if (bot) {
            bot.quit();
            activeBots.delete(req.params.botName);
            res.json({ success: true, message: `Бот ${req.params.botName} остановлен` });
        } else {
            res.status(404).json({ error: 'Бот не найден' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Отправить команду боту
app.post('/api/command/:botName', (req, res) => {
    try {
        const bot = activeBots.get(req.params.botName);
        if (bot) {
            bot.chat(req.body.command);
            addLog(req.params.botName, `Команда: ${req.body.command}`);
            res.json({ success: true, message: 'Команда отправлена' });
        } else {
            res.status(404).json({ error: 'Бот не найден' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Функция создания бота
function createBot(botName, config, botNumber) {
    // Используем случайный ник из data.yml или переданное имя
    if (!botName || config.bots.useRandomNames) {
        botName = getRandomName() || `${config.bots.namePrefix}${botNumber}`;
    }
    
    const behaviors = ['runner', 'commander', 'chatter'];
    const botBehavior = behaviors[botNumber % behaviors.length];
    
    addLog(botName, `Создание бота (${botBehavior})...`);
    
    const bot = mineflayer.createBot({
        host: config.server.host,
        port: config.server.port,
        username: botName,
        version: config.server.version,
        auth: 'offline'
    });
    
    activeBots.set(botName, bot);
    
    bot.once('spawn', () => {
        addLog(botName, '✓ Подключен к серверу');
        
        // Последовательное выполнение команд
        if (config.auth && config.auth.autoLogin) {
            setTimeout(() => {
                bot.chat(`/login ${config.auth.password}`);
                addLog(botName, '🔑 /login');
            }, 1000);
            
            setTimeout(() => {
                bot.chat('/kit start');
                addLog(botName, '📦 /kit start');
            }, 2500);
            
            setTimeout(() => {
                bot.chat('/rtp safe');
                addLog(botName, '🌍 /rtp safe');
            }, 4000);
        }
        
        // Запуск поведения
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
    
    bot.on('chat', (username, message) => {
        if (username === bot.username) return;
        addLog(botName, `<${username}> ${message}`);
    });
    
    bot.on('death', () => {
        addLog(botName, '☠ Умер');
        setTimeout(() => bot.chat('/respawn'), 1000);
    });
    
    bot.on('kicked', (reason) => {
        addLog(botName, `✗ Выкинут: ${reason}`);
        activeBots.delete(botName);
    });
    
    bot.on('error', (err) => {
        addLog(botName, `✗ Ошибка: ${err.message}`);
    });
    
    bot.on('end', () => {
        addLog(botName, 'Отключен');
        activeBots.delete(botName);
    });
    
    // Анти-AFK: регулярные действия чтобы не кикнуло за неактивность
    setInterval(() => {
        if (bot.entity) {
            // Случайное движение головой
            const yaw = Math.random() * Math.PI * 2;
            bot.look(yaw, 0, false);
            
            // Иногда прыгаем или двигаемся
            if (Math.random() > 0.7) {
                bot.setControlState('jump', true);
                setTimeout(() => bot.setControlState('jump', false), 100);
            }
        }
    }, 10000); // Каждые 10 секунд
}

// Поведения ботов
function startCommanderBehavior(bot, botName) {
    addLog(botName, '🎮 Режим: Командир');
    const commands = ['/rtp safe', '/spawn', '/home', '/warp'];
    
    setInterval(() => {
        const cmd = commands[Math.floor(Math.random() * commands.length)];
        bot.chat(cmd);
        addLog(botName, `Команда: ${cmd}`);
    }, 30000 + Math.random() * 60000);
    
    // Анти-AFK
    setInterval(() => {
        if (bot.entity) {
            bot.look(Math.random() * Math.PI * 2, 0, false);
            if (Math.random() > 0.7) {
                bot.setControlState('jump', true);
                setTimeout(() => bot.setControlState('jump', false), 100);
            }
        }
    }, 12000);
}

function startChatterBehavior(bot, botName) {
    addLog(botName, '💬 Режим: Болтун');
    const messages = [
        'Привет всем!', 'Как дела?', 'Что делаете?',
        'Кто-нибудь онлайн?', 'Приятной игры!',
        'Какой красивый сервер!', 'Кто хочет поиграть?'
    ];
    
    setInterval(() => {
        const msg = messages[Math.floor(Math.random() * messages.length)];
        bot.chat(msg);
        addLog(botName, `Написал: ${msg}`);
    }, 45000 + Math.random() * 75000);
    
    bot.on('chat', (username, message) => {
        if (username === bot.username) return;
        
        const msg = message.toLowerCase();
        if (msg.includes('привет') || msg.includes('hello')) {
            setTimeout(() => bot.chat(`Привет, ${username}! 👋`), 2000);
        } else if (msg.includes('как дела')) {
            setTimeout(() => bot.chat('Отлично!'), 2000);
        }
    });
    
    // Анти-AFK
    setInterval(() => {
        if (bot.entity) {
            bot.look(Math.random() * Math.PI * 2, 0, false);
            if (Math.random() > 0.8) {
                bot.setControlState('jump', true);
                setTimeout(() => bot.setControlState('jump', false), 100);
            }
        }
    }, 15000);
}

function startRunnerBehavior(bot, botName) {
    addLog(botName, '🏃 Режим: Бегун');
    
    setInterval(() => {
        if (bot.entity) {
            const yaw = Math.random() * Math.PI * 2;
            bot.look(yaw, 0, true);
            bot.clearControlStates();
            
            const action = Math.floor(Math.random() * 12);
            if (action < 5) {
                bot.setControlState('forward', true);
                bot.setControlState('sprint', true);
            } else if (action < 7) {
                bot.setControlState('forward', true);
                bot.setControlState('jump', true);
            } else if (action < 8) {
                bot.setControlState('back', true);
            } else if (action < 9) {
                bot.setControlState('left', true);
            } else {
                bot.setControlState('right', true);
            }
            
            setTimeout(() => bot.clearControlStates(), 1000 + Math.random() * 2500);
        }
    }, 1500 + Math.random() * 2000);
    
    // Дополнительная защита от AFK
    setInterval(() => {
        if (bot.entity) {
            bot.look(Math.random() * Math.PI * 2, 0, false);
        }
    }, 8000);
}

// Добавить лог
function addLog(botName, message) {
    if (!botLogs.has(botName)) {
        botLogs.set(botName, []);
    }
    
    const logs = botLogs.get(botName);
    const timestamp = new Date().toLocaleTimeString();
    logs.push({ time: timestamp, message });
    
    // Ограничиваем до 100 последних логов
    if (logs.length > 100) {
        logs.shift();
    }
    
    console.log(`[${botName}] ${message}`);
}

app.listen(PORT, () => {
    console.log('=================================');
    console.log('  🤖 Minecraft Bots Web Panel  ');
    console.log('=================================');
    console.log(`  Панель доступна: http://localhost:${PORT}`);
    console.log('=================================\n');
});
