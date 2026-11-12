# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- Presentation tier: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- Logic tier: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- Data tier: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

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

Record your plan here before editing code.

- Presentation tier decision: Implement React components (Activities, Teams, Leaderboard, Workouts) with shared `useApi` hook for data fetching, loading/error states, and empty-state messaging. Wire each component to its corresponding API endpoint.
- Logic tier decision: Implement service functions in order of dependency: data validation first (Activity, Team), then aggregations (Leaderboard), then matching logic (Workout suggestions). Use Mongoose validation errors for 400 responses; throw errors with explicit `.status` property.
- Data tier decision: Add schema validation (required fields and defaults) to all models. Keep Mongoose casts strict: reject malformed ObjectIds with 400, never 500. Seed function already handles idempotent upsertion.
- Activity tracking approach: POST validates userId/teamId exist, rejects malformed IDs with 400. Compute points proportionally from minutes (1 point per minute). Set occurredAt to now if omitted. GET returns all activities with populated user/team references.
- Team management approach: POST validates name is required, rejects missing name with 400. Include members array in responses (populated with ObjectIds). GET returns all teams with members.
- Leaderboard approach: Aggregate activities by team, sum points per team, sort descending by totalPoints, add 1-based rank and teamName. Return early with empty array if no activities.
- Workout suggestions approach: Find user by email (reject non-existent with 404). Analyze recent activities: prioritize workouts matching user's fitnessGoal, then recent activity types. Include `reason` field explaining the match (e.g., "Matches your strength goal" or "Builds on recent running activity").

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
  - Expected: 5/5 passing (User, Team, Activity, Workout validation + seed idempotency)
  - Current failures: User, Team, Activity, Workout schemas missing required fields and defaults; seed already passes
  - Fix: Add `required: true` to required fields and `default: []` to members array in schemas

- API command: `npm run test:api --prefix octofit-tracker/backend`
  - Expected: 4/4 passing (activity CRUD, team CRUD, leaderboard aggregation, workout suggestions with reasoning)
  - Current failures:
    - Activity/Team creation returns 501 instead of 400 for validation errors
    - Leaderboard returns empty array instead of ranked teams by total points
    - Workout suggestions returns wrong workout (no user/goal matching or reason field)
  - Fix: Implement createActivity, createTeam, getLeaderboard, suggestWorkouts in octofitService.ts with proper validation and business logic

- Frontend command: `npm test --prefix octofit-tracker/frontend`
  - Expected: 15/15 passing (render activity/team/leaderboard/workout data, handle loading/empty/error states)
  - Current failures: All components show "Implementation pending"; no API calls or data rendering
  - Fix: Implement Activities, Teams, Leaderboard, Workouts components with fetch logic and state management

- Backend build command: `npm run build --prefix octofit-tracker/backend`
  - Expected: Build succeeds with no TypeScript errors
  - Current: Should pass if types are correct

- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
  - Expected: Build succeeds with no TypeScript errors
  - Current: Should pass if component types are correct
