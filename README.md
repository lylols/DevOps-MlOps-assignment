# 📅 Chronos — Calendar & Task Manager

A modern, beautiful calendar web application with integrated task management built with **Next.js**.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-green?logo=github-actions)

Live on - https://dev-ops-ml-ops-assignment.vercel.app/

## 📝 Assignment Details

| Field | Details |
|-------|---------|
| **Name** | Shradha Shrivastava |
| **Roll No.** | 0201AI221067 |
| **Semester** | 8th Semester |
| **Branch** | Artificial Intelligence and Data Science |
| **Subject** | DevOps and MLOps |

## ✨ Features

- **Monthly & Weekly Views** — navigate between months/weeks with smooth transitions
- **Task Management** — create, edit, delete, and complete tasks
- **Categories** — color-coded categories (Work, Personal, Health, Shopping, Study)
- **Priority Levels** — High, Medium, Low with visual indicators
- **Search** — filter tasks by text
- **Mini Calendar** — sidebar quick navigation
- **Upcoming Tasks** — see your next 7 days at a glance
- **Local Storage** — tasks persist in the browser
- **Dark Theme** — premium aesthetic with warm tones

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## 🐳 Docker

### Build

```bash
docker build -t chronos-calendar .
```

### Run

```bash
docker run -p 3000:3000 chronos-calendar
```

## 🔄 CI/CD

This project uses **GitHub Actions** to automatically build a Docker image on every push/PR to the `main` branch.

The pipeline:
1. Checks out the code
2. Installs dependencies
3. Builds the Next.js app
4. Builds & verifies the Docker image

## 🛠️ Tech Stack

- **Next.js 16** — React framework with App Router
- **Vanilla CSS** — Custom design system with CSS variables
- **Docker** — Multi-stage build with standalone output
- **GitHub Actions** — CI/CD pipeline

---

**Developed by Shradha Shrivastava** | 0201AI221067 | AI & Data Science, 8th Sem
