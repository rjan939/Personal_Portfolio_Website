# Ryan Jan — Portfolio

Static site, no build step, no dependencies. Plain HTML/CSS/JS.

## Preview locally

Just open `index.html` in a browser — no server required. If you prefer a local
server (e.g. for testing relative-path edge cases), any static server works:

```bash
python -m http.server 8000
```

## Structure

```
index.html
css/style.css
js/main.js          nav + scroll-reveal
js/control-demo.js  hero canvas widget (step-response simulation)
assets/resume/       resume PDF
assets/favicon.svg
```

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. On vercel.com, "Add New Project" → import that repo.
3. Framework preset: **Other** (no build command, no output directory needed —
   it's static HTML). Deploy.

To update the resume, replace `assets/resume/Ryan_Jan_Resume.pdf` and redeploy.
