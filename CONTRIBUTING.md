# Contributing to CyberSec Toolkit Pro

Thanks for helping keep this learner-friendly toolkit transparent and healthy. Please follow the steps below to ship safe changes.

## Getting Started
1. Fork & clone the repo.
2. Install dependencies:
   - Backend: `cd backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt`
   - Frontend: `cd frontend && npm install`
3. Configure environment:
   - Frontend `.env`: `REACT_APP_API_BASE` + `REACT_APP_ENABLE_DEBUG_SAVE`
   - Backend `.env`: `ALLOWED_ORIGINS`, rate limit vars, Firebase credentials.

## Working Agreements
- Keep dashboards and report persistence in sync. Watch the console for `Dashboard: reports length` and `Dashboard metrics` logs.
- Use the `/debug` route or set `REACT_APP_ENABLE_DEBUG_SAVE=true` to validate Firestore + backend fallbacks with the Debug Save button.
- Sanitize all user input before persisting or sending to the backend.
- Do not log or store raw passwords; the password checker only saves entropy/length metadata.

## Testing
- Unit tests: `cd frontend && npm test -- --watch=false`
- Build: `cd frontend && npm run build`
- E2E smoke (`@playwright/test`):
  ```
  cd frontend
  npx playwright install --with-deps   # first run
  E2E_EMAIL=demo@example.com E2E_PASSWORD=secret npm run test:e2e
  ```
  The test logs in, runs the IP Intel tool, ensures a toast (`Report saved`), and confirms the dashboard reflects the new entry.

## Commit Style
Use the agreed messages when shipping grouped changes:
1. `fix(reports): rebuild dashboard, add debug save, ensure realtime persistence`
2. `feat(tools): add password strength checker (zxcvbn)`
3. `chore(ui): concise home copy, alignment and remove fake claims`

If you need additional commits (docs, hotfixes), follow Conventional Commits (`type(scope): message`) and keep them scoped.

## Pull Request Checklist
- [ ] Dashboard loads without console errors and toasts on new reports.
- [ ] Debug Save works and mirrors to `/api/reports`.
- [ ] Inputs are sanitized on both the client and server.
- [ ] Password checker only saves summaries.
- [ ] README/testing checklist updated if workflows change.

Thanks for contributing! Keep it transparent and learner-friendly.

