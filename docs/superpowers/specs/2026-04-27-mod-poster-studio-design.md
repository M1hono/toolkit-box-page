# Mod Poster Studio Design

Date: 2026-04-27

## Goal

Build a `Self` module tool named Mod Poster Studio. It is a plain Vuetify image editor for making mod release images, with specialized poster templates layered on top of a general-purpose image editing workflow.

The tool must support:

- Generic image editing: image/text/icon/shape layers, transforms, ordering, visibility, locking, effects, project save/load, and PNG export.
- Mod poster workflows: 400x400 CurseForge-style covers and 720x450 MCMOD-style covers.
- Template packages discoverable by path and `template.json`, so templates made elsewhere can be deployed locally without code changes.
- Built-in default assets from `Downloads/封面模板`, `Downloads/icons`, and `Downloads/字体` when available.
- User-imported assets that can be cached in the browser and reused from the asset library.
- Direct image import to the canvas as normal editable image layers.
- Style effects broad enough for poster work: dust/grain, natural white-dot texture overlays, frosted glass, blur, glow, bloom, color adjustments, pixelation, chromatic effects, and future shader/post-processing presets.

## Visual Direction

The UI must be plain and workbench-like:

- Use Vuetify for controls and panels.
- No gradients.
- Prefer borders, spacing, and density over decorative shadows.
- Use 4px-scale radii where possible, matching the cleaner tool pages such as `JsonTranslator` and `RitualGenerator`.
- Avoid marketing-style layout. The first screen is the editor surface.

## Architecture

The tool has three major layers.

### Editor Core

Use Konva as the main editor interaction model:

- Stage, layers, selection, transformer, pointer interactions.
- Image, text, shape, icon, and frame layers.
- Layer list state: ordering, visibility, lock state, labels.
- Project JSON serialization.
- Basic export orchestration.

Konva remains the source of truth for edit state. PixiJS and Three.js are effect renderers, not the primary document model.

### Template System

Templates are directory packages discovered from their path. Any directory with a valid `template.json` can be treated as a template package.

Initial built-in templates:

- `generic-frame`: unthemed base frames from `框.png` and `框架mcmod.png`.
- `theme-clear-frame`: a theme-preserving clear frame template. KubeJS or MCR can be used as the first source preset, but the template id is not tied to a specific mod. It keeps the theme structure while making center icon, colors, text, texture, and effects replaceable parameters.

Templates instantiate editable layers instead of flat images.

### Asset And Effects

Assets come from built-in public files, user cache, and local catalog scanning.

Effects are non-destructive stacks attached to layers. The rendering pipeline is:

1. Konva editor state and layer composition.
2. PixiJS/WebGL effect preview and filter chains for the initial implementation.
3. Three.js advanced effect adapters for post-processing and future 3D/material effects.
4. Offscreen canvas export that composites editor layers and effect renderer output into final PNG.

Every effect plugin must define both preview behavior and export behavior so the final PNG stays close to what the editor shows.

## Template Package Contract

Template packages should be portable. Paths in `template.json` are relative to the template directory.

Built-in root:

```text
docs/src/public/self/poster-studio/templates/
```

Suggested local root:

```text
~/Downloads/PosterStudioTemplates/
```

Suggested package layout:

```text
theme-clear-frame/
  template.json
  frames/
    curseforge.png
    mcmod.png
  slots/
    center-icon.png
  previews/
    preview.png
```

Example manifest:

```json
{
  "schemaVersion": 1,
  "id": "theme-clear-frame",
  "name": "Theme Clear Frame",
  "kind": "poster-template",
  "sourcePreset": "kubejs",
  "sizes": {
    "curseforge": {
      "width": 400,
      "height": 400,
      "frame": "frames/curseforge.png"
    },
    "mcmod": {
      "width": 720,
      "height": 450,
      "frame": "frames/mcmod.png"
    }
  },
  "slots": [
    { "id": "background", "type": "image", "required": false },
    { "id": "centerIcon", "type": "image", "default": "slots/center-icon.png" },
    { "id": "title", "type": "text", "required": false },
    { "id": "texture", "type": "effect", "required": false }
  ],
  "parameters": [
    { "id": "frameTint", "type": "color", "default": "#8a5a1f" },
    { "id": "accentTint", "type": "color", "default": "#d59a27" },
    { "id": "textureStrength", "type": "number", "default": 0.18, "min": 0, "max": 1 }
  ]
}
```

## Default Asset Collection

Default assets must include:

- `Downloads/封面模板`: frame and cover template PNGs.
- `Downloads/icons`: game-icons PNG library and generated search index.
- `Downloads/字体`: font files, if the directory exists.

If `Downloads/字体` is not present on the machine, the scan should record the missing directory without failing. Current scan found two `.ttf` files under `Downloads/GUI-优质-RPGUI包-RPG UI pack (by Franuka)/`, which may be offered as optional font imports.

Large asset directories should not be bundled wholesale:

- `Downloads/ICON` is about 1.1GB and has 12653 PNG files.
- `Downloads/TILE` has hundreds of images and some GIFs.
- `Downloads/GUI-*` contains many UI packs and previews.

These should be scanned into catalogs. The user can select assets or collections to import into the browser cache or copy into public built-in assets later.

## Browser Cache

Use IndexedDB for imported assets, templates, projects, and recents. Do not use localStorage for large image data.

Stores:

- `assets`: `id`, `name`, `kind`, `mime`, `blob`, `width`, `height`, `tags`, `source`, `createdAt`.
- `assetCollections`: `id`, `name`, `kind`, `assetIds`, `sourcePath`, `createdAt`.
- `projects`: `id`, `name`, `canvas`, `layers`, `templateId`, `assets`, `effects`, `updatedAt`.
- `templates`: `id`, `manifest`, `files`, `source`, `installedAt`.
- `recents`: `id`, referenced asset/template/project id, `usedAt`.

Import behavior:

- User can import to the asset library.
- User can import directly as a new image layer.
- Direct import can optionally also save the asset to the library.
- Imported template packages can be installed into the template cache.

## Editor Features

Initial editor capabilities:

- Create canvas by preset: 400x400 or 720x450.
- Create canvas from template.
- Add image layers from built-in assets, cached assets, or file import.
- Add text layers.
- Add icon layers from game-icons, Iconify/MDI where available, or custom PNG/SVG import.
- Add shape layers for rectangles, lines, badges, and simple panels.
- Move, scale, rotate, lock, hide, duplicate, delete, reorder.
- Crop and mask image layers.
- Apply effect stacks to image layers.
- Export PNG at the selected template size and optional pixel ratio.
- Save/load project JSON.

## Effects System

Effects are stored as non-destructive layer stacks:

```json
[
  { "id": "adjust", "params": { "brightness": 0, "contrast": 0.12, "saturation": 0.08 } },
  { "id": "softBlur", "params": { "radius": 2, "opacity": 0.35 } },
  { "id": "dustGrain", "params": { "density": 0.22, "size": 1.2, "seed": 1024, "color": "#ffffff", "opacity": 0.18 } },
  { "id": "frostedGlass", "params": { "blur": 8, "noise": 0.08, "tint": "#ffffff", "opacity": 0.16 } }
]
```

Initial effect categories:

- Core filters: brightness, contrast, saturation, hue, grayscale, invert, blur, pixelate, noise.
- Texture overlays: white-dot dust, film grain, paper noise, scanlines, vignette.
- Style presets: frosted glass, glass, glow, bloom, chromatic aberration, glitch, duotone, posterize.

PixiJS/WebGL should be included in the initial implementation for effect preview and filter chains. Three.js should be integrated as an advanced adapter layer, beginning with effects that are already practical in the project stack, such as post-processing presets.

## Testing Strategy

Tests should cover:

- Template manifest parsing and validation.
- Template path resolution using relative assets.
- Asset catalog scanning rules for built-in and optional local roots.
- IndexedDB data adapters with fake IndexedDB or equivalent test isolation.
- Project JSON serialization and rehydration.
- Effect stack schema validation.
- Export pipeline smoke tests for deterministic small canvases.

Manual/visual verification should cover:

- 400x400 and 720x450 exports.
- `generic-frame` and `theme-clear-frame` creation.
- Imported image as direct layer.
- Imported image saved to asset cache and reused.
- Dust/grain effect preview and export alignment.
- Plain Vuetify layout across desktop and mobile widths.

## First Implementation Milestone

The first milestone should deliver:

1. `Self/PosterStudio` route and placeholder module page.
2. Built-in copied assets for frames, game-icons, and fonts if present.
3. Asset index generation script.
4. Template schema and initial manifests for `generic-frame` and `theme-clear-frame`.
5. Vuetify workbench shell with asset panel, canvas, layer panel, and property panel.
6. Konva-based layer editor.
7. IndexedDB asset/project cache.
8. PixiJS-backed effect preview for the first stable filters.
9. PNG export.

