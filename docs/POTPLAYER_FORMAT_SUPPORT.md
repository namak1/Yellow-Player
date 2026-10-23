# Format support and limits

A file extension is a container hint, not a decoder guarantee. Browser media playback depends on browser, OS and installed codec support (S4). Local files use object URLs without complete reads or uploads. MP4 H.264/AAC, WebM VP8/VP9/Opus and common audio are sensible test targets; HEVC/AV1/MKV combinations need actual platform testing. DRM discs, arbitrary protocols and external DirectShow codecs are not supported by HTML video.

Initial text subtitle parser: SRT, WebVTT, ASS/SSA through libass plus dialogue-only fallback. Original ASS uses libass; text fallback loses author styling and effects. Secondary tracks use text fallback. Complex animation compatibility is not yet tested. Bitmap/embedded subtitle demux is not implemented. UTF-8 and TextDecoder-supported legacy encodings are selectable.

Native target: mpv handles many FFmpeg formats and subtitle types (S3), subject to build options. Native integration and packaging are not yet validated.
