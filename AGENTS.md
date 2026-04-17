# Repository Guidelines

## Project Structure & Module Organization
The AfyaNexus system is a multi-service monorepo:
- **`client/`**: Next.js 15 application using the App Router. Role-based dashboards are located in `app/dashboard/(athlete|coach|nutritionist)`. Uses Tailwind CSS and Framer Motion for the UI.
- **`server/`**: Express.js backend (CommonJS). Core logic resides in `src/controllers/` and `src/services/`.
- **`ml/`**: Python Flask service for injury risk prediction. Uses `model.pkl` (GradientBoosting) with a rule-based fallback in `app.py`.
- **`android-health-connect-bridge/`**: Kotlin/Android application for syncing health data.

## Build, Test, and Development Commands
### Frontend (Client)
- **Install dependencies**: `npm install`
- **Development mode**: `npm run dev` (runs on port 4000 as configured in the launcher)
- **Build**: `npm run build`
- **Lint**: `npm run lint`

### Backend (Server)
- **Install dependencies**: `npm install`
- **Development mode**: `npm run dev` (uses nodemon)
- **Start**: `npm run start`
- **Test**: `npm run test` (runs `node --test` on files in `tests/*.test.js`)

### ML Service
- **Setup**: `pip install -r requirements.txt`
- **Start**: `python app.py` (runs on port 5001)

### Integrated Launcher
- **Windows**: `start-afyanexus.bat` (starts all services in separate terminals)

## Coding Style & Naming Conventions
- **Frontend**: Next.js 15 conventions. Strict TypeScript is enabled. Uses `@/*` alias for root imports.
- **Backend**: CommonJS modules. Uses `express-validator` for request validation and `jsonwebtoken` for auth.
- **General**: Follow role-based access control (RBAC) patterns established in `server/src/middleware/auth.js`.

## Testing Guidelines
- The project uses native Node.js test runner for backend testing (`node --test`).
- Unit and integration tests are located in `server/tests/`.
- Ensure all tests pass before major changes: `cd server && npm run test`.

## Commit & Pull Request Guidelines
- Follow descriptive commit messages.
- Use prefixes like `feat:`, `fix:`, or `chore:` for clear versioning history.
- Ensure `README.md` and documentation in `docs/` are updated for breaking changes.
