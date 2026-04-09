# M1hono Toolkit Box

Toolkit Box is a VitePress-based interface for several game-related utilities:

Current release: `2.1.0`

- Fate/Grand Order servant portrait extraction and card generation
- Arknights operator portrait extraction and story occurrence tracking
- Minecraft locale JSON editing
- Manaweave guidebook, ritual recipe, and runescribing recipe editors

## Release Highlights

- Synced the current Crychic sidebar runtime, including `collapseControl` for parent-controlled folding in the current sidebar view.
- Kept `viewControl` for advanced nested-root traversal ownership and child escape rules.
- Refreshed the shared navigation dropdown layouts used across the site header.
- Fixed the config-time filesystem bridge used by sidebar generation so builds stay portable across case-sensitive environments.

## Local Development

```bash
cd docs
yarn install
yarn dev
```

## Build

```bash
cd docs
yarn build
```

## Structure

```text
docs/
├── .vitepress/   # theme, config, runtime utilities
├── src/          # locale content and tool entry pages
└── package.json  # docs workspace scripts and dependencies
```

## Deployment Target

- Live site: https://tool.mihono.cn/
- Repository: https://github.com/M1hono/toolkit-box-page/

## Changelog

- See [CHANGELOG.md](./CHANGELOG.md) for release notes.
