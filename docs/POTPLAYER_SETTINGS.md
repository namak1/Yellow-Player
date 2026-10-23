# Settings contract

Persist appearance and playback preferences locally. Store subtitle offsets per media identity and track identity. Positive delay means subtitles appear later: cue.start <= media.currentTime - offset < cue.end. Recompute against media time during seek, pause and speed changes; never integrate an independent subtitle clock.

Priority fields: family, custom font, size, weight, italic, color, opacity, outline width/color, shadow, background, horizontal alignment and bottom margin; UTF-8 and selectable legacy encoding. Custom fonts load through FontFace and are session-only unless explicitly stored.

Video CSS adjustments are visual only; snapshots must include the selected filters. Equalizer uses a single MediaElementAudioSourceNode per video element. Unsupported native features must not be shown as working switches.
