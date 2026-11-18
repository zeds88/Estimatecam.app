"""Create the original fictional demo mark without third-party artwork."""

from pathlib import Path

from PIL import Image, ImageDraw

SCALE = 4
output = Path(__file__).parent / "ironvale-mark.png"
image = Image.new("RGBA", (256 * SCALE, 256 * SCALE))
draw = ImageDraw.Draw(image)
draw.rounded_rectangle(
    (0, 0, 256 * SCALE - 1, 256 * SCALE - 1),
    radius=32 * SCALE,
    fill="#18212b",
)
for box, color in [
    ((40, 56, 216, 84), "#f28c28"),
    ((56, 108, 200, 136), "#ffffff"),
    ((72, 160, 184, 188), "#f28c28"),
]:
    draw.rectangle(tuple(value * SCALE for value in box), fill=color)
draw.line(
    (88 * SCALE, 212 * SCALE, 168 * SCALE, 212 * SCALE),
    fill="#ffffff",
    width=8 * SCALE,
)
image.resize((256, 256), Image.Resampling.LANCZOS).save(output)
