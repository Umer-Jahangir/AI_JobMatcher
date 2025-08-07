# AI-Powered Job Matcher with Redis 8


This project is a smart, real-time job-matching platform that connects users with the most relevant job opportunities using **Redis 8 vector search**, **semantic caching**, **Django**, **React**, and **AI enrichment** via **gemini key**. It delivers a personalized job feed with instant feedback on matched and missing skills — without repeatedly consuming AI tokens.

---

## Demo

[![Watch the Demo](https://img.youtube.com/vi/BdUrtDT097s/0.jpg)](https://www.youtube.com/watch?v=BdUrtDT097s)

---

## What I Built

A **real-time AI job matching system** that:
- Embeds user profiles using `SentenceTransformers`
- Searches semantically similar job vectors stored in **Redis 8**
- Enriches jobs with AI via (Google Gemini Key)
- Caches enriched results in Redis to prevent redundant calls
- Dynamically updates match analysis (score, skills) based on user profile changes

---

## Tech Stack

- **Redis 8** – vector similarity search + semantic caching  
- **Django** – backend, REST API, Redis integration  
- **React** – frontend for job browsing  
- **SentenceTransformers** – for job/user embeddings  
- **API KEY** – connects to AI models (gemini-flash-2.0)
- **Auth0**– to handle secure authentication and user identity management across the frontend and backend
- **Docker** – containerized full stack with `docker-compose`

---

## How Redis 8 Powers It

### Without Redis:
- All jobs are fetched constantly regardless of user profile
- Every user interaction triggers AI model calls (costly)
- Redundant data is saved over and over again

### With Redis:
- Vector search dynamically returns semantically matched jobs  
- Semantic cache stores AI-enriched results using hashed user profiles  
- Match scores, matched/missing skills, and explanations are instantly updated from Redis without rerunning the AI

> Result: **Faster responses**, **lower costs**, and **no duplication**

---

### Local Development (Docker Setup)
Install Redis Stack with Docker

Make sure [Docker](https://www.docker.com/products/docker-desktop/) is installed.

Run the following to start Redis Stack (for vector search support):

```bash
docker run -d --name redis-stack \
  -p 6379:6379 \
  -p 8001:8001 \
  redis/redis-stack:latest
```

###  Clone the Repo

```bash
git clone https://github.com/Umer-Jahangir/AI_JobMatcher.git
cd AI_JobMatcher
```

### Frontend Setup

   ```bash
  cd frontend
  npm install
  npm run dev
  ```
### Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Linux/macOS
venv\Scripts\activate      # Windows
pip install -r requirements.txt
python manage.py fetch_jobs  # fetch jobs from external api
python manage.py cache_job_vectors # add fetch jobs to redis
python manage.py runserver
```

## Use the App
Once the backend and frontend are both running:

- Visit http://localhost:5173/

- Sign in using Auth0 

- View AI-matched job listings

- Click to see detailed match scores, matched and missing skills, and AI explanations

## Folder Structure Overview

```bash
job_match/
├── backend/
│   ├── backend/                  # Django settings
│   ├── jobs/                     # Core app (models, views, AI utils)
│   ├── manage.py
│   └── requirements.txt
├── frontend/                     # React app
├── public/                       # React public folder
├── src/                          # React components
├── .env                          # Env vars (not committed)
├── package.json
├── package-lock.json
├── .gitignore
```

## license

MIT License © 2025 Umer Jahangir
---




