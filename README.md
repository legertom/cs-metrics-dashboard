# CS Metrics Dashboard

Live Talkdesk metrics — Call Acceptance Rate, Schedule Adherence, and QA Score — for every agent and the team as a whole. Runs locally on your Mac.

---

## Before you start — two one-time installs

You only need to do this once, ever.

**1. Node.js**
Download the **LTS** installer from [nodejs.org](https://nodejs.org) and run it. Click through the defaults.

**2. GitHub Desktop**
Download from [desktop.github.com](https://desktop.github.com) and install it. Sign in with your GitHub account.

---

## Get the app onto your Mac

1. Open **GitHub Desktop**.
2. Click **File → Clone Repository…**
3. Click the **URL** tab.
4. Paste: `https://github.com/legertom/cs-metrics-dashboard.git`
5. Choose a folder on your Mac (e.g. your Documents folder).
6. Click **Clone**.

---

## Start the app

1. Open **Finder** and navigate to the `cs-metrics-dashboard` folder you just cloned.
2. Double-click **`start.command`**.

> **macOS security prompt:** The first time you open it, Mac may warn you it's from an unidentified developer. If that happens: right-click `start.command` → **Open** → **Open**. You only need to do this once.

A Terminal window will open and handle everything from here:

- **First run only:** it creates your credentials file and opens it in TextEdit so you can fill in your Talkdesk details (see next section).
- After you save your credentials and press Enter, the app installs its packages and starts up.
- Your browser opens automatically at **http://localhost:3000**.

To stop the app, close the Terminal window.

---

## Filling in your Talkdesk credentials

The first time you run `start.command`, TextEdit will open a file called `.env.local`. It looks like this:

```
TALKDESK_ACCOUNT=youraccountname
TALKDESK_CLIENT_ID=your_client_id
TALKDESK_CLIENT_SECRET=your_client_secret
USE_MOCK_DATA=true
```

Here's what to fill in:

| Line | What to put |
|---|---|
| `TALKDESK_ACCOUNT` | The part of your Talkdesk login URL before `.talkdesk.com` — e.g. if you log in at `acme.talkdesk.com`, put `acme` |
| `TALKDESK_CLIENT_ID` | From Talkdesk Admin → see steps below |
| `TALKDESK_CLIENT_SECRET` | From Talkdesk Admin → see steps below |
| `USE_MOCK_DATA` | Change `true` to `false` once your credentials are filled in |

When you're done, **Save** the file in TextEdit (⌘S) and switch back to the Terminal window.

---

## Creating your Talkdesk API credentials

1. Log in to Talkdesk as an Admin.
2. Go to **Admin → Integrations → API Clients**.
3. Click **Create new client**.
4. Name it something like *CS Metrics Dashboard*.
5. Under **Scopes**, tick:
   - `contacts:read` — Call Acceptance Rate
   - `wfm:read` — Schedule Adherence *(only appears if your plan includes WFM)*
   - `qm:read` — QA Score *(only appears if your plan includes QM)*
6. Click **Save**.
7. Talkdesk shows you a **Client ID** and **Client Secret** — copy them into your `.env.local` file. **The secret is only shown once**, so copy it now before closing that screen.

> If `wfm:read` or `qm:read` don't appear in the scope list, those modules aren't on your current plan. The other metrics will still work; those two will show sample data until the modules are added.

---

## Your credentials are private and will never be shared

The credentials file (`.env.local`) is listed in the app's `.gitignore` file. This means Git automatically ignores it — it will never be included when the app is updated or backed up to GitHub. Only you have it, and it stays on your Mac.

You never need to do anything to protect it. It's handled automatically.

---

## Starting the app on future days

Just double-click **`start.command`** again. It goes straight to starting the server — no setup steps repeat.

---

## What you'll see

| Page | Description |
|---|---|
| **Dashboard** (`/`) | Team KPI cards, 26-week Performance Pulse heatmap, monthly charts |
| **Agents** (`/agents`) | All agents in a sortable table — filter by status, metric, or name |
| **Agent detail** (`/agents/…`) | Individual agent view with their own heatmap and charts |

Use the **Refresh** button (top right of any page) to pull fresh data from Talkdesk without restarting.

---

## Troubleshooting

**The app shows sample data instead of real data**
→ Open `.env.local` in TextEdit and check that `USE_MOCK_DATA=false` and your credentials are filled in (no placeholder text remaining). Save, then click Refresh in the browser.

**"Missing Talkdesk credentials" error in the Terminal window**
→ Same as above — `.env.local` is missing a value.

**The browser doesn't open automatically**
→ Manually go to **http://localhost:3000** in your browser.

**`start.command` won't open**
→ Right-click it → **Open** → **Open** (macOS security step, one time only).
