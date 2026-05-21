# Family Chore Chart

A shared family chore tracker with parent/kid PIN modes, per-task counting, activity log, and real-time sync across all devices.

---

## Deploy in 5 Steps

### 1. Push to GitHub
Create a new repo on GitHub (name it `family-chore-chart`), then run:

```bash
cd family-chore-chart
git init
git add .
git commit -m "Initial chore chart"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/family-chore-chart.git
git push -u origin main
```

### 2. Connect to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New → Project**
3. Import your `family-chore-chart` GitHub repo
4. Leave all settings as default — Vercel auto-detects React
5. Click **Deploy**

### 3. Add Vercel KV (the database)
1. In your Vercel project dashboard, go to **Storage** tab
2. Click **Create Database → KV**
3. Name it `chore-chart-kv` and click **Create**
4. Click **Connect to Project** and select your project
5. Vercel automatically adds the required environment variables

### 4. Redeploy
After connecting KV, trigger a fresh deploy:
- Go to **Deployments** tab → click the three dots on the latest deploy → **Redeploy**

### 5. Share the URL
Your app is live at `https://your-project-name.vercel.app`  
Share that URL with your wife and add it to the home screen on each phone.

---

## Adding to Home Screen (iPhone)
1. Open the URL in Safari
2. Tap the **Share** button (box with arrow)
3. Tap **Add to Home Screen**
4. Tap **Add** — it will appear as an app icon

## Adding to Home Screen (Android)
1. Open the URL in Chrome
2. Tap the **three dots** menu
3. Tap **Add to Home Screen**

---

## Default PINs
- **Parent PIN:** `1234`  
- **Kid PIN:** `0000`

To change the PINs, edit these two lines in `src/App.js`:
```js
const PARENT_PIN = "1234";
const KID_PIN = "0000";
```
Then push the change to GitHub — Vercel redeploys automatically.

---

## What Each Mode Can Do

| Feature | Kid Mode | Parent Mode |
|---|---|---|
| View chore counts | ✅ | ✅ |
| Add/remove completions | ❌ | ✅ |
| View activity log | ✅ | ✅ |
| Cash Out | ❌ | ✅ |
| Add/edit/delete chores | ❌ | ✅ |
