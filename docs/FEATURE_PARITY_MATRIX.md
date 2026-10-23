# Feature parity — 0.5.0

Implemented means code exists; see TESTING.md for actual validation. Native bridge source is experimental and untested throughout. PotPlayer support is verified only where sources S1/S2 say so; requested specialist fields may need investigation.

| Feature | PotPlayer evidence | Yellow Web | Yellow macOS | Status / gap |
|---|---|---|---|---|
| Local playback, seek, volume | S1/S2 | Implemented | Experimental bridge | Browser codec limits |
| Playback speed | S2 | Implemented | Experimental bridge | Cross-browser QA pending |
| SRT / VTT | S1/S2; VTT behavior needs inspection | Implemented | mpv subtitle loading source | SRT Chromium tested |
| ASS/SSA original rendering | S1/S2 | libass/WASM implemented | mpv source | Simple ASS visually tested |
| Subtitle fonts/size/outline/position | S2 partial; exact fields uncertain | Implemented in text mode | Font/size bridge source | System font enumeration where supported; font files session-only |
| Subtitle synchronization | S2 | Per-media/per-track offsets | Delay bridge source | Unit and Chromium checked |
| Dual subtitles | S2 | Implemented; second text-only | Not implemented in bridge UI | Partial |
| Embedded text / bitmap subtitles | S1/S2 | MKV SRT/ASS/SSA/WebVTT, MP4 tx3g/WebVTT, ASS attached fonts | mpv track cycle source | Bitmap/encrypted/compressed subtitles and live unknown-size MKV clusters unsupported |
| Subtitle search/translation/Whisper | S2 | Not implemented | Not implemented | Future work |
| Resume/history/bookmarks | S1/S2 | Implemented metadata | Not integrated | Reopen files after reload |
| Playlist filtering/reorder | S2 | Implemented session queue | Not integrated | Persistent playlist restore missing |
| Repeat / A–B | Requested; exact menu unverified | Implemented | Not integrated | Manual QA pending |
| Frame stepping / chapters | S1 chapters; step details uncertain | Not implemented | Not integrated | Future work |
| Equalizer | Requested; exact UI unverified | Implemented WebAudio | Not integrated | Local media only, listening QA pending |
| Audio tracks | S2 | Native tracks or local demux/WebCodecs; A cycles | Cycle command source | Secure context and supported codecs required; independent decoding changes pitch at non-1× speed |
| Audio delay/normalization/ReplayGain | S2 | Not implemented | Not integrated | Future work |
| Video color, rotate, zoom, fit | S2 | Implemented CSS, Vivid/Original profiles | Not integrated | Original ASS transform alignment limited |
| Snapshot | S1/S2 | Implemented | Not integrated | Excludes subtitles and transforms |
| HDR/shaders/deinterlace/interpolation | S2 | Not implemented | mpv potential, not integrated | Future work |
| Hardware acceleration | S1/S2 | Browser controlled | auto-safe mpv source | No hardware QA |
| Fullscreen/context/preferences/themes | S2 partial | Implemented | Shared frontend; mpv fullscreen source | Bottom-hover transport checked in expanded window; native fullscreen OS/browser QA pending |
| Offline / PWA | Yellow requirement | Generated cache, manifest | N/A | Worker logic tested, real offline QA pending |
| Disc menus/capture/plugins/always-on-top | S1/S2 partial | Not implemented | Not integrated | Native work required |
| Repository/CI/Pages | Yellow requirement | Workflow prepared | Compile workflow prepared | Source published; gh-pages built branch prepared |
| Signed macOS app | Yellow requirement | N/A | Not delivered | Compile, package, sign, notarize pending |
