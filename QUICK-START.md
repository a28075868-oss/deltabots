# ⚡ Быстрый старт

## 🌐 Деплой на Vercel (за 2 минуты)

### 1. Подготовьте код
```bash
git init
git add .
git commit -m "Initial commit"
```

### 2. Создайте репозиторий на GitHub
1. Откройте https://github.com/new
2. Создайте новый репозиторий
3. Выполните команды:

```bash
git remote add origin https://github.com/ВАШ_ЛОГИН/minecraft-bots.git
git branch -M main
git push -u origin main
```

### 3. Деплой на Vercel
1. Откройте https://vercel.com
2. Нажмите "Add New" → "Project"
3. Выберите ваш GitHub репозиторий
4. Нажмите "Deploy"

### 4. Готово! 🎉
Ваша панель: `https://ваш-проект.vercel.app`

## 💻 Запуск ботов локально

### 1. Настройте на веб-панели
1. Откройте вашу панель на Vercel
2. Настройте параметры
3. Нажмите "Экспорт config.json"

### 2. Запустите ботов
```bash
# Установка (один раз)
npm install

# Запуск
node bot-client.js

# Команды в консоли:
start 5     # Запустить 5 ботов
status      # Статус
stop        # Остановить всех
exit        # Выход
```

## 🎯 Что где работает

| Что                | Где работает     |
|--------------------|------------------|
| Веб-панель         | Vercel ☁️       |
| Настройка          | Vercel ☁️       |
| Экспорт конфига    | Vercel ☁️       |
| Боты               | Ваш ПК 💻       |
| Подключение к MC   | Ваш ПК 💻       |

## ✅ Проверка

После деплоя на Vercel:
- ✅ Откройте ваш URL
- ✅ Должна открыться веб-панель
- ✅ Настройте параметры
- ✅ Экспортируйте config.json
- ✅ Запустите `node bot-client.js` локально

## 🆘 Если что-то не работает

**404 ошибка:**
```bash
# Проверьте vercel.json
cat vercel.json

# Должно быть:
# {
#   "version": 2,
#   "rewrites": [...]
# }
```

**Боты не подключаются:**
```bash
# Проверьте config.json
# Правильный адрес сервера?
# Правильная версия MC?
```

**Ошибка при npm install:**
```bash
# Удалите и переустановите
rm -rf node_modules package-lock.json
npm install
```

## 📚 Подробные инструкции

- [VERCEL-FIX.md](./VERCEL-FIX.md) - Исправление 404
- [DEPLOY.md](./DEPLOY.md) - Деплой на Railway
- [README-VERCEL.md](./README-VERCEL.md) - Про ограничения Vercel

---

**Всё работает! 🚀 Боты запущены! 🤖**
