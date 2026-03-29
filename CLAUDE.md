# Claude Code Instructions

## Project Spec
Always read [docs/ProjectSpec.md](docs/ProjectSpec.md) at the start of each conversation for full project context and requirements.

## Data Files

Source data is in `docs/private/` (gitignored):

- `Map data FINAL 10Mar26.xlsx` — master spreadsheet
- `Map data FINAL 10Mar26.xlsx - final map data.csv` — CSV export

## Environment

This project runs inside a **devbox distrobox** container. Always prefix shell/npm commands with `distrobox enter devbox --`:

```sh
distrobox enter devbox -- npm run dev
distrobox enter devbox -- npm run build
```
