# Деплой на Vercel

## Способ 1: Через GitHub (Рекомендуется)

1. **Подключите репозиторий к Vercel:**
   - Зайдите на [vercel.com](https://vercel.com)
   - Войдите через GitHub
   - Нажмите "Add New Project"
   - Выберите репозиторий `Claude-Swap/ClaudeSwap`
   - Vercel автоматически определит настройки проекта

2. **Настройки проекта:**
   - **Framework Preset**: Vite
   - **Root Directory**: `front` (если репозиторий в корне, оставьте пустым)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

3. **Нажмите "Deploy"**

После деплоя каждый push в `main` будет автоматически деплоить проект.

## Способ 2: Через Vercel CLI

1. **Установите Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Войдите в Vercel:**
   ```bash
   vercel login
   ```

3. **Перейдите в папку проекта:**
   ```bash
   cd front
   ```

4. **Деплой:**
   ```bash
   vercel
   ```

5. **Для продакшн деплоя:**
   ```bash
   vercel --prod
   ```

## Настройка домена

После деплоя вы можете настроить кастомный домен:
- Зайдите в настройки проекта на Vercel
- Перейдите в раздел "Domains"
- Добавьте ваш домен (например, claudeswap.com)

## Переменные окружения

Если нужны переменные окружения:
- Зайдите в настройки проекта на Vercel
- Перейдите в раздел "Environment Variables"
- Добавьте необходимые переменные

## Serverless Functions

Проект использует serverless функции в папке `api/`. Vercel автоматически их распознает и задеплоит.

Функции доступны по адресам:
- `/api/getquote` - получение котировок
- `/api/rpc/blockhash` - получение blockhash
- `/api/swap/instructions` - инструкции для свопа
- `/api/swap/send-transaction` - отправка транзакции
