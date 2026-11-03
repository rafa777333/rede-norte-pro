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
# 1. Logo Badge Oficial completa (Modelo 1 - Topo Direito intacta)
LOGO_TOP_BADGE_PATH = str(LOGO_DIR / "logo_ra_badge_official.png")
# 2. Fallback / Logo clássico
LOGO_PATH = str(LOGO_DIR / "logo_ra_clean.png")

app = FastAPI(
    title="Rede Apucarana - Carimbo Oficial Microservice",
    description="Microserviço local e gratuito para carimbar artes de notícias nas proporções 1080x1350, 1080x1080 e 1080x1920.",
    version="1.1.0"
)

# Servir imagens geradas estaticamente
app.mount("/output", StaticFiles(directory=str(OUTPUT_DIR)), name="output")


class GenerateRequest(BaseModel):
    image_url: str = Field(..., description="URL pública da fotografia original da matéria")
    headline: str = Field(..., description="Manchete / Título da notícia")
    category: str = Field(default="NOTÍCIA", description="Categoria da matéria (ex: POLÍTICA, POLICIAL, ESPORTES)")
    link: Optional[str] = Field(default="", description="Link da matéria no portal")
    layout: Optional[str] = Field(default="modelo_1", description="Layout da arte: 'modelo_1' (logo no topo direito, tag centralizada, manchete centralizada, barra do site) ou 'bottom_logo'")


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
    format_type: str = "4_5",
    layout: str = "modelo_1"
) -> Image.Image:
    """
    Gera o layout da arte carimbada.
    Modelo 1 (Referência oficial Instagram):
      - Logo Oficial RA intacta no canto superior direito (com respiro e cantos arredondados)
      - Degradê preto inferior suave
      - Tag de categoria vermelha #FF0000 centralizada
      - Manchete em Montserrat ExtraBold branca centralizada em caixa alta (máx 3 linhas)
      - Barra inferior em azul marinho com 'www.redeapucarana.com.br'
    """
    canvas = aspect_fill_crop(base_image, target_w, target_h)

    # 1. Tarja preta com degradê suave embaixo
    gradient = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    start_ratio = 0.44 if format_type == "4_5" else 0.46 if format_type == "1_1" else 0.52
    start_y = int(target_h * start_ratio)

    for y in range(start_y, target_h):
        progress = (y - start_y) / (target_h - start_y)
        alpha = int(255 * (progress ** 1.5))
        for x in range(target_w):
            gradient.putpixel((x, y), (0, 0, 0, min(255, alpha)))

    canvas = Image.alpha_composite(canvas.convert("RGBA"), gradient)
    draw = ImageDraw.Draw(canvas)

    # 2. Barra inferior do site (Modelo 1)
    bar_h = 72 if format_type == "4_5" else 62 if format_type == "1_1" else 85
    bar_y = target_h - bar_h

    if layout == "modelo_1":
        draw.rectangle([0, bar_y, target_w, target_h], fill="#020726")
        site_font_size = 22 if format_type != "1_1" else 19
        site_font = get_font(FONT_BOLD, site_font_size)
        site_text = "www.redeapucarana.com.br"
        bbox_site = draw.textbbox((0, 0), site_text, font=site_font)
        site_w = bbox_site[2] - bbox_site[0]
        site_h = bbox_site[3] - bbox_site[1]
        site_x = (target_w - site_w) // 2
        site_y = bar_y + (bar_h - site_h) // 2 - 2
        draw.text((site_x, site_y), site_text, fill="#E2E8F0", font=site_font)

    # 3. Logo Oficial RA
    if layout == "modelo_1":
        # MODELO 1: Logo no Canto Superior Direito (intacta, nunca cortada pelo Instagram)
        badge_path = LOGO_TOP_BADGE_PATH if os.path.exists(LOGO_TOP_BADGE_PATH) else LOGO_PATH
        if os.path.exists(badge_path):
            badge_img = Image.open(badge_path).convert("RGBA")
            bw = 200 if format_type == "4_5" else 180 if format_type == "1_1" else 210
            bh = int(bw * (badge_img.height / badge_img.width))
            badge_resized = badge_img.resize((bw, bh), Image.Resampling.LANCZOS)

            # Margens superiores e laterais seguras
            margin_right = 45 if format_type != "1_1" else 38
            margin_top = 45 if format_type != "9_16" else 135  # No stories, abaixo do header do Instagram

            bx = target_w - margin_right - bw
            by = margin_top
            canvas.paste(badge_resized, (bx, by), badge_resized)
    else:
        # Layout legado: Logo no canto inferior direito
        logo_w, logo_h = 160, 134
        logo_margin_right = 65
        logo_margin_bottom = 65 if format_type != "9_16" else 140
        logo_x = target_w - logo_margin_right - logo_w
        logo_y = target_h - logo_margin_bottom - logo_h
        if os.path.exists(LOGO_PATH):
            logo_img = Image.open(LOGO_PATH).convert("RGBA").resize((logo_w, logo_h), Image.Resampling.LANCZOS)
            canvas.paste(logo_img, (logo_x, logo_y), logo_img)

    # 4. Quebra de linha da manchete garantindo no máximo 3 linhas
    max_text_width = target_w - 140  # 70px de margem em cada lado
    font_size = 56 if format_type == "4_5" else 50 if format_type == "1_1" else 58

    # No Modelo 1, a manchete é em caixa alta para máximo impacto visual
    headline_clean = headline.strip().upper() if layout == "modelo_1" else headline.strip()

    headline_font = get_font(FONT_EXTRABOLD, font_size)
    lines = wrap_text_to_lines(headline_clean, headline_font, max_text_width, draw)

    while len(lines) > 3 and font_size >= 36:
        font_size -= 3
        headline_font = get_font(FONT_EXTRABOLD, font_size)
        lines = wrap_text_to_lines(headline_clean, headline_font, max_text_width, draw)

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

    # 5. Tag de Categoria Vermelha #FF0000
    cat_font_size = 32 if format_type != "1_1" else 28
    cat_font = get_font(FONT_EXTRABOLD, cat_font_size)
    cat_text = category.strip().upper()
    cat_bb = draw.textbbox((0, 0), cat_text, font=cat_font)
    cat_tw = cat_bb[2] - cat_bb[0]
    cat_th = cat_bb[3] - cat_bb[1]

    pad_x = 26
    pad_y = 10
    tag_w = cat_tw + (pad_x * 2)
    tag_h = cat_th + (pad_y * 2)

    # Posicionamento vertical
    bottom_boundary = bar_y if layout == "modelo_1" else (target_h - 65 if format_type != "9_16" else target_h - 140)
    headline_y = bottom_boundary - total_headline_h - 38
    tag_y = headline_y - tag_h - 26

    # Posicionamento horizontal (Centralizado no Modelo 1)
    if layout == "modelo_1":
        tag_x = (target_w - tag_w) // 2
    else:
        tag_x = 70

    # Desenhar Tag Vermelha arredondada
    draw.rounded_rectangle([tag_x, tag_y, tag_x + tag_w, tag_y + tag_h], radius=12, fill="#FF0000")
    draw.text((tag_x + pad_x, tag_y + pad_y - 2), cat_text, fill="#FFFFFF", font=cat_font)

    # Desenhar Manchete em Branco Montserrat-ExtraBold (Centralizada no Modelo 1)
    cur_y = headline_y
    for i, line in enumerate(lines):
        bb = draw.textbbox((0, 0), line, font=headline_font)
        lw = bb[2] - bb[0]
        if layout == "modelo_1":
            lx = (target_w - lw) // 2
        else:
            lx = 70
        draw.text((lx, cur_y), line, fill="#FFFFFF", font=headline_font)
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
        "version": "1.1.0",
        "default_layout": "modelo_1",
        "endpoints": {
            "POST /generate": "Gera as 3 artes carimbadas (1080x1350, 1080x1080, 1080x1920)"
        }
    }


@app.post("/generate")
async def generate_images(req: GenerateRequest, request: Request):
    """
    Endpoint principal para geração das 3 imagens carimbadas no padrão visual oficial.
    Recebe {image_url, headline, category, link, layout}
    Retorna os caminhos, URLs locais e dados das imagens geradas.
    """
    try:
        base_img = await download_image(req.image_url)
        run_id = uuid.uuid4().hex[:10]
        layout = req.layout or "modelo_1"

        # 1. Formato 1080x1350 (4:5 Feed Instagram e Facebook)
        img_4_5 = generate_single_format(base_img, 1080, 1350, req.category, req.headline, "4_5", layout=layout)
        filename_4_5 = f"arte_{run_id}_1080x1350.jpg"
        path_4_5 = OUTPUT_DIR / filename_4_5
        img_4_5.save(str(path_4_5), "JPEG", quality=95)

        # 2. Formato 1080x1080 (1:1 Quadrado)
        img_1_1 = generate_single_format(base_img, 1080, 1080, req.category, req.headline, "1_1", layout=layout)
        filename_1_1 = f"arte_{run_id}_1080x1080.jpg"
        path_1_1 = OUTPUT_DIR / filename_1_1
        img_1_1.save(str(path_1_1), "JPEG", quality=95)

        # 3. Formato 1080x1920 (9:16 Stories e Reels)
        img_9_16 = generate_single_format(base_img, 1080, 1920, req.category, req.headline, "9_16", layout=layout)
        filename_9_16 = f"arte_{run_id}_1080x1920.jpg"
        path_9_16 = OUTPUT_DIR / filename_9_16
        img_9_16.save(str(path_9_16), "JPEG", quality=95)

        base_url = str(request.base_url).rstrip("/")

        return {
            "success": True,
            "id": run_id,
            "layout": layout,
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
