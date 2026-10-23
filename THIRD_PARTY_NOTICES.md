# Third-party components

Exact resolved JavaScript versions are in package-lock.json.

- React / React DOM: MIT, https://github.com/facebook/react
- Lucide: ISC, https://github.com/lucide-icons/lucide
- Vite: MIT, https://github.com/vitejs/vite
- TypeScript: Apache-2.0, https://github.com/microsoft/TypeScript
- Tauri: MIT or Apache-2.0, https://github.com/tauri-apps/tauri
- SubtitlesOctopus/libass-wasm 4.1.0: multiple licenses including LGPL-2.1-or-later; full bundled component notices in public/libass/COPYRIGHT. Unmodified worker files from npm libass-wasm; source/build scripts: https://github.com/libass/JavascriptSubtitlesOctopus. Workers are separate, replaceable assets. Verify corresponding source and redistribution requirements before distributing this build publicly.
- DejaVu Sans fallback font: see public/libass/FONT-LICENSE.txt; https://dejavu-fonts.github.io/.

mpv/FFmpeg are not included. Native source expects a user-installed mpv. Do not bundle or release codecs until exact license/build-option obligations have been reviewed. This document is an engineering checklist, not legal advice or distribution clearance.

- Mediabunny 1.62.1, MPL-2.0: unmodified library bundled into the application. License: public/licenses/Mediabunny-MPL-2.0.txt. Corresponding source (src/ directory): https://www.npmjs.com/package/mediabunny/v/1.62.1 ; upstream: https://github.com/Vanilagy/mediabunny.
