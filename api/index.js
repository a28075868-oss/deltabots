const express = require('express');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const mineflayer = require('mineflayer');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Хранилище активных ботов (в памяти)
const activeBots = new Map();
const botLogs = new Map();

// Загрузка никнеймов из data.yml
let availableNames = [];
try {
    const dataPath = path.join(process.cwd(), 'data.yml');
    const dataFile = fs.readFileSync(dataPath, 'utf8');
    const data = yaml.load(dataFile);
    availableNames = data['collected-names'] || [];
    console.log(`✓ Загружено ${availableNames.length} никнеймов`);
} catch (error) {
    console.error('✗ Ошибка загрузки data.yml:', error.message);
}

// Конфигурация по умолчанию
let config = {
    server: {
        host: process.env.MC_HOST || 'mc.deltaworld.go-mc.pro',
        port: parseInt(process.env.MC_PORT) || 25565,
        version: process.env.MC_VERSION || '1.16.5'
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
        password: process.env.MC_PASSWORD || 'qwer123Q'
    }
};

// Функция для получения случайного ника
function getRandomName() {
    if (config.bots.useRandomNames && availableNames.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableNames.length);
        return availableNames[randomIndex];
    }
    return null;
}

// API endpoints
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
