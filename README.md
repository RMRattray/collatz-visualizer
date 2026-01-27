# Collatz Visualizer

Canvas-based plotter for **odd-to-odd Collatz journeys**.

## Setup

1. Install TypeScript

```bash
npm install
```

2. Build TypeScript

```bash
npm run build
```

3. Serve the files (use any HTTP server, e.g., Python's `python -m http.server` or Node's `npx serve`)

The `index.html` file loads the compiled JavaScript from `dist/main.js` and CSS from `css/styles.css`.

## What it does

- Left: a square canvas with a **grid of white dots**
- Right: control panel
  - `x-axis` dropdown (binary length / zeroes / ones / consecutive zeroes / consecutive ones / switches)
  - `y-axis` dropdown (all options except the current x-axis choice)
  - centered number input + right-arrow button to add a journey
  - `X` button clears all journeys (canvas returns to dot-grid only)

Journeys are stored:
- **in a cookie** as arrays of odd numbers
- **in memory** with memoized computed properties per odd number (including `n mod 3`)

