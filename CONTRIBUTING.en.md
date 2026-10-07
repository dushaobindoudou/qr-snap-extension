# Contributing

[简体中文](CONTRIBUTING.md) · [English](CONTRIBUTING.en.md)

Thanks for improving QR Snap. Search existing issues before opening a new one. Use the repository issue templates for bugs and feature requests. For a security issue, follow [SECURITY.md](SECURITY.md) instead of posting vulnerability details publicly.

## Local setup

Use Node.js 20.19+ and run:

```bash
npm ci
npx playwright install chromium
npm run check
npm test
```

Load `dist` at `chrome://extensions` to check context menus, image scanning, area selection, and generation manually. `npm run dev` rebuilds on source changes; you may need to reload extension pages yourself.

## Sending changes

1. Create a short-lived branch from `main`.
2. Keep each pull request focused on one problem and describe the user-visible change.
3. Update tests and documentation when behavior changes. Review the privacy policy when changing permissions or data handling.
4. Run `npm run check` and `npm test` before opening a pull request.
5. Include results in the pull request template. Chinese and English are both welcome.

The maintainer publishes Chrome Web Store packages. Do not commit `dist/`, `node_modules/`, or ZIP build artifacts.
