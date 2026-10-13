#include <metal_stdlib>
#include <SwiftUI/SwiftUI_Metal.h>
using namespace metal;

// Home -> detail glitch / datamosh transition, used as a SwiftUI layerEffect (iOS 17+).
// `layer` is the new screen (snapshot), `from` is the old screen (snapshot) as a texture.
// p runs 0 -> 1. Intensity g falls from 1 to 0, so the last frame is the clean new screen.

static float h21(float2 p) {
    p = fract(p * float2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

[[ stitchable ]] half4 glitchTransition(float2 pos, SwiftUI::Layer layer, texture2d<half> from,
                                        float2 size, float2 tap, float p, float mosh, float seed) {
    constexpr sampler s(coord::normalized, address::clamp_to_edge, filter::nearest);
    float g = pow(clamp(1.0 - p, 0.0, 1.0), 1.6);      // glitch intensity
    float frame = floor(p * 24.0);                    // stepped like dropped frames
    float bs = mix(56.0, 16.0, p);                    // macroblock size shrinks as it settles
    float2 b = floor(pos / bs);
    float2 bc = (b + 0.5) * bs;                       // block centre: one motion vector per block
    float hb = h21(b + seed);                         // per-block, fixed
    float hf = h21(b + frame + seed);                 // per-block, per step

    // Block displacement: some macroblocks jump sideways.
    float2 disp = float2(0.0);
    if (hf > 1.0 - 0.35 * g) disp.x = (h21(b * 1.7 + frame) - 0.5) * 120.0 * g;

    // Scanline tearing: thin rows inside random 40pt bands shear.
    float band = floor(pos.y / 40.0);
    if (h21(float2(band, frame + seed)) > 1.0 - 0.5 * g) disp.x += sin(floor(pos.y / 3.0) * 0.9 + frame) * 28.0 * g;

    // RGB channel split.
    float split = 10.0 * g;
    float2 q = pos + disp;

    // Datamosh: the old frame is never refreshed (no I-frame). Each block keeps copying pixels from
    // nearer the tapped plate, so the plate's pixels bleed and smear outward over the new page.
    float k = mosh * clamp(p * 1.5, 0.0, 1.0) * (0.4 + 0.6 * hb);
    float2 src = q - (bc - tap) * k;

    // Per-block switch from old to new. Some old blocks stay longer as residue.
    bool showNew = (p * 1.5 - hb) > 0.25 && !(hf < 0.25 * g * mosh);

    half4 c;
    if (showNew) {
        c.r = layer.sample(q + float2(split, 0.0)).r;
        c.g = layer.sample(q).g;
        c.b = layer.sample(q - float2(split, 0.0)).b;
    } else {
        float2 uv = src / size;
        float2 du = float2(split / size.x, 0.0);
        c.r = from.sample(s, uv + du).r;
        c.g = from.sample(s, uv).g;
        c.b = from.sample(s, uv - du).b;
    }
    c.a = 1.0h;
    return c;
}
