const mineflayer = require('mineflayer');
const fs = require('fs');
const yaml = require('js-yaml');

// Загрузка конфигурации
let config = {
    server: {
        host: 'mc.deltaworld.go-mc.pro',
        port: 25565,
        version: '1.16.5'
    },
    bots: {
        count: 5,
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
        password: 'qwer123Q'
    }
};

// Загрузка никнеймов
let availableNames = [];
try {
    const dataFile = fs.readFileSync('./data.yml', 'utf8');
    const data = yaml.load(dataFile);
    availableNames = data['collected-names'] || [];
    console.log(`✓ Загружено ${availableNames.length} никнеймов`);
} catch (error) {
    console.error('✗ Ошибка загрузки data.yml:', error.message);
}

// Хранилище ботов
const activeBots = new Map();

function getRandomName() {
    if (config.bots.useRandomNames && availableNames.length > 0) {
        return availableNames[Math.floor(Math.random() * availableNames.length)];
    }
    return null;
}

function createBot(botNumber) {
    const botName = getRandomName() || `${config.bots.namePrefix}${botNumber}`;
    const behaviors = ['runner', 'commander', 'chatter'];
    const botBehavior = behaviors[botNumber % behaviors.length];
    
    console.log(`[${botName}] Создание бота (${botBehavior})...`);
    
    const bot = mineflayer.createBot({
        host: config.server.host,
        port: config.server.port,
        username: botName,
        version: config.server.version,
        auth: 'offline'
    });

    bot.once('spawn', () => {
        console.log(`[${botName}] ✓ Подключен`);
        
        // Автологин
        if (config.auth.autoLogin) {
            setTimeout(() => bot.chat(`/login ${config.auth.password}`), 1000);
            setTimeout(() => bot.chat('/kit start'), 2500);
            setTimeout(() => bot.chat('/rtp safe'), 4000);
        }
        
        // Запуск поведения
        setTimeout(() => {
            if (botBehavior === 'commander') startCommanderBehavior(bot, botName);
            else if (botBehavior === 'chatter') startChatterBehavior(bot, botName);
            else startRunnerBehavior(bot, botName);
        }, 6000);
    });

    bot.on('death', () => {
        if (config.behavior.autoRespawn) {
            setTimeout(() => bot.chat('/respawn'), 1000);
        }
    });

    bot.on('kicked', (reason) => {
        console.log(`[${botName}] Выкинут: ${reason}`);
        activeBots.delete(botName);
    });

    bot.on('error', (err) => console.error(`[${botName}] Ошибка:`, err.message));
    bot.on('end', () => {
        console.log(`[${botName}] Отключен`);
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
    return bot;
}

function startCommanderBehavior(bot, name) {
    console.log(`[${name}] 🎮 Командир`);
    const cmds = ['/rtp safe', '/spawn', '/home', '/warp'];
    setInterval(() => {
        bot.chat(cmds[Math.floor(Math.random() * cmds.length)]);
    }, 30000 + Math.random() * 60000);
}

function startChatterBehavior(bot, name) {
    console.log(`[${name}] 💬 Болтун`);
    const msgs = ['Привет!', 'Как дела?', 'Что делаете?', 'Приятной игры!'];
    setInterval(() => {
        bot.chat(msgs[Math.floor(Math.random() * msgs.length)]);
    }, 45000 + Math.random() * 75000);
}

function startRunnerBehavior(bot, name) {
    console.log(`[${name}] 🏃 Бегун`);
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
            } else {
                bot.setControlState('jump', true);
            }
            
            setTimeout(() => bot.clearControlStates(), 1000 + Math.random() * 2000);
        }
    }, 2000 + Math.random() * 2000);
}

// Запуск ботов
function startBots(count) {
    console.log(`\n🚀 Запуск ${count} ботов...\n`);
    for (let i = 1; i <= count; i++) {
        setTimeout(() => createBot(i), (i - 1) * config.bots.spawnDelay);
    }
}

// Остановка всех ботов
function stopAllBots() {
    console.log('\n⏹️ Остановка всех ботов...\n');
    activeBots.forEach((bot, name) => {
        console.log(`Отключение ${name}...`);
        bot.quit();
    });
    activeBots.clear();
}

// CLI интерфейс
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('╔════════════════════════════════════════╗');
console.log('║   🤖 Minecraft Bots Client v2.0      ║');
console.log('╚════════════════════════════════════════╝\n');
console.log('Команды:');
console.log('  start [count] - Запустить ботов');
console.log('  stop          - Остановить всех');
console.log('  status        - Статус ботов');
console.log('  config        - Показать конфиг');
console.log('  exit          - Выход\n');

rl.on('line', (input) => {
    const [cmd, ...args] = input.trim().split(' ');
    
    switch(cmd) {
        case 'start':
            const count = parseInt(args[0]) || config.bots.count;
            startBots(count);
            break;
        case 'stop':
            stopAllBots();
            break;
        case 'status':
            console.log(`\nАктивных ботов: ${activeBots.size}`);
            activeBots.forEach((bot, name) => {
                console.log(`  - ${name}: ${bot.entity ? 'online' : 'connecting'}`);
            });
            console.log('');
            break;
        case 'config':
            console.log('\nТекущая конфигурация:');
            console.log(JSON.stringify(config, null, 2));
            console.log('');
            break;
        case 'exit':
            stopAllBots();
            process.exit(0);
            break;
        default:
            console.log('Неизвестная команда. Введите help для справки.\n');
    }
});

// Автозапуск
if (process.env.AUTO_START) {
    startBots(config.bots.count);
}
