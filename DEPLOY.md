# 🚀 Быстрый деплой на Railway

Railway - лучшая платформа для Minecraft ботов!

## ⚡ За 3 минуты:

### Шаг 1: Создайте аккаунт
1. Откройте https://railway.app
2. Нажмите "Start a New Project"
3. Войдите через GitHub

### Шаг 2: Загрузите код
```bash
# Если еще нет Git репозитория:
git init
git add .
git commit -m "Initial commit"
git branch -M main

# Создайте репозиторий на GitHub
# Затем:
git remote add origin https://github.com/ВАШ_ЛОГИН/minecraft-bots.git
git push -u origin main
```

### Шаг 3: Деплой на Railway
1. В Railway нажмите "New Project"
2. Выберите "Deploy from GitHub repo"
3. Выберите ваш репозиторий
4. Railway автоматически обнаружит Node.js
5. Добавьте переменные окружения:
   - `MC_HOST` = mc.deltaworld.go-mc.pro
   - `MC_PORT` = 25565
   - `MC_VERSION` = 1.16.5
   - `MC_PASSWORD` = qwer123Q
   - `AUTO_START` = true

6. Нажмите "Deploy"

### Шаг 4: Готово!
- Боты запустятся автоматически
- Логи доступны в Railway Dashboard
- Веб-панель по адресу: https://ваш-проект.up.railway.app

## 💰 Стоимость:

- **$5 бесплатно** каждый месяц
- Хватит на ~500 часов работы ботов
- После $5 - платно ($0.000231/мин)

## 🔄 Обновление:

```bash
git add .
git commit -m "Update"
git push
```

Railway автоматически задеплоит изменения!

---

**Всё! Боты работают в облаке 24/7! ☁️🤖**
