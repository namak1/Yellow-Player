# Executed validation — 2026-10-23

- TypeScript compile and Vite production build: passed.
- Node tests: 11 passed (subtitle parse/timing, browser engine, generated worker cache behavior).
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
