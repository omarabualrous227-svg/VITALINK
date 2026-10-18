# VITALINK 2076 — v3.0 Multi-Device Backend

Architecture:
- Frontend: VITALINK v2.6 hardened UI
- Preferred backend: Node.js + Express
- Database: SQLite
- Realtime: WebSocket
- Fallback: zero-dependency Node server using the same REST/WebSocket contract

Run on Windows:
1. Double-click `START_VITALINK_WINDOWS.bat`.
2. Open `http://localhost:8080`.
3. For another device on the same LAN/Wi-Fi, open `http://<SERVER-LAN-IP>:8080`.

Role URLs:
- `?role=patient`
- `?role=dispatch`
- `?role=ems`
- `?role=hospital`

API:
- GET `/api/health`
- GET `/api/state`
- PUT `/api/state`
- GET `/api/events?limit=50`
- GET `/api/cases`
- WebSocket `/ws`

Concurrency:
- Server uses an independent `serverRevision`.
- Every write carries `expectedRevision`.
- Stale writes receive HTTP 409 and cannot overwrite a newer state.

Persistence:
- SQLite database: `data/vitalink.sqlite`
- WAL mode enabled.
- Every accepted state update is also written to `sync_events`.

Fallback:
- `START_VITALINK_LITE_WINDOWS.bat` needs Node.js 22.5+ only and does not need npm packages.

Security boundary:
- Authentication/RBAC is not implemented yet.
- Do not expose this MVP directly to the public internet.
- Do not use real patient data in this prototype.

MVP boundaries remain:
- 911 workflow simulated.
- Hospital readiness synthetic.
- Matching is explainable decision support.
- Google Maps is external geographic context/navigation.
