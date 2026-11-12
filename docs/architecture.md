# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Use a small React Router app with Bootstrap-styled cards that fetch data from the shared API client and render loading, empty, success, and failure states with accessible messaging.
- Logic tier decision: Keep API behavior in Express routes and typed service functions, with deliberate 400/404 handling for missing or invalid inputs instead of leaking Mongoose cast errors.
- Data tier decision: Model validation belongs in Mongoose schemas, while the seed script uses idempotent upserts and preserves unrelated records when moving demo users between teams.
- Activity tracking approach: Validate required user/team references, positive minutes, and compute points from the submitted duration so the API returns a consistent activity record with `user`, `team`, `type`, `minutes`, `points`, and `occurredAt`.
- Team management approach: Require a name and mascot, default members to an empty array, and retain the submitted team member IDs as ObjectIds.
- Leaderboard approach: Aggregate activity totals per team, sort by total points descending, and assign each row a 1-based rank.
- Workout suggestions approach: Match a user's goal and recent activity types to a list of workouts and provide an explanatory reason for the recommendation; return a 404 when no matching seeded user exists.

## Test plan

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — verifies Mongoose contracts and idempotent seed behavior.
- API command: `npm run test:api --prefix octofit-tracker/backend` — verifies activity/team validation, leaderboard ordering, and workout recommendation endpoints.
- Frontend command: `npm test --prefix octofit-tracker/frontend` — verifies the React pages fetch data correctly and present loading/empty/error states.
- Backend build command: `npm run build --prefix octofit-tracker/backend` — ensures the TypeScript Express backend compiles cleanly.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — ensures the React/Vite app builds successfully with the implemented contract behavior.
