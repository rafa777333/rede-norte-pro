import os
import io
import math
import uuid
import base64
from typing import Optional, Dict, Any, List
from pathlib import Path

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from PIL import Image, ImageDraw, ImageFont

# Diretórios base
BASE_DIR = Path(__file__).resolve().parent
ASSETS_DIR = BASE_DIR / "assets"
FONTS_DIR = ASSETS_DIR / "fonts"
LOGO_DIR = ASSETS_DIR / "logo"
OUTPUT_DIR = BASE_DIR / "output"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Fontes padrão
FONT_EXTRABOLD = str(FONTS_DIR / "Montserrat-ExtraBold.ttf")
FONT_BOLD = str(FONTS_DIR / "Montserrat-Bold.ttf")

# Logo oficial RA
LOGO_PATH = str(LOGO_DIR / "logo_ra_clean.png")

app = FastAPI(
    title="Rede Apucarana - Carimbo Oficial Microservice",
    description="Microserviço local e gratuito para carimbar artes de notícias nas proporções 1080x1350, 1080x1080 e 1080x1920.",
    version="1.0.0"
)

# Servir imagens geradas estaticamente
app.mount("/output", StaticFiles(directory=str(OUTPUT_DIR)), name="output")


class GenerateRequest(BaseModel):
    image_url: str = Field(..., description="URL pública da fotografia original da matéria")
    headline: str = Field(..., description="Manchete / Título da notícia")
    category: str = Field(default="NOTÍCIA", description="Categoria da matéria (ex: POLÍTICA, POLICIAL, ESPORTES)")
    link: Optional[str] = Field(default="", description="Link da matéria no portal")


def get_font(path: str, size: int) -> ImageFont.FreeTypeFont:
    if os.path.exists(path):
        return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def aspect_fill_crop(image: Image.Image, target_w: int, target_h: int) -> Image.Image:
    """Ajusta e centraliza a foto para cobrir exatamente as dimensões mantendo proporção."""
    img_ratio = image.width / image.height
    target_ratio = target_w / target_h

    if img_ratio > target_ratio:
        new_w = int(image.height * target_ratio)
        offset = (image.width - new_w) // 2
        cropped = image.crop((offset, 0, offset + new_w, image.height))
    else:
        new_h = int(image.width / target_ratio)
        offset = (image.height - new_h) // 2
        cropped = image.crop((0, offset, image.width, offset + new_h))

    return cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)


def wrap_text_to_lines(text: str, font: ImageFont.FreeTypeFont, max_width: int, draw: ImageDraw.ImageDraw) -> List[str]:
    """Quebra o texto em linhas respeitando a largura máxima."""
    words = text.split()
    lines = []
    current_line = []

    for word in words:
        test_line = " ".join(current_line + [word])
        bbox = draw.textbbox((0, 0), test_line, font=font)
        if bbox[2] - bbox[0] <= max_width:
            current_line.append(word)
        else:
            if current_line:
                lines.append(" ".join(current_line))
                current_line = [word]
            else:
                lines.append(word)
                current_line = []

    if current_line:
        lines.append(" ".join(current_line))

    return lines


def generate_single_format(
    base_image: Image.Image,
    target_w: int,
    target_h: int,
    category: str,
    headline: str,
    format_type: str = "4_5"
) -> Image.Image:
    """Gera o layout com degradê inferior, tag vermelha, manchete e logo RA."""
    canvas = aspect_fill_crop(base_image, target_w, target_h)

    # 1. Tarja preta com degradê suave embaixo
    gradient = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    start_ratio = 0.44 if format_type == "4_5" else 0.46 if format_type == "1_1" else 0.52
    start_y = int(target_h * start_ratio)

    for y in range(start_y, target_h):
        progress = (y - start_y) / (target_h - start_y)
        alpha = int(255 * (progress ** 1.6))
        for x in range(target_w):
            gradient.putpixel((x, y), (0, 0, 0, min(255, alpha)))

    canvas = Image.alpha_composite(canvas.convert("RGBA"), gradient)
    draw = ImageDraw.Draw(canvas)

    # 2. Logo Oficial RA no canto inferior direito
    logo_w, logo_h = 160, 134
    logo_margin_right = 65
    logo_margin_bottom = 65 if format_type != "9_16" else 140
    logo_x = target_w - logo_margin_right - logo_w
    logo_y = target_h - logo_margin_bottom - logo_h

    if os.path.exists(LOGO_PATH):
        logo_img = Image.open(LOGO_PATH).convert("RGBA").resize((logo_w, logo_h), Image.Resampling.LANCZOS)
        canvas.paste(logo_img, (logo_x, logo_y), logo_img)

    # 3. Quebra de linha da manchete garantindo no máximo 3 linhas
    max_text_width = target_w - 140  # 70px de margem em cada lado
    font_size = 64 if format_type == "4_5" else 56 if format_type == "1_1" else 62

    headline_font = get_font(FONT_EXTRABOLD, font_size)
    lines = wrap_text_to_lines(headline, headline_font, max_text_width, draw)

    while len(lines) > 3 and font_size >= 38:
        font_size -= 4
        headline_font = get_font(FONT_EXTRABOLD, font_size)
        lines = wrap_text_to_lines(headline, headline_font, max_text_width, draw)

    # Se ainda ultrapassar 3 linhas, trunca na terceira linha com reticências
    if len(lines) > 3:
        lines = lines[:3]
        lines[2] = lines[2].rstrip(".,- ") + "..."

    line_spacing = int(font_size * 0.22)
    line_heights = []
    total_headline_h = 0
    for line in lines:
        bb = draw.textbbox((0, 0), line, font=headline_font)
        lh = bb[3] - bb[1]
        line_heights.append(lh)
        total_headline_h += lh
    total_headline_h += (len(lines) - 1) * line_spacing

    # 4. Tag de Categoria Vermelha #FF0000
    cat_font_size = 32 if format_type != "1_1" else 28
    cat_font = get_font(FONT_EXTRABOLD, cat_font_size)
    cat_text = category.strip().upper()
    cat_bb = draw.textbbox((0, 0), cat_text, font=cat_font)
    cat_tw = cat_bb[2] - cat_bb[0]
    cat_th = cat_bb[3] - cat_bb[1]

    pad_x = 22
    pad_y = 10
    tag_w = cat_tw + (pad_x * 2)
    tag_h = cat_th + (pad_y * 2)

    margin_left = 70
    headline_y = target_h - logo_margin_bottom - total_headline_h - 15
    tag_y = headline_y - tag_h - 24
    tag_x = margin_left

    # Desenhar Tag Vermelha arredondada
    draw.rounded_rectangle([tag_x, tag_y, tag_x + tag_w, tag_y + tag_h], radius=12, fill="#FF0000")
    draw.text((tag_x + pad_x, tag_y + pad_y - 2), cat_text, fill="#FFFFFF", font=cat_font)

    # Desenhar Manchete em Branco Montserrat-ExtraBold
    cur_y = headline_y
    for i, line in enumerate(lines):
        draw.text((margin_left, cur_y), line, fill="#FFFFFF", font=headline_font)
        cur_y += line_heights[i] + line_spacing

    return canvas.convert("RGB")


async def download_image(url: str) -> Image.Image:
    """Baixa a imagem da URL ou faz fallback seguro."""
    if not url or not url.startswith("http"):
        ref_path = str(ASSETS_DIR / "frame_ref.jpg")
        if os.path.exists(ref_path):
            return Image.open(ref_path)
        return Image.new("RGB", (1080, 1350), color="#1e293b")

    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
            if resp.status_code == 200:
                return Image.open(io.BytesIO(resp.content))
    except Exception as e:
        print(f"Aviso: falha ao baixar imagem remota ({e}), usando imagem local de fallback.")

    ref_path = str(ASSETS_DIR / "frame_ref.jpg")
    if os.path.exists(ref_path):
        return Image.open(ref_path)
    return Image.new("RGB", (1080, 1350), color="#1e293b")


@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Rede Apucarana - Carimbo Oficial de Imagens",
        "endpoints": {
            "POST /generate": "Gera as 3 artes carimbadas (1080x1350, 1080x1080, 1080x1920)"
        }
    }


@app.post("/generate")
async def generate_images(req: GenerateRequest, request: Request):
    """
    Endpoint principal para geração das 3 imagens carimbadas no padrão visual oficial.
    Recebe {image_url, headline, category, link}
    Retorna os caminhos, URLs locais e dados das imagens geradas.
    """
    try:
        base_img = await download_image(req.image_url)
        run_id = uuid.uuid4().hex[:10]

        # 1. Formato 1080x1350 (4:5 Feed Instagram e Facebook)
        img_4_5 = generate_single_format(base_img, 1080, 1350, req.category, req.headline, "4_5")
        filename_4_5 = f"arte_{run_id}_1080x1350.jpg"
        path_4_5 = OUTPUT_DIR / filename_4_5
        img_4_5.save(str(path_4_5), "JPEG", quality=95)

        # 2. Formato 1080x1080 (1:1 Quadrado)
        img_1_1 = generate_single_format(base_img, 1080, 1080, req.category, req.headline, "1_1")
        filename_1_1 = f"arte_{run_id}_1080x1080.jpg"
        path_1_1 = OUTPUT_DIR / filename_1_1
        img_1_1.save(str(path_1_1), "JPEG", quality=95)

        # 3. Formato 1080x1920 (9:16 Stories e Reels)
        img_9_16 = generate_single_format(base_img, 1080, 1920, req.category, req.headline, "9_16")
        filename_9_16 = f"arte_{run_id}_1080x1920.jpg"
        path_9_16 = OUTPUT_DIR / filename_9_16
        img_9_16.save(str(path_9_16), "JPEG", quality=95)

        base_url = str(request.base_url).rstrip("/")

        return {
            "success": True,
            "id": run_id,
            "category": req.category.upper(),
            "headline": req.headline,
            "link": req.link,
            "images": {
                "feed_4_5": {
                    "filename": filename_4_5,
                    "width": 1080,
                    "height": 1350,
                    "ratio": "4:5",
                    "path": str(path_4_5),
                    "url": f"{base_url}/output/{filename_4_5}"
                },
                "feed_1_1": {
                    "filename": filename_1_1,
                    "width": 1080,
                    "height": 1080,
                    "ratio": "1:1",
                    "path": str(path_1_1),
                    "url": f"{base_url}/output/{filename_1_1}"
                },
                "story_9_16": {
                    "filename": filename_9_16,
                    "width": 1080,
                    "height": 1920,
                    "ratio": "9:16",
                    "path": str(path_9_16),
                    "url": f"{base_url}/output/{filename_9_16}"
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao carimbar imagem: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=5000, reload=True)
