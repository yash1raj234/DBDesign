# DBDesign

> **Type in plain English. Get a production-ready database schema, SQL, and migration file — instantly.**

DBDesign Platform is an AI-powered database design tool that converts natural language descriptions into complete database schemas. Describe your data model in plain English and get a live interactive ERD canvas, SQL statements, migration files, and Prisma schemas — all editable, all downloadable.

![DBDesign Platform](https://img.shields.io/badge/Status-In%20Development-teal?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?style=flat-square&logo=fastapi)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

---

## What It Does

You type this:

```
A blog platform where users can write posts, leave comments on posts,
and follow other users. Posts can have multiple tags.
```

You get this:

- ✅ Interactive **ERD Canvas** — drag, edit, and rearrange tables visually
- ✅ **SQL output** — ready to run CREATE TABLE statements
- ✅ **Migration file** — production-ready database migration
- ✅ **Prisma schema** — drop it straight into your Next.js project
- ✅ **DBML export** — compatible with dbdiagram.io
- ✅ **Shareable link** — share your schema with your team

---

## Features

### Core
- **Natural language → Schema** — Powered by Google Gemini 1.5 Flash
- **Interactive ERD Canvas** — Built with React Flow, supports drag, zoom, minimap, and auto layout
- **Monaco SQL Editor** — Same editor as VS Code, with full SQL syntax highlighting
- **Multi-format export** — `.sql`, `.prisma`, `.dbml`, `.json`
- **Migration file generation** — Ready to run, version-stamped migration files

### AI-Powered
- **Iterative Refinement** — Chat with your schema: *"add a reviews table linked to products"*
- **Schema Explain Mode** — AI explains every design decision it made
- **Redis Caching** — Identical prompts never hit the AI API twice

### Editing & Customization
- **Inline field editing** — Click any field on the ERD to rename, retype, or toggle nullable
- **Multiple DB targets** — PostgreSQL, MySQL, SQLite
- **Auto layout toggle** — Switch between Hierarchical and Radial layouts
- **PNG / SVG canvas export** — Download your ERD as an image

### Productivity
- **Templates library** — Pre-built starters: E-commerce, Blog, SaaS Multi-tenant, Hospital Management
- **Project history** — Last 10 generated schemas saved locally
- **Version snapshots** — Every edit saves a snapshot, roll back any time
- **Shareable links** — `/s/xyz123` — anyone can view your schema read-only

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| Next.js 14 | React framework with App Router |
| React Flow | ERD canvas — nodes, edges, drag |
| Monaco Editor | SQL / schema code view |
| Tailwind CSS | Styling |
| shadcn/ui | UI components |
| dagre / elkjs | Auto layout engine for ERD |

### Backend
| Technology | Purpose |
|---|---|
| FastAPI | REST API server |
| Python | Backend language |
| Pydantic | Request / response schema validation |
| Google Gemini 1.5 Flash | AI schema generation (free tier) |

### Database & Cache
| Technology | Purpose |
|---|---|
| PostgreSQL | Store saved diagrams and version history |
| Redis | Cache AI responses, session data |
| Prisma ORM | Database access layer |

### DevOps
| Technology | Purpose |
|---|---|
| Docker + Docker Compose | Local development environment |
| GitHub Actions | CI/CD pipeline |
| Railway | Cloud hosting |
| Nginx | Reverse proxy |

---

## API Endpoints

```
POST   /generate        →  plain text → JSON schema + SQL + migration
POST   /refine          →  existing schema + follow-up → updated schema
POST   /explain         →  schema → AI explanation of design decisions
GET    /schema/:id      →  load a saved schema (shareable link)
PUT    /schema/:id      →  save edits + create version snapshot
```

---

## Project Structure

```
dbdesign-platform/
├── frontend/                  # Next.js 14 application
│   ├── app/
│   │   ├── page.tsx           # Landing page
│   │   ├── generate/
│   │   │   └── page.tsx       # Generator input page
│   │   └── output/
│   │       └── page.tsx       # ERD + SQL output page
│   ├── components/
│   │   ├── canvas/            # React Flow ERD components
│   │   ├── editor/            # Monaco SQL editor wrapper
│   │   ├── chat/              # Iterative refinement chat
│   │   └── ui/                # shadcn/ui components
│   └── lib/
│       ├── api.ts             # API client
│       └── schema.ts          # Schema type definitions
│
├── backend/                   # FastAPI application
│   ├── main.py                # App entry point
│   ├── routes/
│   │   ├── generate.py        # /generate endpoint
│   │   ├── refine.py          # /refine endpoint
│   │   ├── explain.py         # /explain endpoint
│   │   └── schema.py          # /schema CRUD endpoints
│   ├── services/
│   │   ├── gemini.py          # Gemini API integration
│   │   ├── sql_generator.py   # JSON → SQL transformer
│   │   ├── migration.py       # Migration file generator
│   │   └── cache.py           # Redis cache service
│   └── models/
│       └── schema.py          # Pydantic models
│
├── docker-compose.yml
├── nginx.conf
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- Docker + Docker Compose
- Google Gemini API key (free at [aistudio.google.com](https://aistudio.google.com))

### Local Setup

**1. Clone the repository**
```bash
git clone https://github.com/yourusername/dbdesign-platform.git
cd dbdesign-platform
```

**2. Set up environment variables**
```bash
# Backend
cp backend/.env.example backend/.env
# Add your Gemini API key to backend/.env
GEMINI_API_KEY=your_key_here
DATABASE_URL=postgresql://postgres:password@localhost:5432/dbdesign
REDIS_URL=redis://localhost:6379

# Frontend
cp frontend/.env.example frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**3. Start with Docker Compose**
```bash
docker-compose up --build
```

**4. Or run manually**

Backend:
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

**5. Open the app**
```
http://localhost:3000
```

---

## How It Works

```
User input (plain English)
        ↓
FastAPI /generate endpoint
        ↓
Redis cache check → if hit, return cached response
        ↓
Gemini 1.5 Flash API call with structured prompt
        ↓
JSON schema response (tables, fields, relationships)
        ↓
SQL generator → CREATE TABLE statements
Migration generator → versioned migration file
Prisma generator → schema.prisma
DBML generator → .dbml export
        ↓
Response sent to frontend
        ↓
React Flow renders ERD canvas
Monaco Editor renders SQL
PostgreSQL saves the diagram
Share link generated
```

### AI Output Schema

Every Gemini response is validated against this Pydantic schema:

```json
{
  "tables": [
    {
      "name": "users",
      "fields": [
        { "name": "id", "type": "UUID", "primary_key": true },
        { "name": "email", "type": "VARCHAR(255)", "nullable": false, "unique": true },
        { "name": "created_at", "type": "TIMESTAMP", "default": "now()" }
      ]
    }
  ],
  "relationships": [
    {
      "from_table": "posts",
      "from_field": "user_id",
      "to_table": "users",
      "to_field": "id",
      "type": "many_to_one"
    }
  ],
  "sql": "CREATE TABLE users (...);",
  "migration": "-- Migration V1 ...",
  "prisma": "model User { ... }",
  "dbml": "Table users { ... }"
}
```

---

## Roadmap

### MVP (Current)
- [x] Natural language → schema generation
- [x] Interactive ERD canvas
- [x] SQL + migration + Prisma export
- [x] Iterative refinement chat
- [x] Shareable links
- [x] Templates library
- [x] Project history

### V2
- [ ] Schema linter — flag missing indexes, nullable issues
- [ ] Normalization score — 1NF / 2NF / 3NF badge
- [ ] Reverse mode — import existing SQL → generate ERD
- [ ] Team collaboration — real-time multiplayer canvas
- [ ] GitHub export — push schema directly to a repo

---

## Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

```bash
# Fork the repo
# Create your branch
git checkout -b feature/your-feature-name

# Commit your changes
git commit -m "feat: add your feature"

# Push and open a PR
git push origin feature/your-feature-name
```

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Author

Built by **Yash** — [AutoMater](https://github.com/yourusername)

> If this project helped you, drop a ⭐ on the repo.
