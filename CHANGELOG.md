# Changelog

All notable changes to this repository are documented in this file.

## [2.1.0] - 2026-04-07

### Added

- Added `viewControl` regression coverage for root traversal defaults, descendant defaults, and child escape behavior.

### Changed

- Synced the shared Crychic sidebar runtime and shared navigation layouts into Toolkit Box.
- Aligned the published package version with the site runtime version and documented the new release in the READMEs.

### Fixed

- Reworked the sidebar config-time filesystem bridge to use the same relative-import contract as Crychic.
- Renamed the shared filesystem entrypoint to `fileSystem.ts` so case-sensitive environments resolve the runtime imports correctly.
