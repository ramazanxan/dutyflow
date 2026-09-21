# DutyFlow

Веб-приложение для распределения обязанностей между людьми — семья, квартира, команда, учебная группа.

Участники входят без регистрации (Supabase Anonymous Auth), присоединяются к группе по коду приглашения и видят общие задачи в реальном времени.

## Стек

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Supabase (Postgres, Anonymous Auth, Realtime, RLS)
- React Router (HashRouter — требование GitHub Pages)
- TanStack Query
- Lucide Icons

## Разработка

```bash
npm install
cp .env.example .env   # заполнить значениями своего Supabase-проекта
npm run dev
```

Дев-сервер: http://localhost:5173/dutyflow/

## Сборка

```bash
npm run build
```

## Деплой

Push в `main` запускает GitHub Actions → GitHub Pages.

В настройках репозитория нужно задать секреты:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Во фронтенде используется только публичный anon key — доступ к данным ограничивается через RLS.

## Этапы

1. ✅ Setup — каркас, Tailwind, роутинг, CI/CD
2. ⬜ Supabase — схема БД, RLS, Realtime
3. ⬜ User — anonymous auth и профиль
4. ⬜ Workspace — группы, приглашения, роли
5. ⬜ Tasks — CRUD обязанностей
6. ⬜ Realtime — живые обновления
7. ⬜ XP — баллы, штрафы, статистика
8. ⬜ Notifications — уведомления и напоминания
9. ⬜ Calendar — календарь и повторяющиеся задачи
10. ⬜ Polish — тёмная тема, состояния, анимации
11. ⬜ Deploy — прод на GitHub Pages
