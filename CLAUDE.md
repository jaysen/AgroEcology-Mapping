# Claude Code Instructions

## Project Spec

Always read [docs/ProjectSpec.md](docs/ProjectSpec.md) at the start of each conversation for full project context and requirements.

## Data Files

Source data is in `docs/private/` (gitignored):

- `data/private/Map-data-20260331.ods` — master spreadsheet
- `data/private/Map-data-20260331.csv` — CSV export

## Environment

This project runs inside a **devbox distrobox** container. Always prefix shell/npm commands with `distrobox enter devbox --`:

```sh
distrobox enter devbox -- npm run dev
distrobox enter devbox -- npm run build
```
