#!/usr/bin/env python3
"""Original CC0 camouflage textures for the engagement sphere.

These are not scans of issued fabric (EMR, MM-14, MARPAT, CARC). Each file is
generated here so the public repo can ship an OE skin without a purchased archive.

Output: source/public/models/skins/<oe-id>/*.png and index.json
"""

from __future__ import annotations

import math
import os
import random
import shutil

from PIL import Image, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "public", "models", "skins"))
SIZE = 1024


def fade(t: float) -> float:
    return t * t * (3.0 - 2.0 * t)


def lattice(cells: int, seed: int) -> list[float]:
    rng = random.Random(seed)
    span = cells + 2
    return [rng.random() for _ in range(span * span)]


def sample(grid: list[float], cells: int, x: float, y: float) -> float:
    span = cells + 2
    gx = (x % 1.0) * cells
    gy = (y % 1.0) * cells
    ix = int(gx)
    iy = int(gy)
    fx = fade(gx - ix)
    fy = fade(gy - iy)

    def at(cx: int, cy: int) -> float:
        return grid[cy * span + cx]

    v00 = at(ix, iy)
    v10 = at(ix + 1, iy)
    v01 = at(ix, iy + 1)
    v11 = at(ix + 1, iy + 1)
    return (v00 * (1 - fx) + v10 * fx) * (1 - fy) + (v01 * (1 - fx) + v11 * fx) * fy


def fbm(x: float, y: float, layers: list[tuple[list[float], int, float]]) -> float:
    acc = 0.0
    weight = 0.0
    for grid, cells, amp in layers:
        acc += sample(grid, cells, x, y) * amp
        weight += amp
    return acc / weight


def mix(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    t = max(0.0, min(1.0, t))
    return tuple(int(a[i] * (1 - t) + b[i] * t) for i in range(3))  # type: ignore[return-value]


def weave(x: int, y: int) -> float:
    return 0.94 + 0.06 * (0.5 + 0.5 * math.sin(x * 0.85) * math.sin(y * 0.72))


def paint(size: int, color_at) -> Image.Image:
    img = Image.new("RGB", (size, size))
    px = img.load()
    for y in range(size):
        v = y / size
        for x in range(size):
            u = x / size
            r, g, b = color_at(u, v, x, y)
            w = weave(x, y)
            px[x, y] = (min(255, int(r * w)), min(255, int(g * w)), min(255, int(b * w)))
    return img


def blotch(colors: list[tuple[float, tuple[int, int, int]]], seed: int, cells: tuple[int, int, int]):
    layers = [
        (lattice(cells[0], seed), cells[0], 0.55),
        (lattice(cells[1], seed + 17), cells[1], 0.30),
        (lattice(cells[2], seed + 41), cells[2], 0.15),
    ]

    def color_at(u: float, v: float, _x: int, _y: int) -> tuple[int, int, int]:
        n = fbm(u, v, layers)
        chosen = colors[-1][1]
        for limit, rgb in colors:
            if n < limit:
                chosen = rgb
                break
        return chosen

    img = paint(SIZE, color_at)
    return img.filter(ImageFilter.SMOOTH_MORE)


WOODLAND = [
    (0.34, (28, 32, 20)),
    (0.58, (58, 72, 36)),
    (0.76, (112, 104, 62)),
    (1.01, (92, 108, 48)),
]
DESERT = [
    (0.30, (92, 68, 42)),
    (0.55, (168, 132, 84)),
    (0.78, (214, 190, 150)),
    (1.01, (140, 108, 70)),
]
ARCTIC = [
    (0.28, (150, 162, 170)),
    (0.55, (214, 222, 226)),
    (0.78, (236, 240, 242)),
    (1.01, (186, 198, 204)),
]
JUNGLE = [
    (0.32, (14, 28, 18)),
    (0.58, (28, 62, 32)),
    (0.78, (78, 96, 40)),
    (1.01, (46, 84, 38)),
]


def digital(seed: int) -> Image.Image:
    """Temperate pixel clusters. Macro shapes are noise; the cells are original."""
    macro = [
        (lattice(6, seed), 6, 0.7),
        (lattice(14, seed + 3), 14, 0.3),
    ]
    palette = [
        (48, 56, 32),
        (96, 86, 58),
        (28, 30, 26),
        (132, 124, 90),
    ]
    cell = 14
    img = Image.new("RGB", (SIZE, SIZE))
    px = img.load()
    for y in range(0, SIZE, cell):
        for x in range(0, SIZE, cell):
            n = fbm((x + cell / 2) / SIZE, (y + cell / 2) / SIZE, macro)
            rgb = palette[min(3, int(n * 4))]
            for yy in range(y, min(SIZE, y + cell)):
                for xx in range(x, min(SIZE, x + cell)):
                    px[xx, yy] = rgb
    return img


def naval() -> Image.Image:
    """Haze grey with large darker panels. Low contrast on purpose."""
    panels = [
        (lattice(4, 90), 4, 0.75),
        (lattice(9, 91), 9, 0.25),
    ]
    base = (141, 150, 158)
    dark = (92, 100, 108)
    light = (168, 176, 182)
    mid = (118, 126, 134)

    def color_at(u: float, v: float, _x: int, _y: int) -> tuple[int, int, int]:
        n = fbm(u, v, panels)
        if n < 0.38:
            return dark
        if n < 0.55:
            return mid
        if n > 0.82:
            return light
        return base

    return paint(SIZE, color_at).filter(ImageFilter.SMOOTH)


def write_index(folder: str) -> None:
    path = os.path.join(folder, "index.json")
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(
            '{\n  "modelTexture": {},\n  "modelGlb": {}\n}\n'
        )


def save(folder: str, name: str, image: Image.Image) -> None:
    os.makedirs(folder, exist_ok=True)
    path = os.path.join(folder, name)
    image.save(path, "PNG", optimize=True)
    print(f"WROTE {path}")


def main() -> None:
    woodland = blotch(WOODLAND, 11, (5, 11, 23))
    desert = blotch(DESERT, 23, (5, 10, 21))
    arctic = blotch(ARCTIC, 31, (4, 9, 18))
    jungle = blotch(JUNGLE, 47, (5, 12, 22))
    pixels = digital(19)
    grey = naval()

    ukraine = os.path.join(ROOT, "ukraine-east")
    suwalki = os.path.join(ROOT, "suwalki-gap")
    hormuz = os.path.join(ROOT, "hormuz")
    arctic_dir = os.path.join(ROOT, "arctic")
    jungle_dir = os.path.join(ROOT, "jungle")

    save(ukraine, "temperate-woodland.png", woodland)
    save(ukraine, "ukrainian-digital.png", pixels)
    save(suwalki, "temperate-woodland.png", woodland)
    save(hormuz, "desert-tan.png", desert)
    save(hormuz, "naval-grey.png", grey)
    save(arctic_dir, "arctic.png", arctic)
    save(jungle_dir, "jungle.png", jungle)

    for folder in (ukraine, suwalki, hormuz, arctic_dir, jungle_dir):
        write_index(folder)

    # Keep a byte-identical Suwałki copy if Pillow saved twice with the same pixels.
    shutil.copyfile(
        os.path.join(ukraine, "temperate-woodland.png"),
        os.path.join(suwalki, "temperate-woodland.png"),
    )


if __name__ == "__main__":
    main()
