# Executed validation — 2026-10-23

- TypeScript compile and Vite production build: passed.
- Node tests: 17 passed (subtitle parse/timing, browser engine, generated worker cache behavior).
- Browser: cloud Chromium, local generated H.264/AAC 640×360, 25fps, 30-second MP4.
- Observed actual video playback, 30-second duration and decoded dimensions.
- Loaded SRT English/Persian text and observed rendered cue.
- At paused time zero, +500ms delay hid the cue as expected.
- Loaded ASS and visually confirmed libass yellow outlined text and Persian shaping.
- Changed speed to 2× during playback; preference survived development reload.
- Inspected original desktop layout visually. No app-specific errors observed in the checked log sample; extension errors were excluded.

Not validated: native Rust compile or macOS IPC/runtime, Safari, Firefox, mobile touch, actual audio quality, all EQ presets, fullscreen lifecycle on each browser, custom fonts across OSes, huge files/8K, decoder coverage, frame-accurate seeks, complex ASS animation corpus, actual offline cold reload and PWA installation.

## Repeatable manual acceptance

1. Open test video plus tests/fixtures/test.srt. Pause at zero, set delay +500ms, cue must disappear; seek beyond 0.5s, cue returns. Seek backward and repeat at 0.5×/2×.
2. Import test.ass; original mode should show yellow outlined text. Switch off original mode to test font/outline/margin customization. Switch primary and secondary tracks; test independent offsets.
3. Enter fullscreen, seek and exit; verify subtitles remain visible and positioned.
4. Add two media files. Reorder, remove, navigate and test off/all/one repeat. Set A at 2s and B at 5s; observe loop. Clear interval.
5. Add bookmark, reload, reopen same file and check bookmark/resume/offset. Local files are intentionally not automatically reopened.
6. Production only: load once, wait for service worker installation, reload once, disconnect internet, close tab and reopen URL. App must load; reopen local file. No remote stream should be expected offline.
7. Run on current Chrome/Safari/Firefox with H.264/AAC, VP9/Opus, AV1 and HEVC/MKV corpus; record each browser/OS/codec tuple. Test >4GB video without full-file memory copies.
8. macOS: compile workflow, install mpv separately, launch Native engine; exercise playback/sub-delay/track cycling and close app to verify owned child shutdown. Inspect hardware decoding. Do not publish a signed installer before these pass.

## Version 0.2 checks

Built production 0.2 and passed 17 tests including all-font enumeration normalization, denied/unsupported permissions, SRT export and two-point timing correction. In Chromium, opened MP4/SRT, paused, selected a cue, edited English/Persian text and observed the updated on-video overlay. Inspected compact desktop layout and nested subtitle menu. Actual system-font permission and OS font list require user-machine validation.

## Version 0.3 audio-track checks

Production build and all 20 Node tests passed. Added tests for two-track AAC demux, language/default metadata, native selection, invalid selection and time/rate scheduling. GitHub Actions build/tests and Pages deployment succeeded. On the live HTTPS site in Chromium, a local 30-second H.264 video with two AAC tracks (English/Persian labels, 440/880 Hz test tones) exposed both tracks as decodable. Selected each track, paused, sought to 12 seconds, resumed, cycled and restored default browser audio without a decoder error or playback reset. This validates decoder execution and UI state; audible quality and long-duration synchronization still require listening tests. Plain HTTP terminal preview could enumerate tracks but correctly could not use secure-context WebCodecs. Safari/Firefox, multichannel codecs and large files remain untested.

## Version 0.4 subtitle checks

26 tests pass, including real MKV SRT/ASS track extraction, attached-font extraction, default/language metadata, MP4 tx3g Persian text/timestamps, ASS packet reconstruction with commas, UTF-16 text, malformed containers, cancellation and real font-weight descriptors. Chromium local-file UI checks: automatically discovered two MKV tracks and one MP4 track; observed Persian cue text and original yellow ASS rendering with the attached font at 1 second; switching movies removed the previous movie's embedded tracks. Letterbox/stage/background are #000. Synthetic bold/italic is disabled and text shadow is crisp. Exact B Mitra rendering is not validated because the user's font file is not available here. Long-movie scanning, live unknown-size MKV clusters, compressed/encrypted subtitle streams, bitmap subtitles, and Safari/Firefox remain unvalidated or unsupported as documented. Test fixtures contain synthetic video/text and a DejaVu Sans font subset, not copyrighted movie footage.
