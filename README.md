# Historical Image Collection Survey — Frontend Prototype

Interactive frontend demonstration for a historical photograph collection survey. This prototype is for client presentation and feedback; it does not include backend, database, real authentication, or production data transmission.

## Stack

- React + TypeScript
- Vite
- Tailwind CSS

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL shown in the terminal (default: `http://localhost:4173`).

## Build

```bash
npm run build
npm run preview
```

## Demonstration flow

1. Login / Registration / Forgot password (simulated)
2. Survey introduction
3. Participant questionnaire
4. Historical picture collection (up to 26 photographs)
5. Picture details
6. Review & submit
7. Submission confirmation (simulated)

## Demo access

- Demo account: `participant@archive.demo` / `history2024`
- Or use any valid email with a password of 6+ characters for the prototype.

## Notes

- Authentication, submission, and password reset are simulated frontend flows.
- Uploaded images are processed locally in the browser for preview.
- Survey progress is stored in browser localStorage for demonstration convenience.
- Use **Restart demonstration** to clear local demonstration state.
