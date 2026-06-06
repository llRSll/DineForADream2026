"""Make the OzGeeOm logo background transparent and extract a clean icon mark.

Produces, in public/:
  - logo-full.png : full lockup, white background removed, tightly trimmed
  - logo-mark.png : icon only (Africa + springbok), transparent, trimmed square-ish
"""

from collections import deque
from PIL import Image

SRC = "public/logo.png"
OUT_FULL = "public/logo-full.png"
OUT_MARK = "public/logo-mark.png"

# Pixels at/above this on all channels are treated as background white.
WHITE_THRESHOLD = 238


def is_background(px):
    r, g, b = px[0], px[1], px[2]
    return r >= WHITE_THRESHOLD and g >= WHITE_THRESHOLD and b >= WHITE_THRESHOLD


def remove_background(img):
    """Flood fill transparent from the borders so only the outer white goes.

    Interior whites (e.g. inside letters or the flag) are preserved.
    """
    img = img.convert("RGBA")
    w, h = img.size
    px = img.load()
    visited = bytearray(w * h)
    q = deque()

    def consider(x, y):
        idx = y * w + x
        if visited[idx]:
            return
        visited[idx] = 1
        if is_background(px[x, y]):
            q.append((x, y))

    for x in range(w):
        consider(x, 0)
        consider(x, h - 1)
    for y in range(h):
        consider(0, y)
        consider(w - 1, y)

    while q:
        x, y = q.popleft()
        px[x, y] = (255, 255, 255, 0)
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h:
                consider(nx, ny)

    return img


def alpha_bbox(img):
    return img.getbbox()


def trim(img, pad=12):
    box = alpha_bbox(img)
    if not box:
        return img
    left, top, right, bottom = box
    left = max(0, left - pad)
    top = max(0, top - pad)
    right = min(img.size[0], right + pad)
    bottom = min(img.size[1], bottom + pad)
    return img.crop((left, top, right, bottom))


def column_content_count(img, x, top, bottom):
    px = img.load()
    count = 0
    for y in range(top, bottom):
        if px[x, y][3] > 16:
            count += 1
    return count


def extract_mark(img):
    """Crop the icon by finding the emptiest column in the gap before the wordmark.

    The icon sits in roughly the left third; the gray Africa outline bridges most
    columns, so instead of looking for a fully empty gap we pick the column with
    the least content within the expected separator band.
    """
    w, h = img.size
    box = img.getbbox()
    if not box:
        return img
    left, top, right, bottom = box

    band_start = int(w * 0.30)
    band_end = int(w * 0.42)
    best_x = band_start
    best_count = None
    for x in range(band_start, band_end):
        count = column_content_count(img, x, top, bottom)
        if best_count is None or count < best_count:
            best_count = count
            best_x = x

    icon = img.crop((left, top, best_x, bottom))
    return trim(icon)


def main():
    original = Image.open(SRC)
    cleaned = remove_background(original)

    full = trim(cleaned, pad=16)
    full.save(OUT_FULL)
    print("full", full.size)

    mark = extract_mark(cleaned)
    mark.save(OUT_MARK)
    print("mark", mark.size)


if __name__ == "__main__":
    main()
