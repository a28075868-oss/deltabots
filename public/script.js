// Загрузка конфигурации при открытии страницы
document.addEventListener('DOMContentLoaded', () => {
    loadConfig();
    setInterval(updateBotsList, 5000); // Обновление списка каждые 5 сек
});

// Загрузить конфигурацию
async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        
        document.getElementById('serverHost').value = config.server.host;
        document.getElementById('serverPort').value = config.server.port;
        document.getElementById('serverVersion').value = config.server.version;
        document.getElementById('authPassword').value = config.auth.password;
        
        document.getElementById('botsCount').value = config.bots.count;
        document.getElementById('botsPrefix').value = config.bots.namePrefix;
        document.getElementById('botsSpawnDelay').value = config.bots.spawnDelay;
        document.getElementById('botsReconnectDelay').value = config.bots.reconnectDelay;
        
        document.getElementById('autoRespawn').checked = config.behavior.autoRespawn;
        document.getElementById('randomMovement').checked = config.behavior.randomMovement;
        document.getElementById('chatResponses').checked = config.behavior.chatResponses;
        document.getElementById('autoLogin').checked = config.auth.autoLogin;
        document.getElementById('useRandomNames').checked = config.bots.useRandomNames || false;
        
        showNotification('Настройки загружены', 'success');
    } catch (error) {
        showNotification('Ошибка загрузки настроек', 'error');
    }
}

// Сохранить конфигурацию
async function saveConfig() {
    const config = {
        server: {
            host: document.getElementById('serverHost').value,
            port: parseInt(document.getElementById('serverPort').value),
            version: document.getElementById('serverVersion').value
        },
        bots: {
            count: parseInt(document.getElementById('botsCount').value),
            namePrefix: document.getElementById('botsPrefix').value,
            spawnDelay: parseInt(document.getElementById('botsSpawnDelay').value),
            reconnectDelay: parseInt(document.getElementById('botsReconnectDelay').value),
            useRandomNames: document.getElementById('useRandomNames').checked
        },
        behavior: {
            autoRespawn: document.getElementById('autoRespawn').checked,
            randomMovement: document.getElementById('randomMovement').checked,
            chatResponses: document.getElementById('chatResponses').checked
        },
        auth: {
            autoLogin: document.getElementById('autoLogin').checked,
            password: document.getElementById('authPassword').value
        }
    };
    
    try {
        const response = await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });
        const data = await response.json();
        showNotification(data.message, 'success');
    } catch (error) {
        showNotification('Ошибка сохранения', 'error');
    }
}

// Запустить ботов
async function startBots() {
    const count = parseInt(document.getElementById('botsCount').value);
    try {
        const response = await fetch('/api/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ count })
        });
        const data = await response.json();
        showNotification(data.message, 'success');
        setTimeout(updateBotsList, 2000);
    } catch (error) {
        showNotification('Ошибка запуска ботов', 'error');
    }
}

// Остановить всех ботов
async function stopBots() {
    try {
        const response = await fetch('/api/stop', { method: 'POST' });
        const data = await response.json();
        showNotification(data.message, 'success');
        updateBotsList();
    } catch (error) {
        showNotification('Ошибка остановки ботов', 'error');
    }
}

// Обновить список ботов
async function updateBotsList() {
    try {
        const response = await fetch('/api/bots');
        const bots = await response.json();
        
        const botsList = document.getElementById('botsList');
        const botSelect = document.getElementById('botSelect');
        
        if (bots.length === 0) {
            botsList.innerHTML = '<p class="no-bots">Нет активных ботов</p>';
            botSelect.innerHTML = '<option value="">-- Выберите бота --</option>';
            return;
        }
        
        botsList.innerHTML = bots.map(bot => `
            <div class="bot-card">
                <h3>🤖 ${bot.name}</h3>
                <div class="bot-info">
                    <p>Статус: <span class="status-${bot.status}">${bot.status === 'online' ? 'Онлайн' : 'Подключается'}</span></p>
                    <p>❤️ Здоровье: ${bot.health}/20</p>
                    <p>🍖 Голод: ${bot.food}/20</p>
                    ${bot.position ? `<p>📍 X:${bot.position.x} Y:${bot.position.y} Z:${bot.position.z}</p>` : ''}
                </div>
                <div class="bot-actions">
                    <button class="btn btn-warning btn-sm" onclick="sendCommand('${bot.name}', '/help')">Команда</button>
                    <button class="btn btn-danger btn-sm" onclick="stopBot('${bot.name}')">Остановить</button>
                </div>
            </div>
        `).join('');
        
        botSelect.innerHTML = '<option value="">-- Выберите бота --</option>' +
            bots.map(bot => `<option value="${bot.name}">${bot.name}</option>`).join('');
            
    } catch (error) {
        console.error('Ошибка обновления списка:', error);
    }
}

// Остановить конкретного бота
async function stopBot(botName) {
    try {
        await fetch(`/api/stop/${botName}`, { method: 'POST' });
        showNotification(`Бот ${botName} остановлен`, 'success');
        updateBotsList();
    } catch (error) {
        showNotification('Ошибка остановки бота', 'error');
    }
}

// Отправить команду боту
async function sendCommand(botName, command) {
    const cmd = prompt(`Введите команду для ${botName}:`, command);
    if (!cmd) return;
    
    try {
        await fetch(`/api/command/${botName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: cmd })
        });
        showNotification(`Команда отправлена ${botName}`, 'success');
    } catch (error) {
        showNotification('Ошибка отправки команды', 'error');
    }
}

// Обновить логи
async function updateLogs() {
    const botName = document.getElementById('botSelect').value;
    if (!botName) return;
    
    try {
        const response = await fetch(`/api/logs/${botName}`);
        const logs = await response.json();
        
        const logsDisplay = document.getElementById('logsDisplay');
        if (logs.length === 0) {
            logsDisplay.innerHTML = '<p>Нет логов</p>';
            return;
        }
        
        logsDisplay.innerHTML = logs.map(log => 
            `<div class="log-entry"><span class="log-time">${log.time}</span>${log.message}</div>`
        ).join('');
        
        logsDisplay.scrollTop = logsDisplay.scrollHeight;
    } catch (error) {
        console.error('Ошибка загрузки логов:', error);
    }
}

// Показать уведомление
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
