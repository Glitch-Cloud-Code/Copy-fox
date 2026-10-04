# Architecture: Copy-fox

## Fit
New independent repository at C:/Projects/Copy-fox. No changes to Shockwave Fest.

## Endpoints
Static files only. No application API.

## Data
Model manifest: id, name, description, asset path, author, source URL, license, default view. Local GLB/glTF assets or supported source formats. No saved preferences.

## Flow
Model selection loads one asset. Normalize its bounds. An orthographic camera projects it into a small transparent render target. Read pixels and convert them into a fixed character grid. Display that exact string in a pre element. Copy pauses animation before writing the displayed string to the clipboard.

## External
Three.js is pinned and vendored for browser use. Models are local assets with source credits. GitHub source and Sites hosting. No third-party runtime API calls.

## Failure paths
Load failures leave a retry path. A sequence token prevents stale loads from replacing the latest selection. Clipboard failures expose a selectable text fallback. WebGL failure shows a clear unsupported-browser state. Animation stops while hidden. Model disposal releases geometries, materials, textures, and mixer references.
