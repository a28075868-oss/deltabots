// Standalone веб-приложение для управления ботами
// Работает БЕЗ серверной части - только фронтенд

let config = {
    server: {
        host: 'mc.deltaworld.go-mc.pro',
        port: 25565,
        version: '1.16.5'
    },
    bots: {
        count: 5,
        namePrefix: 'Bot',
        useRandomNames: true
    },
    auth: {
        password: 'qwer123Q'
    }
};

// Загрузка конфигурации из localStorage
function loadConfig() {
    const saved = localStorage.getItem('mcBotsConfig');
    if (saved) {
        config = JSON.parse(saved);
    }
    
    document.getElementById('serverHost').value = config.server.host;
    document.getElementById('serverPort').value = config.server.port;
    document.getElementById('serverVersion').value = config.server.version;
    document.getElementById('authPassword').value = config.auth.password;
    document.getElementById('botsCount').value = config.bots.count;
    document.getElementById('botsPrefix').value = config.bots.namePrefix;
    document.getElementById('useRandomNames').checked = config.bots.useRandomNames;
}

// Сохранение конфигурации
function saveConfig() {
    config = {
        server: {
            host: document.getElementById('serverHost').value,
            port: parseInt(document.getElementById('serverPort').value),
            version: document.getElementById('serverVersion').value
        },
        bots: {
            count: parseInt(document.getElementById('botsCount').value),
            namePrefix: document.getElementById('botsPrefix').value,
            useRandomNames: document.getElementById('useRandomNames').checked
        },
        auth: {
            password: document.getElementById('authPassword').value
        }
    };
    
    localStorage.setItem('mcBotsConfig', JSON.stringify(config));
    showNotification('✓ Настройки сохранены!', 'success');
}

// Генерация команды запуска
function generateCommand() {
    const cmd = `node bot-client.js`;
    document.getElementById('commandOutput').textContent = cmd;
    showNotification('Команда сгенерирована!', 'info');
}

// Копирование в буфер
function copyToClipboard() {
    const text = document.getElementById('commandOutput').textContent;
    navigator.clipboard.writeText(text).then(() => {
        showNotification('✓ Скопировано в буфер обмена!', 'success');
    });
}

// Экспорт конфигурации
function exportConfig() {
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'config.json';
    link.click();
    showNotification('✓ Конфигурация экспортирована!', 'success');
}

// Импорт конфигурации
function importConfig() {
    document.getElementById('fileInput').click();
}

document.getElementById('fileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                config = JSON.parse(e.target.result);
                localStorage.setItem('mcBotsConfig', JSON.stringify(config));
                loadConfig();
                showNotification('✓ Конфигурация импортирована!', 'success');
            } catch (error) {
                showNotification('✗ Ошибка чтения файла!', 'error');
            }
        };
        reader.readAsText(file);
    }
});

// Уведомления
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    loadConfig();
});
