"""Derives a team's primary/secondary brand colors from its real crest image
(not a hand-typed guess) — so per-team theming reflects the club's actual crest
asset rather than fabricated color data.
"""
import colorsys
from collections import Counter
from io import BytesIO

import requests
from PIL import Image

QUANTIZE_STEP = 16


def _quantized_color_counts(img: Image.Image) -> Counter:
    counter: Counter = Counter()
    for r, g, b, a in img.convert("RGBA").getdata():
        if a < 250:
            continue  # skip anti-aliased edge pixels — they blend with the background
        if r > 235 and g > 235 and b > 235:
            continue  # near-white background/outline
        if r < 20 and g < 20 and b < 20:
            continue  # near-black outline
        key = (r // QUANTIZE_STEP * QUANTIZE_STEP, g // QUANTIZE_STEP * QUANTIZE_STEP, b // QUANTIZE_STEP * QUANTIZE_STEP)
        counter[key] += 1
    return counter


def _hue_degrees(rgb: tuple[int, int, int]) -> float:
    h, _, _ = colorsys.rgb_to_hsv(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255)
    return h * 360


def _to_hex(rgb: tuple[int, int, int]) -> str:
    return "#{:02x}{:02x}{:02x}".format(*rgb)


def _readable_ink(rgb: tuple[int, int, int]) -> str:
    """Simple relative-luminance check to pick black or white text on this color."""
    r, g, b = (c / 255 for c in rgb)
    luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
    return "#0b0b08" if luminance > 0.55 else "#f7f6f2"


def extract_team_colors(crest_url: str) -> dict | None:
    """Returns {"primary": hex, "primary_ink": hex, "secondary": hex} or None on failure."""
    try:
        resp = requests.get(crest_url, timeout=10)
        resp.raise_for_status()
        img = Image.open(BytesIO(resp.content))
    except Exception:
        return None

    counts = _quantized_color_counts(img)
    if not counts:
        return None

    scored = []
    for rgb, count in counts.items():
        _, s, _ = colorsys.rgb_to_hsv(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255)
        scored.append((rgb, count * (0.3 + s)))
    scored.sort(key=lambda x: -x[1])

    primary = scored[0][0]
    secondary = None
    for rgb, _ in scored[1:]:
        hue_gap = abs(_hue_degrees(rgb) - _hue_degrees(primary))
        hue_gap = min(hue_gap, 360 - hue_gap)
        if hue_gap >= 25:
            secondary = rgb
            break
    if secondary is None and len(scored) > 1:
        secondary = scored[1][0]

    return {
        "primary": _to_hex(primary),
        "primary_ink": _readable_ink(primary),
        "secondary": _to_hex(secondary) if secondary else _to_hex(primary),
    }
