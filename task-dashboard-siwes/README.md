# Task Dashboard

A Kanban-style task manager built for SIWES. React frontend, Node.js/Express backend,
MongoDB Atlas for persistence, with a dark glassmorphism UI matching the earlier Weather App.

## Features

- Create, edit, delete tasks — title, description, due date, priority, category/tag
- Kanban board: To Do / In Progress / Done, with drag-and-drop between columns (`@hello-pangea/dnd`)
- Filter/search by priority, category, or free-text search
- Overdue tasks are highlighted; a progress bar shows overall completion
- If the backend is unreachable, the app transparently falls back to `localStorage`
  so you can keep working, and shows an "offline" badge
- Simple username/password login (JWT) — each user only sees their own tasks

## Project structure

```
task-dashboard-siwes/
├── backend/
│   ├── server.js
│   ├── models/Task.js
│   ├── routes/tasks.js
│   └── .env.example
└── frontend/
    └── src/
        ├── App.js / App.css
        ├── components/ (Board, Column, TaskCard, TaskForm, FilterBar)
        └── services/taskService.js   ← API calls + localStorage fallback
```

## 1. Set up MongoDB Atlas

1. Create a free cluster at https://www.mongodb.com/cloud/atlas.
2. Add a database user and allow your IP (or `0.0.0.0/0` for quick testing).
3. Copy the connection string — you'll paste it into `backend/.env`.

## 2. Run the backend

```bash
cd backend
npm install
cp .env.example .env     # paste your MongoDB URI, and set JWT_SECRET to any long random string
npm run dev               # starts on http://localhost:5000
```

## 3. Run the frontend

```bash
cd frontend
npm install
cp .env.example .env      # defaults to http://localhost:5000/api, adjust if needed
npm start                 # opens http://localhost:3000
```

## 4. Deploy

- **Backend → Railway**: create a new project from this `backend/` folder, set the
  `MONGODB_URI` and `CLIENT_ORIGIN` environment variables in Railway's dashboard.
- **Frontend → Vercel**: import the `frontend/` folder, set `REACT_APP_API_URL` to
  your deployed Railway URL (e.g. `https://your-app.up.railway.app/api`).
- Once both are live, update `CLIENT_ORIGIN` on Railway to your Vercel URL so CORS allows it.

## API reference

| Method | Route                  | Purpose                                   |
|--------|-------------------------|--------------------------------------------|
| POST   | `/api/auth/register`    | Create an account, returns a JWT          |
| POST   | `/api/auth/login`       | Log in, returns a JWT                     |
| GET    | `/api/tasks`            | List the logged-in user's tasks (supports `?priority=&category=&search=`) |
| POST   | `/api/tasks`             | Create a task                             |
| PUT    | `/api/tasks/:id`         | Full edit of a task                       |
| PATCH  | `/api/tasks/:id/move`    | Update just `status`/`order` (drag-and-drop) |
| DELETE | `/api/tasks/:id`         | Delete a task                             |

## Notes for the SIWES report

- The Task model uses an enum `status` field (`todo` / `in-progress` / `done`) rather than
  a separate columns collection — simpler schema, and sufficient for a fixed 3-column board.
- Drag-and-drop updates the UI immediately (optimistic update) and persists to the backend
  in the background via the `/move` endpoint, rather than waiting on the network round-trip.
- The `taskService.js` layer is the single place that decides server vs. localStorage,
  so components never need to know which one is in use.
- Every task carries a `userId` set from the JWT on the server (never from client input),
  and every query/update is scoped to `req.userId` — so one user can never read or edit
  another user's tasks even if they guessed a task's ID.
