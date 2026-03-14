# Imani OS

A privacy-first, local-first agency reporting tool built with React + TypeScript.

## Desktop (Tauri)

This repo includes a Tauri desktop shell under `src-tauri/`.

- Targets: **Windows (NSIS/MSI)** and **macOS (DMG)**
- Enabled native APIs: **file dialogs + filesystem** (used for JSON backup import/export)
- CSP is set to allow outbound calls only to `https://api.openai.com` for AI features.

### Notes

- Backups **never include** your OpenAI API key; imports keep your existing local API key.
- If you hit strange desktop build/runtime issues, try:
  - <dyad-command type="restart"></dyad-command>
  - <dyad-command type="rebuild"></dyad-command>
  Look for the action button above the chat input.