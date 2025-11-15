# 🎬 Filmory — AI-Powered Movie Memory Bot

**[Filmory](https://t.me/film_memory_bot)** is a Telegram bot that helps users track movies, build their watchlist, rate
titles they’ve seen, and get personalized recommendations powered by AI.
Designed with focus on clean architecture, user experience, reliability, and production-ready engineering practices.

## 🚀 Features

### 🔍 Smart Movie Search

* Searches films via TMDB AP
* Gracefully handles ambiguous titles
* If a movie isn’t found, users can save a custom entry they typed

### 🎯 Personalized Recommendations

* Uses Gemini 2.x Flash (Google GenAI)
* Understands film vibes, genres, emotional tone
* Returns high-quality, human-like suggestions

### 🎞 User Library

* Two independent views:
* Watch Later
* Watched, with rating and review
* Pagination with inline keyboards and smooth navigation
* Beautiful film cards with posters and metadata

### 📚 Clean Data Model

* `User`, `Film`, `LibraryItem`
* Normalized structure inspired by relational DBs
* No duplication of movie data — everything centralized in `Film` collection
* Auto-incrementing numeric IDs for predictable document references

### ⚙️ Production-Ready Architecture

* Node.js + ES Modules + Telegraf (Scenes)
* Express server with **health checks**
* Graceful shutdown, signal handling
* MongoDB with connection retry logic
* Service-layer abstraction (FilmService, LibraryService, AIService)
* Error boundary middleware + safe UI fallbacks

### 🖥 DevOps and Runtime

* Deployed on Render.com
* Uptime monitoring via UptimeRobot
* Zero-downtime restarts
* Optimized for low resource usage
* Uses environment variables, no secrets in repo

## 🧱 Tech Stack

| Area          | Technology                                                        |
|---------------|-------------------------------------------------------------------|
| Bot Framework | Telegraf v4 (Scenes, Inline Keyboards)                            |
| API           | Express.js                                                        |
| Database      | MongoDB + Mongoose (auto-increment plugin, lean queries, indexes) |
| AI Engine     | Google Gemini 2.x Flash                                           |
| External Data | TMDB API                                                          |
| Deployment    | Render.com (Dockerless Deploy)                                    |
| Monitoring    | UptimeRobot                                                       |
| Node Version  | Node.js 22+                                                       |

## 🏗 Project Structure

```
Filmory
├── backend
|  ├── package.json
|  └── src
|     ├── api
|     ├── bot
|     |  ├── getBotInstance.js
|     |  ├── handlers
|     |  ├── index.js
|     |  ├── middlewares
|     |  └── scenes
|     ├── config
|     ├── index.js
|     ├── models
|     |  ├── Film.js
|     |  ├── index.js
|     |  ├── LibraryItem.js
|     |  └── User.js
|     ├── server
|     |  ├── controllers
|     |  └── routes
|     ├── server.js
|     ├── services
|     |  ├── FilmService.js
|     |  ├── integrations
|     |  ├── LibraryService.js
|     |  ├── system
|     |  └── UserService.js
|     └── utils
|        ├── animatedWaiter.js
|        ├── escapeReservedCharacters.js
|        ├── keyboards
|        └── templates
├── frontend
├── LICENSE.md
├── package-lock.json
├── package.json
├── README.md
└── structure.txt
```
A modular structure ensures:
* decoupled business logic
* scalable scene management
* reusable service layer
* clean separation between bot and server code

## 🧠 AI Recommendations Flow

Filmory uses the Gemini API in a highly optimized way:
* Collects user’s favorite genres and top-rated films
* Uses a context-aware system prompt
* Renders a fallback-safe animated “typing…” loader
* Parses and formats results
* Handles slow/failed AI responses with graceful messaging
* This allows Filmory to feel personal, not mechanical.

## 📈 UX Details That Matter

Filmory focuses heavily on user experience, including:

Non-blocking UI loaders

Inline pagination (Prev/Next arrows)

Back navigation in every scene

Structured, minimalistic film cards

Helpful error messages

Clean Markdown formatting

Zero clutter in chat

These small details dramatically improve perceived quality.

## 🩺 Health Check Endpoint

Filmory includes a lightweight production health-check:

GET /healthz

Returns status for:

server

MongoDB connection

uptime

environment sanity

Designed to work perfectly with Render’s health monitoring.

## 🏃‍♀️ Local Development

1. Install dependencies
   > npm install

2. Add environment variables

Create a .env file:

```
ENVIRONMENT=[DEV/PROD]
RUN_MODE=tgbot
BOT_TOKEN=...
BOT_USERNAME=...
MONGODB_CONNECT=...
PORT=...
GEMINI_API_KEY=...
TMDB_BASE_URL=...
TMDB_API_KEY=...
TMDB_API_READ_TOKEN=...
``` 

3. Run the bot
   > npm run dev

## 📦 Deployment

Filmory runs perfectly on:

Render.com (free tier supported)

Railway.app

Fly.io

VPS

Includes:

graceful shutdown

automatic restarts

stateless web server

environment-based config

## 📷 Preview

| Feature            | Preview |
|--------------------|---------|
| Library Pagination |         |
| Film Card          |         |
| AI Recommendations |         |

## 📄 License

[MIT License](LiCENSE.md)

## ⭐ Want to support Filmory?

If you find this bot useful or inspiring — you can ⭐ star the repo or create a PR with improvements.
