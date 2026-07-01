// Приложение для Railway - боты + веб-панель
const express = require('express');
const mineflayer = require('mineflayer');
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Загрузка ников
let availableNames = [];
try {
    const dataFile = fs.readFileSync('./data.yml', 'utf8');
    const data = yaml.load(dataFile);
    availableNames = data['collected-names'] || [];
    console.log(`✓ Загружено ${availableNames.length} никнеймов`);
} catch (error) {
    console.error('✗ Ошибка загрузки data.yml:', error.message);
}

// Конфигурация
let config = {
    server: {
        host: process.env.MC_HOST || 'mc.deltaworld.go-mc.pro',
        port: parseInt(process.env.MC_PORT) || 25565,
        version: process.env.MC_VERSION || '1.16.5'
    },
    bots: {
        count: parseInt(process.env.BOT_COUNT) || 5,
        namePrefix: 'Bot',
        spawnDelay: 2000,
        reconnectDelay: 5000,
        useRandomNames: true
    },
    behavior: {
        autoRespawn: true,
        randomMovement: true,
        chatResponses: true
    },
    auth: {
        autoLogin: true,
        password: process.env.MC_PASSWORD || 'qwer123Q'
    }
};

// Хранилище ботов
const activeBots = new Map();
const botLogs = new Map();

function getRandomName() {
    if (config.bots.useRandomNames && availableNames.length > 0) {
        return availableNames[Math.floor(Math.random() * availableNames.length)];
    }
    return null;
}

function addLog(botName, message) {
    if (!botLogs.has(botName)) {
        botLogs.set(botName, []);
    }
    const logs = botLogs.get(botName);
    const timestamp = new Date().toLocaleTimeString();
    logs.push({ time: timestamp, message });
    if (logs.length > 100) logs.shift();
    console.log(`[${botName}] ${message}`);
}

function createBot(botNumber) {
    const botName = getRandomName() || `${config.bots.namePrefix}${botNumber}`;
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

    bot.once('spawn', () => {
        addLog(botName, '✓ Подключен к серверу');
        
        if (config.auth.autoLogin) {
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
        
        setTimeout(() => {
            if (botBehavior === 'commander') startCommanderBehavior(bot, botName);
            else if (botBehavior === 'chatter') startChatterBehavior(bot, botName);
            else startRunnerBehavior(bot, botName);
        }, 6000);
    });

    bot.on('death', () => {
        addLog(botName, '☠ Умер');
        if (config.behavior.autoRespawn) {
            setTimeout(() => bot.chat('/respawn'), 1000);
        }
    });

    bot.on('kicked', (reason) => {
        addLog(botName, `✗ Выкинут: ${reason}`);
        activeBots.delete(botName);
    });

    bot.on('error', (err) => addLog(botName, `✗ Ошибка: ${err.message}`));
    
    bot.on('end', () => {
        addLog(botName, 'Отключен');
        activeBots.delete(botName);
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
    }, 10000);

    activeBots.set(botName, bot);
}

function startCommanderBehavior(bot, name) {
    addLog(name, '🎮 Режим: Командир');
    const cmds = ['/rtp safe', '/spawn', '/home', '/warp'];
    setInterval(() => {
        const cmd = cmds[Math.floor(Math.random() * cmds.length)];
        bot.chat(cmd);
        addLog(name, `Команда: ${cmd}`);
    }, 30000 + Math.random() * 60000);
}

function startChatterBehavior(bot, name) {
    addLog(name, '💬 Режим: Болтун');
    const msgs = ['Привет!', 'Как дела?', 'Что делаете?', 'Приятной игры!'];
    setInterval(() => {
        const msg = msgs[Math.floor(Math.random() * msgs.length)];
        bot.chat(msg);
        addLog(name, `Написал: ${msg}`);
    }, 45000 + Math.random() * 75000);
    
    bot.on('chat', (username, message) => {
        if (username === bot.username) return;
        const msg = message.toLowerCase();
        if (msg.includes('привет') || msg.includes('hello')) {
            setTimeout(() => bot.chat(`Привет, ${username}!`), 2000);
        }
    });
}

function startRunnerBehavior(bot, name) {
    addLog(name, '🏃 Режим: Бегун');
    setInterval(() => {
        if (bot.entity) {
            bot.look(Math.random() * Math.PI * 2, 0, true);
            bot.clearControlStates();
            
            const action = Math.floor(Math.random() * 5);
            if (action < 2) {
                bot.setControlState('forward', true);
                bot.setControlState('sprint', true);
            } else if (action < 3) {
                bot.setControlState('forward', true);
                bot.setControlState('jump', true);
            }
            
            setTimeout(() => bot.clearControlStates(), 1000 + Math.random() * 2000);
        }
    }, 2000 + Math.random() * 2000);
}

// API Routes
app.get('/api/config', (req, res) => {
    res.json(config);
});

app.post('/api/config', (req, res) => {
    config = { ...config, ...req.body };
    res.json({ success: true, message: 'Конфигурация обновлена' });
});

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

app.get('/api/logs/:botName', (req, res) => {
    const logs = botLogs.get(req.params.botName) || [];
    res.json(logs);
});

app.post('/api/start', (req, res) => {
    const count = req.body.count || config.bots.count;
    console.log(`\n🚀 Запуск ${count} ботов...\n`);
    
    for (let i = 1; i <= count; i++) {
        setTimeout(() => createBot(i), (i - 1) * config.bots.spawnDelay);
    }
    
    res.json({ success: true, message: `Запуск ${count} ботов` });
});

app.post('/api/stop', (req, res) => {
    activeBots.forEach((bot, name) => {
        console.log(`Остановка ${name}...`);
        bot.quit();
    });
    activeBots.clear();
    res.json({ success: true, message: 'Все боты остановлены' });
});

app.post('/api/stop/:botName', (req, res) => {
    const bot = activeBots.get(req.params.botName);
    if (bot) {
        bot.quit();
        activeBots.delete(req.params.botName);
        res.json({ success: true, message: `Бот ${req.params.botName} остановлен` });
    } else {
        res.status(404).json({ error: 'Бот не найден' });
    }
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
    console.log('╔════════════════════════════════════════╗');
    console.log('║   🤖 Minecraft Bots on Railway        ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`Порт: ${PORT}`);
    console.log(`Сервер MC: ${config.server.host}:${config.server.port}`);
    console.log(`Веб-панель: http://localhost:${PORT}\n`);
    
    // Автозапуск ботов
    if (process.env.AUTO_START === 'true') {
        console.log('🚀 Автозапуск ботов...\n');
        setTimeout(() => {
            for (let i = 1; i <= config.bots.count; i++) {
                setTimeout(() => createBot(i), (i - 1) * config.bots.spawnDelay);
            }
        }, 2000);
    }
});
