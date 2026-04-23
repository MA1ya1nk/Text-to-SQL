# Text-to-SQL AI Database Assistant

Full-stack monorepo with:
- Backend: Django 4.2 + DRF (SQLite default, PostgreSQL optional)
- Frontend: Next.js 14 App Router + TypeScript + Tailwind
- AI: OpenAI `gpt-4o-mini` (Gemini fallback)

## Project Structure

- `backend/`
- `frontend/`
- `.env.example`

## Setup

1. Copy env:
   - Backend: copy `backend/.env.example` to `backend/.env`
   - Frontend: copy `frontend/.env.example` to `frontend/.env.local`
   - Fill API keys and settings in those local files.
2. Backend:
   - `cd backend`
   - `python -m venv .venv`
   - `.venv\Scripts\activate` (Windows) or `source .venv/bin/activate` (Unix)
   - `pip install -r requirements.txt`
   - `python manage.py makemigrations`
   - `python manage.py migrate`
   - `python manage.py seed_ecommerce`
   - `python manage.py runserver 8000`
3. Frontend:
   - `cd frontend`
   - `npm install`
   - `npm run dev`
4. Open:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8000/api/`

## Database Modes

- Default mode (recommended for dev): SQLite
  - Keep `USE_SQLITE=True` in env.
  - No Docker or PostgreSQL service required.
- Optional PostgreSQL mode:
  - Set `USE_SQLITE=False`
  - Configure `POSTGRES_*` env vars to your local/remote PostgreSQL instance.

## API Endpoints

- `GET /api/schema/`
- `GET /api/schema/suggestions/`
- `POST /api/query/`
- `POST /api/query/followup/`
- `GET /api/history/`
- `POST /api/export/`

## Notes

- SQL validator blocks non-SELECT and dangerous patterns.
- Query timeout is 10 seconds.
- `LIMIT 1000` is auto-added when missing.

## Example Questions (10)

1. Total revenue by month for the last 12 months.
2. Top 10 customers by total spend.
3. Top 20 products by quantity sold.
4. Average order value by customer tier.
5. Cancellation rate by month.
6. Products with highest average review rating (min 20 reviews).
7. Revenue by category for this quarter.
8. Daily orders for the last 30 days.
9. Countries with the most customers.
10. Repeat customers with more than 10 orders.
