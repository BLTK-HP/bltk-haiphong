---
description: Launch the BLTK Haiphong dev server and verify it's running
---

# Run skill — BLTK Haiphong

## Launch

```bash
npm run dev &
```

Dev server starts on **http://localhost:5173** (Vite default).

## Verify

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/
```

Expected: `200`. If not, wait 3–5 seconds and retry.

## Notes

- Requires Node.js and `npm install` already done.
- Firebase is cloud-hosted — no local emulator needed.
- Production URL: https://bltk-haiphong.web.app
- Deploy: `npm run build && npx firebase deploy --only hosting`
