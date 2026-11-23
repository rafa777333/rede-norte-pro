import sys
import os
import json
import re
import urllib.request
from curl_cffi import requests

def carregar_env():
    env_path = r"C:\Users\Radio TV Apucarana\Documents\rede-norte-pro\.env.local"
    env = {}
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    k, v = line.split("=", 1)
                    env[k.strip()] = v.strip().strip('"').strip("'")
    return env

def extrair_e_publicar(url_olx):
    url_olx = url_olx.strip()
    if not url_olx.startswith("http"):
        print("❌ Por favor, informe um link válido iniciando com http:// ou https://")
        return False

    print(f"\n[1/3] Acessando anúncio na OLX e contornando proteções...")
    try:
        resp = requests.get(url_olx, impersonate="chrome120", timeout=25)
        if resp.status_code != 200:
            print(f"❌ Erro ao acessar OLX (Status HTTP {resp.status_code}). O anúncio pode ter expirado ou sido removido.")
            return False
    except Exception as e:
        print(f"❌ Erro de conexão com a OLX: {e}")
        return False

    html = resp.text

    titulo = None
    raw_desc = ""
    images = []

    # Camada 1: JSON-LD (Schema.org) - lê todos os blocos
    json_ld_matches = re.findall(r'<script type="application/ld\+json">([\s\S]*?)</script>', html)
    for jm in json_ld_matches:
        try:
            d = json.loads(jm)
            items = d if isinstance(d, list) else [d]
            for it in items:
                o = it.get("Object") if isinstance(it.get("Object"), dict) else it
                if not titulo and o.get("name"):
                    titulo = str(o.get("name")).strip()
                if not raw_desc and o.get("description"):
                    raw_desc = str(o.get("description")).strip()
                imgs = o.get("image", [])
                if isinstance(imgs, list):
                    for img in imgs:
                        u = img.get("contentUrl") if isinstance(img, dict) else img
                        if u and isinstance(u, str) and u.startswith("http") and u not in images:
                            images.append(u)
                elif isinstance(imgs, str) and imgs.startswith("http") and imgs not in images:
                    images.append(imgs)
        except Exception:
            pass

    # Camada 2: __NEXT_DATA__ (dados internos da OLX)
    nd_m = re.search(r'<script id="__NEXT_DATA__" type="application/json">([\s\S]*?)</script>', html)
    if nd_m:
        try:
            nd = json.loads(nd_m.group(1))
            ad_data = nd.get("props", {}).get("pageProps", {}).get("ad", {})
            if not titulo and ad_data.get("subject"):
                titulo = str(ad_data.get("subject")).strip()
            if not raw_desc and ad_data.get("description"):
                raw_desc = str(ad_data.get("description")).strip()
            for img in ad_data.get("images", []):
                u = img.get("original") or img.get("url")
                if u and u.startswith("http") and u not in images:
                    images.append(u)
        except Exception:
            pass

    # Camada 3: Fallbacks HTML
    if not titulo:
        og_t = re.search(r'<meta property="og:title" content="([^"]+)"', html)
        if og_t:
            titulo = og_t.group(1).split(" - ")[0].strip()
        else:
            t_tag = re.search(r'<title>([^<]+)</title>', html)
            if t_tag:
                titulo = t_tag.group(1).split(" - ")[0].strip()

    if not images:
        html_imgs = list(dict.fromkeys(re.findall(r'https://img\.olx\.com\.br/images/\d+/\d+\.jpg', html)))
        images.extend(html_imgs)

    # Validação rigorosa: Nunca publica anúncio fantasma
    if not titulo or titulo == "Anúncio da Região":
        print("❌ Não foi possível extrair o título real do anúncio.")
        print("   Verifique se o link está correto e se o anúncio ainda está no ar na OLX.")
        return False

    if not images:
        print("❌ Nenhuma foto real encontrada neste anúncio.")
        print("   Para manter o portal com alta qualidade, anúncios sem foto não são publicados.")
        return False

    clean_desc = re.sub(r'<[^>]+>', ' ', raw_desc).replace('&nbsp;', ' ').strip()
    clean_desc = re.sub(r'\s+', ' ', clean_desc)

    # 3. Preço
    price_m = re.search(r'"price":"?(\d+)"?', html)
    if price_m:
        preco_val = int(price_m.group(1))
        preco = f"R$ {preco_val:,}".replace(",", ".")
    else:
        preco = "A combinar"

    # 4. Cidade
    cidades_slugs = [
        ('apucarana', 'Apucarana'), ('arapongas', 'Arapongas'), ('ivaipora', 'Ivaiporã'),
        ('jandaia-do-sul', 'Jandaia do Sul'), ('faxinal', 'Faxinal'), ('cambira', 'Cambira'),
        ('california', 'Califórnia'), ('marilandia-do-sul', 'Marilândia do Sul'),
        ('maua-da-serra', 'Mauá da Serra'), ('borrazopolis', 'Borrazópolis'),
        ('sao-pedro-do-ivai', 'São Pedro do Ivaí'), ('sao-joao-do-ivai', 'São João do Ivaí')
    ]
    cidade_slug = "apucarana" # padrão
    url_lower = url_olx.lower()
    text_lower = (titulo + " " + clean_desc).lower()
    
    for slug, nome in cidades_slugs:
        if slug in url_lower or nome.lower() in text_lower:
            cidade_slug = slug
            break

    # 5. Categoria
    categoria = "Outros"
    cat_lower = url_lower + " " + text_lower
    if any(k in cat_lower for k in ["frete", "carreto", "mudanca", "mudança", "transporte", "guincho", "entulho", "caminhaozinho"]):
        categoria = "Fretes & Carretos"
    elif any(k in cat_lower for k in ["imoveis", "apartamento", "casa", "terreno", "sobrado", "aluguel", "venda", "chacara", "sitio", "barracao"]):
        categoria = "Imóveis & Aluguel"
    elif any(k in cat_lower for k in ["autos", "carros", "motos", "veiculo", "caminhao", "honda", "yamaha", "volkswagen", "fiat", "chevrolet", "ford"]):
        categoria = "Veículos & Motos"
    elif any(k in cat_lower for k in ["celular", "iphone", "samsung", "motorola", "xiaomi", "notebook", "tv", "videogame", "playstation", "xbox"]):
        categoria = "Celulares & Eletrônicos"
    elif any(k in cat_lower for k in ["moveis", "sofa", "mesa", "armario", "cama", "colchao", "guarda-roupa"]):
        categoria = "Móveis & Casa"
    elif any(k in cat_lower for k in ["trator", "agro", "ferramenta", "gado", "rocadeira"]):
        categoria = "Agro & Ferramentas"

    # 6. WhatsApp do anunciante
    zap_m = re.search(r'(?:whats(?:app)?|watss|contato|fone|tel)[\s:]*([0-9\(\)\s-]{10,16})', clean_desc, re.I)
    if zap_m:
        contato = re.sub(r'\D', '', zap_m.group(1))
    else:
        contato = "43999809454" # Contato padrão Rede Apucarana

    # 7. Slug único
    clean_id = re.sub(r'\D', '', url_olx)[-6:]
    slug = f"{cidade_slug}-{re.sub(r'[^a-z0-9]+', '-', titulo.lower()).strip('-')[:80]}-{clean_id}"

    # Carregar credenciais Supabase
    env = carregar_env()
    sb_base = env.get("NEXT_PUBLIC_SUPABASE_URL", "")
    sb_key = env.get("SUPABASE_SERVICE_ROLE_KEY") or env.get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")

    # 8. Upload das Fotos Reais para Supabase Storage (CDN Permanente da Rede Apucarana)
    fotos_para_salvar = images[:10]
    print(f"\n[2/3] Baixando e salvando {len(fotos_para_salvar)} fotos reais no servidor permanente...")
    hosted_images = []
    for idx, img_url in enumerate(fotos_para_salvar):
        try:
            req_dl = urllib.request.Request(img_url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
            with urllib.request.urlopen(req_dl, timeout=12) as r_dl:
                img_data = r_dl.read()

            storage_rel = f"classifieds/{slug}/foto_{idx+1}.jpg"
            upload_url = f"{sb_base}/storage/v1/object/rede-norte-media/{storage_rel}"

            req_up = urllib.request.Request(
                upload_url,
                data=img_data,
                headers={
                    "apikey": sb_key,
                    "Authorization": f"Bearer {sb_key}",
                    "Content-Type": "image/jpeg",
                    "x-upsert": "true"
                },
                method="POST"
            )
            with urllib.request.urlopen(req_up, timeout=12) as r_up:
                pass

            pub_url = f"{sb_base}/storage/v1/object/public/rede-norte-media/{storage_rel}"
            hosted_images.append(pub_url)
            print(f"  📸 Foto {idx+1}/{len(fotos_para_salvar)} salva com sucesso")
        except Exception as err:
            print(f"  ⚠️ Foto {idx+1} manteve URL original: {err}")
            hosted_images.append(img_url)

    final_images = json.dumps(hosted_images) if len(hosted_images) > 1 else hosted_images[0]

    payload = {
        "titulo": titulo,
        "slug": slug,
        "cidade_slug": cidade_slug,
        "categoria": categoria,
        "preco": preco,
        "descricao": f"{clean_desc}\n\n📍 Anúncio original capturado da OLX.",
        "imagem": final_images,
        "contato": contato,
        "status": "published"
    }

    print("\n[3/3] Publicando direto no site Rede Apucarana...")
    print(f"  📌 Título:    {payload['titulo']}")
    print(f"  💰 Preço:     {payload['preco']}")
    print(f"  🏙️ Cidade:    {payload['cidade_slug'].capitalize()}")
    print(f"  📂 Categoria: {payload['categoria']}")
    print(f"  📸 Fotos:     {len(hosted_images)} fotos reais salvas")
    print(f"  📱 WhatsApp:  {payload['contato']}")

    sb_url = f"{sb_base}/rest/v1/classified_ads"
    headers = {
        "apikey": sb_key,
        "Authorization": f"Bearer {sb_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

    req = urllib.request.Request(sb_url, data=json.dumps(payload).encode("utf-8"), headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            res = json.loads(r.read().decode("utf-8"))
            print("\n========================================================")
            print("  🎉 SUCESSO! ANÚNCIO PUBLICADO NO PORTAL REDE APUCARANA!")
            print(f"  ID no Banco: {res[0].get('id')}")
            print("========================================================\n")
            return True
    except Exception as e:
        print("❌ Erro ao enviar para o banco de dados:", e)
        return False

if __name__ == "__main__":
    print("========================================================")
    print("   EXTRATOR INSTANTÂNEO DE ANÚNCIOS - REDE APUCARANA")
    print("========================================================")
    if len(sys.argv) > 1:
        url = sys.argv[1].strip()
        extrair_e_publicar(url)
    else:
        while True:
            url = input("\nCole o link do anúncio da OLX (ou digite 'sair'): ").strip()
            if not url or url.lower() == 'sair':
                break
            extrair_e_publicar(url)
