#include <metal_stdlib>
using namespace metal;

// Datamosh as a simulated decoder, reimplemented from Modulate's public description of the
// technique (not their code): a feedback buffer holds the last output; each frame the
// previous output is displaced along per-macroblock motion vectors measured between the
// last two input frames (block matching, done on the CPU in MoshEngine.swift), so stale
// pixels are dragged by new motion. "Heal" re-anchors random blocks to the true input,
// and a keyframe at the end replaces everything with the clean frame.

struct VOut { float4 pos [[position]]; float2 uv; };

vertex VOut moshVertex(uint vid [[vertex_id]]) {
    float2 p = float2((vid << 1) & 2, vid & 2);        // full-screen triangle
    VOut o;
    o.pos = float4(p * 2.0 - 1.0, 0.0, 1.0);
    o.uv = float2(p.x, 1.0 - p.y);                     // top-left origin
    return o;
}

struct MoshUniforms {
    float2 cardOrigin;   // where the new screen sits in the input frame (uv)
    float2 cardSize;
    float2 grid;         // macroblock grid size (columns, rows)
    float smear;         // multiplies the measured vectors (can overdrive)
    float heal;          // chance per block per frame to snap back to the true input
    float diffusion;     // colour bleed between neighbouring source pixels
    float intensity;     // 0 = clean input, 1 = full mosh
    float seed;          // changes every frame
    float keyframe;      // 1 = clean frame lands
    float blockScale;    // 2 = 32pt blocks, 1.5 = 24pt, 1 = 16pt (merges motion cells early on)
    float seeding;       // 1 on the first frame: build the feedback from the old screen + enlarged plate
    float2 seedFromO;    // tapped plate rect in the old screen (uv)
    float2 seedFromS;
    float2 seedToO;      // where the enlarged plate sits in the seeded feedback (uv)
    float2 seedToS;
    float fly;           // 1 = the card is the tapped thumbnail (seedFrom crop of the old screen) flying
                         //     to its detail frame; the new screen appears only at the keyframe
    float drift;         // fly mode: strength of the screen-wide block drift (0..1, ramps late)
    float2 driftDir;     // fly mode: the thumbnail's motion this frame (uv per frame)
};

// First feedback frame: the old screen with the tapped plate blown up over it, so the
// stale pixels the motion drags are mostly the plate's own.
static float4 seedAt(float2 uv, texture2d<float> oldTex, constant MoshUniforms& u, sampler s) {
    float2 q = (uv - u.seedToO) / max(u.seedToS, float2(1e-4));
    if (u.seedToS.x > 0.0 && all(q >= 0.0) && all(q <= 1.0)) return oldTex.sample(s, u.seedFromO + q * u.seedFromS);
    return oldTex.sample(s, uv);
}

static float hash2(float2 p, float s) {
    return fract(sin(dot(p, float2(12.9898, 78.233)) + s * 37.719) * 43758.5453);
}

// The true input frame: the new screen as a card over the old screen.
static float4 inputAt(float2 uv, texture2d<float> oldTex, texture2d<float> newTex,
                      constant MoshUniforms& u, sampler s) {
    float2 q = (uv - u.cardOrigin) / u.cardSize;
    if (all(q >= 0.0) && all(q <= 1.0)) {
        if (u.fly > 0.5) return oldTex.sample(s, u.seedFromO + q * u.seedFromS);
        return newTex.sample(s, q);
    }
    return oldTex.sample(s, uv);
}

fragment float4 moshDisplace(VOut in [[stage_in]],
                             texture2d<float> prev   [[texture(0)]],
                             texture2d<float> motion [[texture(1)]],
                             texture2d<float> oldTex [[texture(2)]],
                             texture2d<float> newTex [[texture(3)]],
                             constant MoshUniforms& u [[buffer(0)]]) {
    constexpr sampler lin(coord::normalized, address::clamp_to_edge, filter::linear);
    constexpr sampler nn(coord::normalized, address::clamp_to_edge, filter::nearest);
    float4 truth = inputAt(in.uv, oldTex, newTex, u, lin);
    if (u.keyframe > 0.5) return u.fly > 0.5 ? newTex.sample(lin, in.uv) : truth;

    // One vector per macroblock (nearest lookup), so blocks move as hard rectangles.
    float2 cell = floor(in.uv * u.grid / u.blockScale) * u.blockScale;
    float2 mv = motion.sample(nn, (cell + 0.5 * u.blockScale) / u.grid).xy * u.smear;
    if (u.fly > 0.5 && u.drift > 0.0) {
        // Screen-wide field driven by the thumbnail: every block copies from a point back along the
        // flight and toward the flying card, by a random per-block amount, so the thumbnail's pixels
        // tear outward in blocks and fill the screen as the drift builds.
        float r1 = hash2(cell, 11.0), r2 = hash2(cell, 23.0 + floor(u.seed / 6.0));
        float2 cc = u.cardOrigin + 0.5 * u.cardSize;
        float2 toward = cc - in.uv;
        mv += -u.driftDir * u.smear * (0.5 + 1.5 * r1) * u.drift * 6.0;
        mv += toward * (0.02 + 0.10 * r2 * r2) * u.drift;
    }

    // P-frame: copy the previous output from where this block's content came from.
    float2 jitter = (float2(hash2(cell, u.seed + 1.0), hash2(cell, u.seed + 2.0)) - 0.5) / u.grid * 0.5;
    float4 moshed;
    if (u.seeding > 0.5) {
        moshed = mix(seedAt(in.uv + mv, oldTex, u, nn), seedAt(in.uv + mv + jitter, oldTex, u, lin), u.diffusion);
    } else {
        moshed = prev.sample(nn, in.uv + mv);
        // Diffusion: a little bilinear bleed from a nearby source position.
        moshed = mix(moshed, prev.sample(lin, in.uv + mv + jitter), u.diffusion);
    }

    // Heal: some blocks get their correction and show the true image again.
    if (hash2(cell, u.seed) < u.heal) moshed = truth;

    return mix(truth, moshed, u.intensity);
}

fragment float4 moshPresent(VOut in [[stage_in]], texture2d<float> src [[texture(0)]]) {
    constexpr sampler nn(coord::normalized, address::clamp_to_edge, filter::nearest);
    return src.sample(nn, in.uv);
}

// P-frame duplication (method from tiberiuiancu/datamoshing, public domain / Unlicense; reimplemented
// here, no code copied): the same motion field, captured once, is applied to the previous output
// every frame. No heal, no I-frame: pixels keep sliding and blooming along the motion until the
// keyframe, which is the clean detail page (new screen) with nothing blended in before it.
fragment float4 moshPDup(VOut in [[stage_in]],
                         texture2d<float> prev   [[texture(0)]],
                         texture2d<float> motion [[texture(1)]],
                         texture2d<float> oldTex [[texture(2)]],
                         texture2d<float> newTex [[texture(3)]],
                         constant MoshUniforms& u [[buffer(0)]]) {
    constexpr sampler lin(coord::normalized, address::clamp_to_edge, filter::linear);
    constexpr sampler nn(coord::normalized, address::clamp_to_edge, filter::nearest);
    if (u.keyframe > 0.5) return newTex.sample(lin, in.uv);
    float2 cell = floor(in.uv * u.grid / u.blockScale) * u.blockScale;
    float2 mv = motion.sample(nn, (cell + 0.5 * u.blockScale) / u.grid).xy * u.smear;
    float4 a, b;
    if (u.seeding > 0.5) {
        // First frame: the Home screen with the thumbnail filling its (block-aligned) source blocks.
        a = seedAt(in.uv + mv, oldTex, u, nn);
        b = seedAt(in.uv + mv, oldTex, u, lin);
    } else {
        a = prev.sample(nn, in.uv + mv);
        b = prev.sample(lin, in.uv + mv);             // a little bilinear bloom
    }
    return mix(a, b, u.diffusion);
}
