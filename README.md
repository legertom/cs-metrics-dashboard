# CS Metrics Dashboard

A private Next.js dashboard that pulls Call Acceptance Rate, Schedule Adherence, and QA Score from Talkdesk and displays them as KPI cards, a 26-week heatmap, and monthly charts — for every agent and for the team as a whole.

---

## Quick start (sample data, no API needed)

If you just want to run the app and see how it looks before connecting Talkdesk:

```bash
git clone https://github.com/legertom/cs-metrics-dashboard.git
cd cs-metrics-dashboard
cp .env.local.example .env.local   # USE_MOCK_DATA=true is already set
npm install
npm run dev
```

Open **http://localhost:3000** in your browser. You'll see realistic sample data for 24 agents.

---

## Connecting to live Talkdesk data

### Step 1 — Prerequisites

- [Node.js 18 or later](https://nodejs.org/) — run `node -v` to check. If you don't have it, download the LTS installer from nodejs.org.
- Git — run `git --version` to check. Comes pre-installed on Mac.

### Step 2 — Clone the repo

Open **Terminal** (press `⌘ Space`, type *Terminal*, press Enter).

```bash
git clone https://github.com/legertom/cs-metrics-dashboard.git
cd cs-metrics-dashboard
npm install
```

### Step 3 — Create your Talkdesk API client

You need to generate OAuth credentials inside Talkdesk. This takes about 2 minutes.

1. Log in to Talkdesk as an Admin.
2. Go to **Admin → Integrations → API Clients**.
3. Click **Create new client**.
4. Give it a name (e.g. *CS Metrics Dashboard*).
5. Under **Scopes**, select:
   - `contacts:read` — for Call Acceptance Rate
   - `wfm:read` — for Schedule Adherence *(only available if your plan includes WFM)*
   - `qm:read` — for QA Score *(only available if your plan includes QM)*
6. Click **Save**. Talkdesk will show you a **Client ID** and **Client Secret** — copy both now. The secret is only shown once.

> **Plan check:** If you don't see `wfm:read` or `qm:read` in the scope list, those modules aren't on your current plan. The dashboard will still run for the metrics that are available; the others will show sample data until the modules are added.

### Step 4 — Configure your environment file

```bash
cp .env.local.example .env.local
```

Open `.env.local` in any text editor (TextEdit works, or open it from Finder). Fill in your values:

```
TALKDESK_ACCOUNT=acme          ← the part before ".talkdesk.com" in your login URL
TALKDESK_CLIENT_ID=abc123      ← from Step 3
TALKDESK_CLIENT_SECRET=xyz789  ← from Step 3
USE_MOCK_DATA=false             ← change this line from "true" to "false"
```

Save and close the file.

> **Security note:** `.env.local` is listed in `.gitignore` — it will never be committed or pushed to GitHub. Your credentials stay on your machine only.

### Step 5 — Start the app

```bash
npm run dev
```

Open **http://localhost:3000**. The dashboard will fetch 26 weeks of real data from Talkdesk on page load. Use the **Refresh** button at any time to pull the latest numbers.

---

## Pages

| URL | What you'll find |
|---|---|
| `/` | Team-level KPI cards, 26-week Performance Pulse heatmap, and monthly charts |
| `/agents` | All 24 agents in a sortable, filterable table with Copy and View buttons |
| `/agents/[name]` | Individual agent view — same KPI cards, heatmap, and charts scoped to one person |

---

## Filters on the Agents page

The filter bar at the top of `/agents` has three independent controls:

- **Search** — type any part of an agent's name
- **Status** — All / On Track (all metrics ≥ 85%) / Needs Attention (any metric < 85%)
- **Below target** — show only agents where a specific metric is under the 85% threshold

Filters combine. The count on the right ("5 of 24") updates live.

---

## Switching back to sample data

Set `USE_MOCK_DATA=true` in `.env.local` and restart the dev server. Useful if you want to demo the dashboard without an internet connection.

---

## Troubleshooting

**"Missing Talkdesk credentials" error**
→ Make sure you created `.env.local` (not just `.env.local.example`) and that `USE_MOCK_DATA=false`.

**Metrics show sample data even with `USE_MOCK_DATA=false`**
→ The real API fetch functions have TODO stubs that throw until implemented. Check the terminal output for the specific error. Common causes: wrong account name, expired credentials, or a plan that doesn't include WFM/QM.

**Port 3000 already in use**
→ Next.js will automatically use port 3001 (or the next available port) and print the URL in the terminal.

**`npm install` fails**
→ Make sure you're inside the `cs-metrics-dashboard` folder (`cd cs-metrics-dashboard`) before running the command.

---

## Tech stack

- [Next.js 15](https://nextjs.org/) (App Router, TypeScript)
- [Tailwind CSS 3](https://tailwindcss.com/)
- [Recharts](https://recharts.org/) for charts
- Talkdesk OAuth 2.0 client credentials flow — token cached server-side, refreshed 60 s before expiry
