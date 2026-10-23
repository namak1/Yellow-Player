# Architecture

React/TypeScript/Vite frontend; HTMLMediaElement browser engine; independent subtitle parser and pure timing selector; requestAnimationFrame overlay updates; Web Audio equalizer; CSS video transformations; IndexedDB repository for metadata; object URLs for local media. Build-generated exact asset list for scoped service-worker caching. No media upload endpoint or analytics.

Native target: Tauri 2 with mpv IPC bridge. Start with isolated owned mpv process; eventual embedded libmpv render surface needs macOS-specific work. External process/window is not equivalent to integrated libmpv rendering. Do not distribute a claimed native edition before macOS compile, Apple Silicon playback, sandbox, signing and licensing checks.

GitHub Pages: relative Vite assets and service worker scope support /Yellow-Player/. GitHub workflow builds/tests and deploys dist. Repository creation and Pages enablement require authenticated account access.
