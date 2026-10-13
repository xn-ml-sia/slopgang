#!/usr/bin/env python3
"""Procedural glitch SFX for the home -> detail transition. No samples, no third-party audio.
Writes Resources/Sounds/glitch-in.wav (520 ms) and glitch-out.wav (200 ms), 44.1 kHz mono 16-bit.
Seeded, so the output is the same on every run."""
import math, os, random, struct, wave
SR = 44100
here = os.path.dirname(os.path.abspath(__file__))

def crush(x, bits, hold):
    """Bitcrush: sample-and-hold `hold` samples, quantize to `bits`."""
    out, v = [], 0.0
    q = 2 ** (bits - 1)
    for i, s in enumerate(x):
        if i % hold == 0: v = round(s * q) / q
        out.append(v)
    return out

def noise(n, rng): return [rng.uniform(-1, 1) for _ in range(n)]

def tone(n, f0, f1, wave_='square'):
    out, ph = [], 0.0
    for i in range(n):
        f = f0 + (f1 - f0) * i / max(1, n - 1)
        ph += 2 * math.pi * f / SR
        s = math.sin(ph)
        out.append((1 if s >= 0 else -1) if wave_ == 'square' else s)
    return out

def env(x, a=0.002, r=0.02):
    n = len(x); A = int(a * SR); Rr = int(r * SR)
    return [s * min(1, i / max(1, A)) * min(1, (n - i) / max(1, Rr)) for i, s in enumerate(x)]

def place(buf, x, at_ms, gain):
    o = int(at_ms * SR / 1000)
    for i, s in enumerate(x):
        if o + i < len(buf): buf[o + i] += s * gain

def stutter(x, slice_ms, reps):
    k = int(slice_ms * SR / 1000); sl = x[:k]
    return sl * reps

def build(total_ms, events, seed, k=1.0):
    # k time-scales the event list (authored at the original length) to total_ms.
    events = [(kd, at * k, d * k, g, (a * k if kd == 'stutter' else a), b) for kd, at, d, g, a, b in events]
    rng = random.Random(seed)
    buf = [0.0] * int(total_ms * SR / 1000)
    for kind, at, dur, gain, a, b in events:
        n = int(dur * SR / 1000)
        if kind == 'noise': x = crush(noise(n, rng), a, b)
        elif kind == 'tone': x = crush(tone(n, a, b), 5, 3)
        elif kind == 'stutter': x = stutter(crush(noise(int(a * SR / 1000), rng), 4, 6), a, b)
        place(buf, env(x), at, gain)
    peak = max(1e-9, max(abs(s) for s in buf))
    return [s / peak * 0.5 for s in buf]   # -6 dBFS peak

def write(name, data):
    with wave.open(os.path.join(here, 'Slopgang', 'Resources', 'Sounds', name), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, s)) * 32767)) for s in data))

# kind, at ms, dur ms, gain, a, b
# noise: a = bits, b = hold. tone: a -> b Hz. stutter: a = slice ms, b = repeats.
glitch_in = [
    ('noise',   0,  40, 1.0, 4, 8),     # hit: RGB split
    ('tone',    0, 120, 0.5, 1800, 220),# falling crushed square: block displacement
    ('stutter', 60, 180, 0.8, 18, 10),  # digital stutter: scanline tearing
    ('noise',  240, 160, 0.6, 3, 20),   # low, coarse smear: datamosh
    ('tone',   300, 140, 0.35, 90, 60), # sub thud under the smear
    ('noise',  450,  60, 0.4, 6, 2),    # final tick as the page settles clean
]
glitch_out = [
    ('noise',   0,  30, 1.0, 4, 8),
    ('stutter', 20, 140, 0.7, 14, 10),
    ('tone',    40, 200, 0.4, 260, 1600),  # rising: reverse of the falling sweep
    ('noise',  240,  50, 0.4, 6, 2),
]
write('glitch-in.wav', build(520, glitch_in, 7))
write('glitch-out.wav', build(200, glitch_out, 11, 200 / 300))
print('ok')
