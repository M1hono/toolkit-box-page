# M1hono ToolBox

A comprehensive game resource processing toolkit integrating multiple tools for game asset extraction, processing, and translation.

## Tools Included

### Game Character Tools
- FGO Character Portrait Extractor - Extract and process FGO character portraits with diff processing, smart cropping, and face detection
- Arknights Character Tool - Multi-language character portrait extraction, story data synchronization, and batch processing

### Minecraft Tools
- JSON Translator - Resource pack translation tool with batch processing
- Guidebook Generator - Auto-generate game guidebook content for Minecraft No Avalon
- Ritual Generator - Generate ritual configurations and commands
- Runescribing Editor - Visual rune drawing and editing tool

## Features

- Multi-language support (Chinese, English, Japanese)
- OpenCV-powered face detection and smart cropping (thoumore depends on the croping data)
- Real-time canvas preview and manipulation
- Batch download with ZIP packaging
- Responsive modern UI with Vue 3 and Vuetify
- TypeScript type safety with modular composables

## Tech Stack

- VitePress for documentation framework
- Vue 3 + Vuetify for UI components
- OpenCV.js for image processing
- Canvas API for rendering and manipulation
- TypeScript for type safety
- i18n for internationalization

## License

Copyright (c) 2025 M1hono. All Rights Reserved.

This software is proprietary and all rights are reserved. See LICENSE file for details.

## Credits and API Providers

This project is built upon the generous work of various community projects and API providers:

### FGO Data Providers
- **[Atlas Academy](https://apps.atlasacademy.io/)** - Comprehensive FGO database and API
  - API Documentation: https://api.atlasacademy.io/rapidoc
  - Discord Community: https://discord.gg/grandorder
  - Provides servant data, images, and game mechanics for all FGO servers

### Arknights Data Providers
- **[ArknightsAssets](https://github.com/ArknightsAssets/ArknightsGamedata)** - Official game data repository
  - Complete game data for all servers (CN, EN, JP, KR)
  - Story files, character data, and game assets
  - Primary source for all Arknights content

- **[akgcc/arkdata](https://github.com/akgcc/arkdata)** - Community asset repository
  - Character images and thumbnails
  - Story reader integration
  - Image processing pipelines and optimization

### Story Readers
- **[ArknightsStoryTextReader](https://050644zf.github.io/ArknightsStoryTextReader/)** - Text-based story reader
- **[akgcc Story Reader](https://akgcc.github.io/story/)** - Interactive story reader with visual elements

### Infrastructure
- **Cloudflare R2** - CDN and object storage for fast global asset delivery
- **GitHub Pages** - Hosting and continuous deployment
- **GitHub Actions** - Automated data processing and synchronization

## Data Usage and Licensing

All game data accessed through public APIs and repositories remains under their respective licenses:
- FGO data via Atlas Academy API - Free for non-commercial use
- Arknights data via ArknightsAssets - MIT License
- Community assets via akgcc - Respective repository licenses

This project provides processing tools and does not claim ownership of any game assets or API data. All processed data files are also freely available for community use.

## Getting Help

For issues related to:
- **FGO data**: Contact Atlas Academy Discord or check their API docs
- **Arknights data**: Check ArknightsAssets repository issues
- **Tool functionality**: Open an issue in this repository
- **Data processing**: Reach out via GitHub issues - happy to help!

## Development

This is a personal toolkit project for game resource processing and translation workflows.

Repository: https://github.com/M1hono/toolkit-box-page/
