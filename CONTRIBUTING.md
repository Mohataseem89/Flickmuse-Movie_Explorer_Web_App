# Contributing to FlickMuse


Thank you for improving FlickMuse
. Keep changes focused, explain the user impact, and preserve the application's responsive and accessible behavior.

## Set up the project

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Add a valid `API_KEY`.
5. Run `npm run dev`.

## Before opening a pull request

Run the complete local quality gate:

```bash
npm run check
```

For UI changes, also verify:

- Home, discover, search, movie, person, and watchlist routes
- A 390 px mobile viewport and a desktop viewport
- Keyboard-only navigation and visible focus
- Loading, empty, error, and retry states
- Reduced-motion behavior when animation is changed

## Project conventions

- Put TMDb network behavior in `src/api/tmdb.js`; avoid component-level fetch duplication.
- Keep shareable filter and pagination state in the URL where practical.
- Use semantic elements before adding ARIA.
- Reuse existing design tokens and component patterns.
- Treat local storage as untrusted input and use the persistence helpers.
- Abort route-scoped requests during cleanup.
- Do not commit API keys, `.env`, generated `dist`, or `node_modules`.

## Pull requests

Use a concise title, explain the problem and approach, include visual evidence for UI work, and list any tradeoffs. Keep refactors separate from unrelated feature changes when possible.

## Issues

Bug reports should include the route, viewport, browser, reproduction steps, expected behavior, actual behavior, and screenshots or console output when relevant.
