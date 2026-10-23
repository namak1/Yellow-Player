# Yellow Player 0.2 — desktop controls and local fonts

- Replaced the promotional interface with a compact desktop player: small title bar, quiet watermark, thin timeline, square transport controls, hidden-by-default playlist.
- Added nested playback, subtitles, video and audio menus with working actions and keyboard menu navigation.
- Added subtitle cue editing, search, export to SRT, sync selected line to current media time and two-anchor drift correction.
- Added a searchable installed-font face picker. `Load system fonts` calls `queryLocalFonts()` from the button interaction, without limiting the request to known names. Font families and individual styles returned by the browser are retained; faces are activated using local() and font names/files are never uploaded.
- Unsupported/denied font listing leaves manual installed-font-name entry and font-file import available. Safari/Firefox cannot be promised automatic full system-font enumeration. The app displays the actual browser's limitation.
- Choosing an overriding font changes ASS to text mode. Original ASS animation/style rendering remains an alternative, not an implied simultaneous override.
- Added go-to-time and media information dialogs, mouse wheel volume / Shift-wheel seeking, and fullscreen of the entire player so controls and dialogs remain reachable.

Validation: production compile/build and 17 Node tests passed; Chromium playback with SRT/Persian, nested menus and edited cue rendering manually checked. Font permission grant on the user's actual machine and macOS native operation are not tested.

This is an incremental correction, not full PotPlayer parity. Embedded subtitle/audio demux, mature native playback integration, capture, advanced filters, HDR controls, full settings parity and many other capabilities remain incomplete.

API reference: https://developer.mozilla.org/en-US/docs/Web/API/Window/queryLocalFonts
