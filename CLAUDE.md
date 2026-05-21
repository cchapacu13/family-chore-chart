# Chapa Family Chore Tracker — Claude Code Context

## What This App Is
A family chore tracking web app for the Chapa family. Built in React, deployed on Vercel, with a Redis Labs database for real-time sync across all family devices. The app is accessible via a shared URL and installed as a PWA (app icon) on family phones.

## Who Uses It
- **Chris (Dad)** — Parent mode. Logs chores, manages the chore list, and does cash outs.
- **Wife** — Parent mode. Same access as Chris.
- **Chris Jr (7 years old)** — Kid mode. Can only view progress, no editing.
- **Amelia (10 years old)** — Kid mode. Can only view progress, no editing.

## PIN System
- **Parent PIN:** 2014
- **Kid PIN:** 0000
- Parent mode unlocks: adding/removing chore completions, Cash Out, and the Manage Chores tab.
- Kid mode is read-only — counts are visible but no buttons to change them.

## Kid Themes
Each kid has a personalized color theme:
- **Chris Jr** — toggleable between ⚽ Soccer (green) and 🏀 Basketball (orange)
- **Amelia** — 🎨 Art Studio (purple/pink)
- The whole UI color scheme shifts based on the selected kid and sport toggle

## How Chores Work
- Chores are per-task and paid per completion (not weekly allowance)
- Each chore has a **count** — parents tap + or − to log how many times it was done
- Example: "Make bed" at $0.25 done 5 times = $1.25
- All completions are timestamped and stored in the Activity Log
- **Cash Out** resets all counts to zero and records a summary of what was paid to each kid

## Tech Stack
- **Frontend:** React (Create React App), inline styles only (no CSS files or Tailwind)
- **Backend:** Vercel Serverless Functions (`/api/store.js`)
- **Database:** Redis Labs (via the `redis` npm package)
- **Hosting:** Vercel (auto-deploys on every GitHub push)
- **Repo:** https://github.com/cchapacu13/family-chore-chart

## Project Structure
```
chore-chart/
├── src/
│   ├── App.js          ← All UI and logic lives here (single file)
│   └── index.js        ← React entry point, do not edit
├── api/
│   └── store.js        ← Serverless API for Redis read/write
├── public/
│   ├── index.html
│   └── manifest.json   ← PWA config
├── package.json
├── vercel.json
└── CLAUDE.md           ← This file
```

## Key Environment Variables (set in Vercel)
- `REDIS_URL` — Full Redis Labs connection string including password

## Deployment Workflow
1. Make changes to files locally
2. `git add . && git commit -m "description" && git push`
3. Vercel auto-deploys in ~60 seconds
4. Live URL: your Vercel project URL

## Design Principles
- **Bright & playful** — white backgrounds, bold colors, kid-friendly energy
- **No dark/indigo theme** — the original dark purple theme was removed intentionally (it matched work branding)
- **Inline styles only** — all styling is done via React inline style objects, no external CSS
- **Mobile-first** — the app is primarily used on phones
- **Single file UI** — all components live in `src/App.js` for simplicity

## Current Chore List
| Chore | Pay | Assigned To |
|---|---|---|
| Making the bed | $0.25 | Both |
| Vacuum room | $0.50 | Both |
| Vacuum house | $1.00 | Both |
| Clean Room | $1.00 | Both |
| Laundry (Folding and taking clothes to closet) | $3.00 | Both |
| Feed Pets (Food & Water/Pet) | $0.25 | Both |
| Cleaning Dog Bowls | $0.50 | Both |
| Brush Dogs | $1.00 | Amelia |
| Clean car interior | $0.50 | Both |
| Read for 30 minutes | $0.50 | Both |
| Read for 1 hour | $1.00 | Both |
| Wipe bathroom counter | $0.25 | Both |
| Set table for dinner | $0.50 | Both |
| Clean table after dinner | $0.50 | Both |
| Take out trash | $0.50 | Both |
| Goal Score | $3.00 | Chris Jr |
| Assist | $1.50 | Chris Jr |
| Basketball basket | $0.50 | Chris Jr |
| Rebound | $0.50 | Chris Jr |
| Game Win | $1.00 | Chris Jr |
| Pick up dog poop | $1.00 | Amelia |
| Fill water container | $0.25 | Both |
| Pick up dog toys | $0.25 | Both |
| Wash dishes | $1.00 | Amelia |

## Common Tasks to Ask Claude Code
- "Add a new chore called X for [kid] at $[amount] and push to GitHub"
- "Change the color for Amelia's theme"
- "Add a weekly earnings history page"
- "Push the latest changes to GitHub"
- "Fix the bug where [describe issue]"

## Notes
- Chris is new to coding and deployment — keep explanations clear and always push to GitHub after changes
- The family is based in McAllen, Texas
- Chris Jr is active in competitive soccer and basketball
- Amelia's theme should feel creative and artistic
