# ORCA — Odyssey Research & Club of AI

📖 **[Read the Official Architecture Specification](https://arjunx156.github.io/Club_project/)**

A full-stack member portal for the AI & Data Science club, built with Flask and PostgreSQL (Supabase), deployed on Vercel.

## Project Structure

```
Club_project/
├── app.py              # Flask backend — all API routes + frontend serving
├── requirements.txt    # Python dependencies
├── vercel.json         # Vercel deployment configuration
│
├── static/
│   ├── css/style.css   # All styles
│   ├── js/app.js       # All frontend logic
│   └── images/         # Static assets (logo etc.)
│
├── templates/
│   └── index.html      # Single-page app shell
│
├── db/
│   ├── schema.sql          # Full database schema
│   └── setup_new_tables.sql # Migration for newer tables (projects, teams, feedback)
│
└── scripts/            # One-off utility scripts used during migration (not deployed)
```

## Stack

| Layer | Technology |
|---|---|
| Backend | Flask (Python) |
| Database | Supabase (PostgreSQL) via psycopg2 |
| Frontend | Vanilla HTML/CSS/JS (SPA) |
| Hosting | Vercel (Serverless Python) |
| AI | Google Gemini 2.5 Flash (with local fallback) |

## Deployment

**Vercel Environment Variables required:**

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase Transaction Pooler connection string |
| `GEMINI_API_KEY` | Google AI API key for chatbot |

**Database URL format:**
```
postgresql://postgres.<project-ref>:<password>@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres
```

## Running Locally

```bash
pip install -r requirements.txt
python app.py
```

App starts at `http://localhost:5000`.
