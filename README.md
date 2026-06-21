# CareWise Frontend

Static HTML/CSS/JavaScript frontend for CareWise.

Live backend API:

```text
https://carewise-api.onrender.com
```

## Local Run

Use any static server. From this folder:

```bash
python3 -m http.server 4173
```

Open:

```text
http://localhost:4173
```

## Frontend Smoke Test

Check local files before a demo or deploy:

```bash
node scripts/smoke_frontend.mjs
```

Check the Render site after deploy:

```bash
node scripts/smoke_frontend.mjs --base-url https://carewise-frontend.onrender.com
```

The smoke test verifies the app shell cache version, PWA manifest, legal pages,
and safe non-diagnostic wording.

## GitHub Upload

```bash
git init
git add .
git commit -m "Prepare CareWise frontend"
git branch -M main
git remote add origin https://github.com/yashwanthmatta/carewise-frontend.git
git push -u origin main
```

## Render Static Site

1. Create a GitHub repo named `carewise-frontend`.
2. Push this folder to that repo.
3. In Render, create a new Static Site from `yashwanthmatta/carewise-frontend`.
4. Use:
   - Build command: blank
   - Publish directory: `.`
5. After Render gives a public URL, add that URL to backend `CAREWISE_ALLOWED_ORIGINS`.

## Netlify

This folder also includes `netlify.toml`. Connect the GitHub repo in Netlify and use the default settings.

## Safety

This app is a prototype. It is not a diagnosis, prescription, emergency service, or replacement for licensed medical care.
