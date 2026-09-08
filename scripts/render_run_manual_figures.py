#!/usr/bin/env python3
"""Render how-to-run screenshots for the EasyCircular user manual."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "user-manual" / "images"
HOME = OUT / "home.png"

NAVY = (15, 23, 42)
NAVY_MID = (30, 41, 59)
SLATE = (51, 65, 85)
MUTED = (100, 116, 139)
CYAN = (8, 145, 173)
BLUE = (37, 99, 235)
EMERALD = (5, 150, 105)
WHITE = (255, 255, 255)
BG = (241, 245, 249)
ROW_ALT = (248, 250, 252)
BORDER = (226, 232, 240)
SELECT = (219, 234, 254)
SELECT_BD = (147, 197, 253)
WIN_BG = (243, 244, 246)
TERM_BG = (15, 23, 42)
TERM_FG = (226, 232, 240)
TERM_OK = (52, 211, 153)
TERM_DIM = (148, 163, 184)
TERM_CYAN = (34, 211, 238)
TERM_YEL = (253, 224, 71)


def font(size: int, bold: bool = False, mono: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    if mono:
        names = ["consolab.ttf" if bold else "consola.ttf", "courbd.ttf" if bold else "cour.ttf"]
    else:
        names = ["segoeuib.ttf" if bold else "segoeui.ttf", "calibrib.ttf" if bold else "calibri.ttf"]
    for name in names:
        path = Path("C:/Windows/Fonts") / name
        try:
            return ImageFont.truetype(str(path), size)
        except OSError:
            continue
    return ImageFont.load_default()


def rr(draw: ImageDraw.ImageDraw, box, fill, outline=None, width=1, radius=12) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def shadow(base: Image.Image, box, radius=18, blur=12, alpha=50) -> None:
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle(box, radius=radius, fill=(15, 23, 42, alpha))
    base.alpha_composite(layer.filter(ImageFilter.GaussianBlur(blur)))


def caption_chip(draw: ImageDraw.ImageDraw, xy, text: str) -> None:
    x, y = xy
    f = font(15, bold=True)
    w = int(draw.textlength(text, font=f))
    rr(draw, (x, y, x + w + 22, y + 30), fill=(15, 23, 42), radius=8)
    draw.text((x + 11, y + 5), text, fill=WHITE, font=f)


def win_chrome(img: Image.Image, box, title: str, subtitle: str | None = None) -> tuple[int, int, int, int]:
    """Draw a Windows 11 style window. Returns inner content box."""
    x0, y0, x1, y1 = box
    d = ImageDraw.Draw(img)
    rr(d, box, fill=WHITE, outline=BORDER, width=2, radius=14)
    d.rectangle((x0 + 1, y0 + 1, x1 - 1, y0 + 42), fill=(249, 250, 251))
    d.line((x0 + 8, y0 + 42, x1 - 8, y0 + 42), fill=BORDER, width=1)
    for i, col in enumerate(((239, 68, 68), (245, 158, 11), (34, 197, 94))):
        cx = x0 + 22 + i * 18
        d.ellipse((cx, y0 + 16, cx + 11, y0 + 27), fill=col)
    d.text((x0 + 82, y0 + 11), title, fill=NAVY, font=font(15, bold=True))
    if subtitle:
        d.text((x0 + 82, y0 + 28), subtitle, fill=MUTED, font=font(11))
    return (x0 + 2, y0 + 44, x1 - 2, y1 - 2)


def render_folder() -> Path:
    w, h = 1600, 980
    img = Image.new("RGBA", (w, h), (*BG, 255))
    shadow(img, (70, 70, 1530, 910), radius=18, blur=16, alpha=40)
    d = ImageDraw.Draw(img)
    inner = win_chrome(img, (80, 60, 1520, 900), "EasyCircular_2540881", "File Explorer")
    ix0, iy0, ix1, iy1 = inner

    # Address bar
    rr(d, (ix0 + 18, iy0 + 14, ix1 - 18, iy0 + 52), fill=ROW_ALT, outline=BORDER, radius=8)
    d.text(
        (ix0 + 32, iy0 + 23),
        r"This PC  >  Documents  >  GitHub  >  EasyCircular_2540881",
        fill=SLATE,
        font=font(14),
    )

    # Sidebar
    sx1 = ix0 + 250
    d.rectangle((ix0, iy0 + 66, sx1, iy1), fill=(248, 250, 252))
    d.line((sx1, iy0 + 66, sx1, iy1), fill=BORDER, width=1)
    for i, name in enumerate(("Home", "Documents", "Downloads", "GitHub")):
        y = iy0 + 86 + i * 36
        col = BLUE if name == "GitHub" else SLATE
        d.text((ix0 + 28, y), name, fill=col, font=font(14, bold=(name == "GitHub")))

    headers = [("Name", 40), ("Type", 520), ("Size", 760)]
    hy = iy0 + 78
    for label, dx in headers:
        d.text((sx1 + dx, hy), label, fill=MUTED, font=font(12, bold=True))
    d.line((sx1 + 16, hy + 26, ix1 - 16, hy + 26), fill=BORDER, width=1)

    rows = [
        ("ai-service", "File folder", "", False),
        ("backend", "File folder", "", False),
        ("frontend", "File folder", "", False),
        ("scripts", "File folder", "", False),
        ("docker-compose.yml", "YAML file", "2 KB", False),
        ("package.json", "JSON file", "1 KB", False),
        ("start.bat", "Windows Batch File", "1 KB", True),
        ("start.ps1", "Windows PowerShell script", "10 KB", False),
    ]
    for i, (name, kind, size, selected) in enumerate(rows):
        y = hy + 34 + i * 44
        box = (sx1 + 12, y, ix1 - 18, y + 40)
        if selected:
            rr(d, box, fill=SELECT, outline=SELECT_BD, radius=8)
        d.ellipse((sx1 + 28, y + 10, sx1 + 48, y + 30), fill=BLUE if selected else (14, 165, 233))
        if name.endswith(".bat"):
            d.text((sx1 + 32, y + 11), ">", fill=WHITE, font=font(12, bold=True))
        d.text((sx1 + 60, y + 9), name, fill=NAVY, font=font(15, bold=selected))
        d.text((sx1 + 520, y + 10), kind, fill=SLATE, font=font(13))
        d.text((sx1 + 760, y + 10), size, fill=MUTED, font=font(13))

    # Callout
    cy0, cy1 = hy + 34 + 6 * 44 - 8, hy + 34 + 6 * 44 + 48
    ax0, ay0 = ix1 - 360, cy0 - 70
    rr(d, (ax0, ay0, ix1 - 40, ay0 + 58), fill=(15, 23, 42), radius=10)
    d.text((ax0 + 16, ay0 + 10), "Double-click start.bat", fill=WHITE, font=font(16, bold=True))
    d.text((ax0 + 16, ay0 + 32), "This starts the whole system", fill=(165, 243, 252), font=font(12))
    d.polygon(
        [(ax0 + 40, ay0 + 58), (ax0 + 58, ay0 + 58), (sx1 + 90, cy1 - 6)],
        fill=NAVY,
    )

    caption_chip(d, (80, 18), "Step 1  ·  Open the project folder")
    path = OUT / "run-folder.png"
    img.convert("RGB").save(path, quality=95)
    return path


def term_window(draw: ImageDraw.ImageDraw, box, title: str, lines: list[tuple[str, tuple[int, int, int]]]) -> None:
    x0, y0, x1, y1 = box
    rr(draw, box, fill=TERM_BG, outline=(51, 65, 85), width=2, radius=12)
    draw.rectangle((x0 + 1, y0 + 1, x1 - 1, y0 + 36), fill=NAVY_MID)
    for i, col in enumerate(((239, 68, 68), (245, 158, 11), (34, 197, 94))):
        cx = x0 + 18 + i * 16
        draw.ellipse((cx, y0 + 12, cx + 10, y0 + 22), fill=col)
    draw.text((x0 + 72, y0 + 8), title, fill=WHITE, font=font(13, bold=True))
    y = y0 + 48
    mono = font(13, mono=True)
    for text, color in lines:
        draw.text((x0 + 18, y), text, fill=color, font=mono)
        y += 22


def render_services() -> Path:
    w, h = 1680, 1080
    img = Image.new("RGBA", (w, h), (*BG, 255))
    shadow(img, (40, 50, 1640, 1040), radius=10, blur=14, alpha=35)
    d = ImageDraw.Draw(img)

    starter_lines = [
        ("EasyCircular  ·  G.G.M.P. Kusumsiri 2540881", TERM_CYAN),
        ("Checking Node.js...", TERM_DIM),
        ("Using C:\\Program Files\\nodejs\\node.exe", TERM_FG),
        ("Checking Python...", TERM_DIM),
        ("MongoDB is running.", TERM_OK),
        ("Started:", TERM_CYAN),
        ("  Frontend  http://localhost:3002", TERM_OK),
        ("  Backend   http://localhost:4000/health", TERM_OK),
        ("  AI        http://localhost:5000/health", TERM_OK),
        ("", TERM_FG),
        ("Open http://localhost:3002", TERM_YEL),
        ("Leave the three windows below open.", TERM_DIM),
    ]
    term_window(d, (50, 70, 800, 420), "start.bat", starter_lines)

    term_window(
        d,
        (830, 70, 1630, 330),
        "AI :5000",
        [
            ("[AI :5000]", TERM_OK),
            ("INFO:     Started server process", TERM_DIM),
            ("INFO:     Waiting for application startup.", TERM_DIM),
            ("INFO:     Application startup complete.", TERM_OK),
            ("INFO:     Uvicorn running on http://127.0.0.1:5000", TERM_CYAN),
            ("INFO:     (Press CTRL+C to quit)", TERM_DIM),
        ],
    )
    term_window(
        d,
        (50, 450, 800, 1020),
        "Backend :4000",
        [
            ("[Backend :4000]", TERM_OK),
            ("> npm run dev", TERM_DIM),
            ("[nodemon] starting `node src/index.js`", TERM_DIM),
            ("EasyCircular API listening on port 4000", TERM_OK),
            ("MongoDB connected", TERM_OK),
            ("GET /health  200", TERM_FG),
        ],
    )
    term_window(
        d,
        (830, 360, 1630, 1020),
        "Frontend :3002",
        [
            ("[Frontend :3002]", TERM_OK),
            ("> next dev -p 3002", TERM_DIM),
            ("▲ Next.js", TERM_CYAN),
            ("- Local:        http://localhost:3002", TERM_OK),
            ("- Network:      http://127.0.0.1:3002", TERM_DIM),
            ("✓ Ready in 2.1s", TERM_OK),
            ("", TERM_FG),
            ("Keep this window open while you use the site.", TERM_YEL),
        ],
    )
    caption_chip(d, (50, 18), "Step 2  ·  Three windows stay open")
    path = OUT / "run-services.png"
    img.convert("RGB").save(path, quality=95)
    return path


def browser_frame(content: Image.Image, url: str, tab: str = "EasyCircular") -> Image.Image:
    cw, ch = content.size
    pad_x, top, bot = 18, 86, 18
    w, h = cw + pad_x * 2, ch + top + bot
    img = Image.new("RGB", (w, h), BG)
    d = ImageDraw.Draw(img)
    rr(d, (8, 8, w - 8, h - 8), fill=WHITE, outline=BORDER, width=2, radius=16)
    d.rectangle((10, 10, w - 10, top), fill=(249, 250, 251))
    for i, col in enumerate(((239, 68, 68), (245, 158, 11), (34, 197, 94))):
        cx = 28 + i * 18
        d.ellipse((cx, 22, cx + 12, 34), fill=col)
    rr(d, (96, 16, 280, 46), fill=WHITE, outline=BORDER, radius=8)
    d.text((112, 22), tab, fill=NAVY, font=font(13, bold=True))
    rr(d, (24, 52, w - 24, 78), fill=ROW_ALT, outline=BORDER, radius=8)
    d.text((40, 56), url, fill=BLUE, font=font(14, bold=True))
    d.line((10, top, w - 10, top), fill=BORDER, width=1)
    img.paste(content, (pad_x, top))
    return img


def render_browser() -> Path:
    home = Image.open(HOME).convert("RGB")
    # Keep the hero readable in the manual: crop the top of the landing page.
    crop_h = min(home.height, int(home.width * 0.52))
    hero = home.crop((0, 0, home.width, crop_h))
    hero = hero.resize((1400, int(1400 * hero.height / hero.width)), Image.Resampling.LANCZOS)
    framed = browser_frame(hero, "http://localhost:3002")
    d = ImageDraw.Draw(framed)
    caption_chip(d, (20, 10), "Step 3  ·  Open Chrome")
    path = OUT / "run-browser.png"
    framed.save(path, quality=95)
    return path


def render_system_status() -> Path:
    w, h = 1400, 920
    page = Image.new("RGB", (w, h), WHITE)
    d = ImageDraw.Draw(page)

    # Soft page background
    d.rectangle((0, 0, w, h), fill=(248, 250, 252))
    d.text((w // 2, 48), "SYSTEM STATUS", fill=CYAN, font=font(13, bold=True), anchor="mm")
    d.text((w // 2, 92), "Service health", fill=NAVY, font=font(36, bold=True), anchor="mm")
    d.text(
        (w // 2, 138),
        "Backend, MongoDB, AI pipeline, and local LLM should all show as healthy before you upload.",
        fill=SLATE,
        font=font(16),
        anchor="mm",
    )

    card = (220, 190, 1180, 820)
    rr(d, card, fill=(255, 255, 255), outline=BORDER, width=2, radius=24)

    banner = (250, 220, 1150, 280)
    rr(d, banner, fill=(236, 253, 245), outline=(167, 243, 208), radius=14)
    d.ellipse((272, 244, 288, 260), fill=EMERALD)
    d.text((304, 238), "All systems operational", fill=(6, 95, 70), font=font(18, bold=True))

    rows = [
        ("Backend API", "ok"),
        ("MongoDB", "connected"),
        ("AI Service", "ok  ·  ollama / llama3.2:3b"),
    ]
    for i, (label, detail) in enumerate(rows):
        y = 310 + i * 110
        rr(d, (250, y, 1150, y + 92), fill=(241, 245, 249), radius=16)
        d.text((280, y + 30), label, fill=NAVY, font=font(22, bold=True))
        dw = int(d.textlength(detail, font=font(16, bold=True)))
        d.ellipse((1150 - 56 - dw, y + 40, 1150 - 40 - dw, y + 56), fill=EMERALD)
        d.text((1150 - 32 - dw, y + 32), detail, fill=(6, 95, 70), font=font(16, bold=True))

    d.text((1150, 760), "Refreshes every 15s", fill=MUTED, font=font(13), anchor="rt")

    framed = browser_frame(page, "http://localhost:3002  ·  scroll to System Status")
    d2 = ImageDraw.Draw(framed)
    caption_chip(d2, (20, 10), "Step 4  ·  Check System Status")
    path = OUT / "run-system-status.png"
    framed.save(path, quality=95)
    return path


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    paths = [
        render_folder(),
        render_services(),
        render_browser(),
        render_system_status(),
    ]
    for p in paths:
        print("Wrote", p)


if __name__ == "__main__":
    main()
