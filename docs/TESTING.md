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


## Version 0.5 presentation checks — 2026-10-24

29 tests pass, including actual server-rendered per-line RTL/LTR markup, stray direction-mark cleanup, ASS direction correction retaining tags/times, and color-profile behavior. Chromium with local H.264/AAC video and an SRT containing an initial LTR mark, Persian text, a Latin name within Persian text and a separate English line: Persian final full stops visibly appear on the left, English on the right. Original selects CSS filter `none`; Vivid selects contrast 106% and saturation 115%, brightness 100%, with settings saved locally. This is a user-facing enhancement, not measured color matching to PotPlayer or independent HDR tone mapping.

The cloud browser rejects native requestFullscreen. The expanded-window fallback was checked instead: transport opacity 0/pointer-events none away from the bottom; 1/auto on the bottom hover area; back to 0/none after leaving, with a constant video rectangle. Exit returns to the compact player. Native OS fullscreen and touch behavior still need user-machine checks. Touch devices keep visible controls for accessibility; keyboard focus reveals them on desktop.


## Version 0.5.1 legacy full-stop correction — 2026-10-24

Added the screenshot sentence as a regression case with its full stop stored before the first Persian word. Display normalization moves that single leading period to the logical end before RTL layout, in both text overlays and ASS. Existing trailing punctuation, English text, leading ellipses and decimal fractions are preserved; source cues/exports remain untouched. 30 tests pass. Chromium text and original ASS overlays visually show the period to the left of باشم for the sentence in the screenshot. This covers a file pattern the previous direction-only correction did not cover; the actual movie/subtitle file was not provided.

## Version 0.5.2 supplied-file and update checks — 2026-10-24

Loaded the user's original UTF-8/BOM/CRLF SRT unchanged: 981 parsed cues. Cue 510 (3533.809–3536.023 s) has a literal leading U+002E; current normalization produces a trailing logical period. In Chromium, loaded that complete file alongside a synthetic 91-minute black video, sought via the cue browser to 58:53.809 and visually confirmed the period on the left of the final Persian word. The supplied subtitle is not included in the repository.

The prior app could serve cached index.html and leave a completed service-worker update waiting on older tabs. This can retain outdated UI; it is a possible cause of the user's report, not a confirmed diagnosis of their browser. Added a visible app version from package.json, fresh network navigation with offline HTML fallback, immediate activation only after complete precaching, and worker updateViaCache:none. Existing movies are not automatically reloaded. The generated-worker test verifies fresh online HTML even when a stale root is cached, new HTML on a subsequent offline navigation, precached WASM reuse, and update activation. All 30 tests and the production build pass. A real disconnected browser/PWA test remains outstanding.


## Version 0.6 controls and bitmap subtitles

40 automated tests pass. New checks cover exact packet-timestamp stepping in both directions, gamma/tone curves, zoom bounds, PGS palettes/RLE/clear events, VobSub IDX/PES reassembly/interlaced RLE/palettes, malformed bitmap limits, both embedded bitmap tracks in a generated MKV, and signed audio scheduling at different speeds. Fixtures are original raster text generated by `scripts/make-bitmap-fixtures.py`; no film subtitle images are included.

Chromium preview: `<` and `>` pause and change a 25 fps test video by 40 ms; external PGS and VobSub visibly render the generated English caption at two seconds. A 4:3 preset produces a measured 1.3333 video rectangle. Gamma and Hable controls update the applied SVG transfer function. Positive 500 ms audio delay is accepted; the playing video's cursor computes to `none` after inactivity. Ctrl-wheel has a non-passive cancellation listener and bounded zoom logic; physical Ctrl-wheel input and visual color calibration across browsers remain unvalidated.

Limits: HDR controls process browser-decoded RGB; there is no raw PQ/HLG pipeline, independent HDR metadata detection, or guaranteed native HDR output. Negative audio delay depends on independent browser codec support for local media. Generated-fixture and scheduling tests do not establish perceptual A/V synchronization for all codecs or long movies. Bitmap palette fades/advanced DVD control commands and encrypted/compressed streams are not supported. Bitmap fonts/OCR/text export are unavailable. Safari/macOS runtime behavior has not been tested here.

Format references: [FFmpeg PGS decoder documentation](https://ffmpeg.org/doxygen/trunk/pgssubdec_8c.html) and [FFmpeg DVD subtitle decoder documentation](https://ffmpeg.org/doxygen/trunk/dvdsubdec_8c.html).


## Version 0.6.1 color regression

The always-attached SVG transfer filter in 0.6.0 changed the video compositing path even with a mathematical identity curve. Default and existing saved settings now bypass that stage completely. The default CSS filter matches 0.5.6 exactly; Original returns `none`. Advanced processing requires an explicit checkbox and is also bypassed when its values are neutral. Original/Vivid selections turn advanced processing off, and a Restore v0.5.6 colors button resets gamma/exposure/tone mapping. The opt-in SVG uses sRGB interpolation to avoid an unnecessary linear-RGB round trip. Regression coverage checks defaults, old saved advanced settings without the opt-in flag, Original, neutral opt-in, and deliberate non-neutral opt-in. The user's movie is not available for direct before/after comparison.


## Version 0.6.2 software audio fallback

Added official Mediabunny AC-3/E-AC-3 and DTS decoder extensions, pinned to 1.62.1. Audio inspection loads the required local extension before capability detection. Local AC-3/E-AC-3/DTS default tracks are automatically routed through the independent synchronized decoder, with native audio muted only after a decoded sample is ready. The Automatic audio option preserves that fallback when selected again. Browser-native AAC and similar tracks keep the previous path. Native audio-track enumeration no longer prevents local container inspection.

46 automated tests pass, including a native-track-list routing regression. Generated one-second 48 kHz six-channel MKV fixtures for AC-3, E-AC-3, and DTS from the original synthetic video and sine tones. Actual WASM worker tests decode to finite, non-silent six-channel PCM at later positions and after backward seeks. The initial DTS packet includes encoder priming; energy is checked after startup. These checks do not claim every commercial DTS-HD/Atmos/TrueHD variant or every browser is supported.

Chromium preview automatically selects the generated 30-second MKV's AC-3 six-channel track; the track remains selectable and no app decoder error appears. The user's actual Captain Phillips MKV is not available, so its precise bitstream and listening output have not been directly checked. Color processing remains on the v0.5.6-compatible path.


## Version 0.6.3 AC-3 quality correction

Replaced per-packet video-clock scheduling with a fixed Web Audio timeline, quarter-second initial decode buffering, 80 ms scheduling lead, one-second lookahead and real-underrun recovery. Adjacent packet times within 8 ms are aligned by actual PCM frame duration so millisecond container timestamp rounding cannot introduce repeated gaps/overlaps. Larger discontinuities are preserved.

Added explicit multichannel-to-stereo matrices with bounded gain/headroom, preserving centre dialogue and left/right surrounds; LFE is omitted in the standard stereo mix. Mono/stereo PCM remains unchanged. The mixer prevents full-scale correlated full-range 5.1 channels from clipping at flat EQ. Positive EQ boosts may still require a lower volume.

53 tests pass, including 1,000 rounded DTS packet times without gaps/overlaps, rates/delays/seek offsets, channel routing, full-scale headroom and an actual AC-3 decoder-to-scheduler integration test verifying contiguous stereo buffer sources. A manual full-fixture comparison of the AC-3 WASM output against desktop FFmpeg produced equal sample counts, approximately 144 dB SNR and maximum absolute error 3.73e-8, indicating the raw decoder is accurate for this generated fixture. This does not constitute a listening check of the user's unavailable movie.


## Version 0.6.4 Persian punctuation and ASS direction

57 tests pass. Regression fixtures reproduce the three user screenshots: a leading exclamation mark, two trailing dialogue dashes, and a leading ellipsis. Detection examines all RTL lines in each track to distinguish a legacy visual punctuation convention from ordinary logical text. Clear leading sentence-ending punctuation is corrected directly; ambiguous ellipses and speaker dashes are corrected only with track-level legacy evidence. Decimals, English, correctly stored punctuation, ordinary opening ellipses and forced LTR remain unchanged. Normalization is display-only and exports preserve source cues.

For ASS, direction marks alone were insufficient with VSFilter-compatible LTR/individual-style-run layout. RTL dialogue now enables libass Encoding=-1 whole-text bidi layout and reapplies it after style resets. Vector drawings are untouched. Reference: https://github.com/libass/libass/wiki/Libass%27-ASS-Extensions#encoding-1 .

Chromium preview visually checked all three examples in text mode: exclamation and ellipsis appear to the left, speaker dashes to the right. Original ASS styling also shows the ellipsis to the left and both speaker dashes to the right across bold style changes. Earlier supplied private SRT has abundant legacy evidence (774 lines with leading terminal punctuation and 143 with a trailing speaker dash); it remains outside the repository. The screenshots do not contain the actual new movie subtitle file, so its full contents have not been inspected.

## Skip ranges (v0.6.6)

Automated checks cover timestamp parsing (including the 1:50:49 / 0:20:10–0:22:15 example), invalid input, duration bounds, merged overlaps, master/individual toggles, saved settings, and BrowserEngine seek mapping at file boundaries.

Browser checks used original generated black test clips: a 30-second clip for multiple jumps and a 1:50:49 clip for the requested interval. Verified automatic playback skipping, seeking into each excluded interval, editing, removal, per-file isolation, and persistence after page reload and reopening. Skip ranges are local metadata; they do not edit or export the media file.

## Jump buttons, speed shortcuts and millisecond skips (v0.6.7)

Verified in the browser: forward jump from 00:30 to 00:45 and back to 00:30 while staying paused; C changes native playbackRate from 1 to 1.25, X returns to 1, and uppercase C/Z also work. The speed toast reports the selected rate.

Skip editor accepts 0:20:10:200–0:22:15:400, preserves the values when editing, and seeks from 1210.25 to 1335.4 seconds. Automated tests cover exact fractional boundaries, millisecond formatting/parsing, rollover, and invalid millisecond fields. Existing whole-second and decimal-second inputs remain supported. Actual video presentation remains limited by the source frame cadence and browser seeking.

## Network software audio (v0.6.12)

URL playback now passes the URL to AudioTrackSession and uses Mediabunny UrlSource with a 32 MiB cache and bounded retries. Local BlobSource behavior is preserved. Network tracks use existing AC-3/E-AC-3/DTS software decoders and the same synchronized audio route as local files.

Tests serve generated AC-3, E-AC-3 and DTS six-channel MKV fixtures through an HTTP Range server. All tracks are discovered, selected by automatic routing, and decode finite, non-silent PCM after forward/backward seeks. Connection failures reject inspection. The supplied movie URL redirected to a CDN returning HTTP 503 during inspection; its actual codec and playback could not be verified. Browser CORS permission and server availability remain necessary.
