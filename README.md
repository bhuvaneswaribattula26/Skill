# SkillSwap Campus

SkillSwap Campus is a full-stack peer learning platform for college students. Students can list skills they can teach, discover people learning those skills, arrange swaps, message one another, track sessions, and find free YouTube learning resources.

## Features

- Secure registration, login, refresh tokens, and profile management
- Teaching and learning skill lists with proficiency levels
- Skill-based member matching and swap requests
- Request accept, decline, and cancel actions
- Session tracking and completion credits
- Swap-based messaging
- Community feed for local development
- YouTube-powered Courses page with server-side API key protection
- Responsive hash-routed frontend served by the Express backend

## Technology

- Frontend: HTML, CSS, vanilla JavaScript
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL with Prisma
- Authentication: JSON Web Tokens and bcrypt
- Course catalog: YouTube Data API v3

## Run locally

### Requirements

- Node.js 20 or newer
- A PostgreSQL database (Supabase PostgreSQL is supported)

### Install and run

```powershell
cd "C:\everything\Skill swap-campus\backend"
npm install
npm run build
npm start
```

Open `http://localhost:4000`.

To stop the server, press `Ctrl + C` in the terminal running it.

## Environment variables

Copy `backend/.env.example` to `backend/.env` and fill in your own values.

```env
PORT=4000
NODE_ENV=development

DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/postgres?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/postgres?sslmode=require"

JWT_ACCESS_SECRET="replace_with_a_long_random_secret"
JWT_REFRESH_SECRET="replace_with_a_different_long_random_secret"
JWT_ACCESS_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

YOUTUBE_API_KEY="your_restricted_youtube_data_api_v3_key"
ALLOWED_EMAIL_DOMAINS="*.edu,*.edu.in,*.ac.in"
CORS_ORIGIN=*
FRONTEND_URL=http://localhost:4000
```

Never commit `.env`, database passwords, JWT secrets, or API keys. The repository `.gitignore` excludes these files.

## Database setup

Apply the Prisma schema:

```powershell
cd backend
npx prisma db push
```

Optional: load the development member profiles used for testing live Explore and swap requests:

```powershell
npm run db:seed
```

## API endpoints

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Service health check |
| `POST /api/v1/auth/register` | Create an account |
| `POST /api/v1/auth/login` | Log in and receive tokens |
| `GET /api/v1/users` | List available members |
| `GET /api/v1/matches` | Get skill matches |
| `GET /api/v1/swaps` | Get swap requests |
| `GET /api/v1/sessions` | Get sessions |
| `GET /api/v1/courses?q=Python` | Search YouTube course resources |

## Deployment

This app can be deployed as one Node web service because Express serves both the frontend and API.

Recommended Render settings:

| Setting | Value |
| --- | --- |
| Root directory | `backend` |
| Build command | `npm install && npm run build` |
| Start command | `npm start` |
| Health check path | `/api/health` |

Configure all environment variables in the deployment provider dashboard. Do not upload your local `.env` file.

## License

This project is intended for educational use.
