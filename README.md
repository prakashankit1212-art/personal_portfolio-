# Ankit's Personal Desktop

A handcrafted Windows-inspired portfolio desktop built with React, TypeScript, and Vite.

## Requirements

- Node.js 22 (see `.nvmrc`)
- npm 10+

## Setup

```bash
npm ci
```

## Run locally

```bash
npm run dev
```

Open the local Vite URL shown in the terminal.

## Checks

```bash
npm test
```

`npm test` runs the TypeScript build check and the production Vite build.

## Production preview

```bash
npm run build
npm run preview
```

## Docker

```bash
docker build -t ankit-personal-desktop .
docker run --rm -p 8080:80 ankit-personal-desktop
```

Then open `http://localhost:8080`.

## Content editing

Editable identity, contact links, and the featured-project configuration live in `src/content/portfolio.ts`. The human-readable identity brief is `portfolio-content/01-personal-identity.md`; the repository research report and individual audit notes live under `portfolio-content/`. Update those content files before changing the desktop shell. Do not publish unverified contribution claims, placeholder URLs, or untested demo links as real project facts.

The current repository audit is saved at:

```text
portfolio-content/02-important-links.md
```

It records verified facts, unverified claims, deployment gaps, contribution questions, and the provisional strongest-three recommendation.

## Arcade

Open `Arcade.exe` from the desktop to launch the game selector. It currently provides:

- `Snake.exe` — the existing data-recovery snake game.
- `Terminal Quest.exe` — a safe three-mission command-line adventure with local XP and progress saving.
- `Memory.exe` — a technology-themed matching game with Easy (4×4), Medium (6×6), and Hard (10×10) grids.

Terminal Quest only reads its predefined virtual files and never executes real shell commands.
Memory.exe uses only predefined technology labels and stores best results locally per difficulty.

## Main menu wallpaper

Paste or copy your wallpaper image into the `public` folder and name it `menu-wallpaper.png`:

```text
public/menu-wallpaper.png
```

The app uses this image for both the desktop wallpaper and the startup screen. Keep the `.png` extension; if your image is a JPG or WEBP, convert it to PNG first. If the file is missing or invalid, the built-in artwork is shown instead.
