# M1hono Toolkit Box

Toolkit Box is a VitePress-based interface for several game-related utilities:

- Fate/Grand Order servant portrait extraction and card generation
- Arknights operator portrait extraction and story occurrence tracking
- Minecraft locale JSON editing
- Manaweave guidebook, ritual recipe, and runescribing recipe editors

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
