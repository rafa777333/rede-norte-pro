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
    print(f"\n[1/3] Acessando OLX e contornando proteções...")
    try:
        resp = requests.get(url_olx, impersonate="chrome120", timeout=20)
        if resp.status_code != 200:
            print(f"❌ Erro ao acessar OLX (Status {resp.status_code})")
            return False
    except Exception as e:
        print(f"❌ Erro de conexão com a OLX: {e}")
        return False

    html = resp.text

    # 1. Parse JSON-LD (Schema.org)
    json_ld_m = re.search(r'<script type="application/ld\+json">([\s\S]*?)</script>', html)
    if not json_ld_m:
        print("❌ Não foi possível ler a estrutura do anúncio na OLX.")
        return False

    try:
        data_ld = json.loads(json_ld_m.group(1))
    except Exception as e:
        print(f"❌ Erro ao ler dados do anúncio: {e}")
        return False

    obj = data_ld.get("Object", {})
    titulo = obj.get("name") or "Anúncio da Região"
    raw_desc = obj.get("description", "")
    clean_desc = re.sub(r'<[^>]+>', ' ', raw_desc).replace('&nbsp;', ' ').strip()
    clean_desc = re.sub(r'\s+', ' ', clean_desc)

    # 2. Imagens em alta resolução
    images = []
    for item in obj.get("image", []):
        if isinstance(item, dict) and "contentUrl" in item:
            images.append(item["contentUrl"])
        elif isinstance(item, str):
            images.append(item)

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

    # 5. Categoria (incluindo Fretes & Carretos)
    categoria = "Outros"
    cat_lower = url_lower + " " + text_lower
    if any(k in cat_lower for k in ["frete", "carreto", "mudanca", "mudança", "transporte", "guincho", "entulho", "caminhaozinho"]):
        categoria = "Fretes & Carretos"
    elif any(k in cat_lower for k in ["imoveis", "apartamento", "casa", "terreno", "sobrado", "aluguel", "venda"]):
        categoria = "Imóveis & Aluguel"
    elif any(k in cat_lower for k in ["autos", "carros", "motos", "veiculo", "caminhao", "honda", "yamaha", "volkswagen", "fiat", "chevrolet"]):
        categoria = "Veículos & Motos"
    elif any(k in cat_lower for k in ["celular", "iphone", "samsung", "motorola", "xiaomi", "notebook", "tv", "videogame", "playstation", "xbox"]):
        categoria = "Celulares & Eletrônicos"
    elif any(k in cat_lower for k in ["moveis", "sofa", "mesa", "armario", "cama", "colchao"]):
        categoria = "Móveis & Casa"
    elif any(k in cat_lower for k in ["trator", "agro", "ferramenta", "gado", "rocadeira"]):
        categoria = "Agro & Ferramentas"

    # 6. WhatsApp do anunciante
    zap_m = re.search(r'(?:whats(?:app)?|contato|fone|tel)[\s:]*([0-9\(\)\s-]{10,16})', clean_desc, re.I)
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

    # 8. Upload das Fotos para Supabase Storage (CDN Permanente da Rede Apucarana)
    print(f"\n[2/3] Processando e hospedando {len(images[:10])} fotos no Supabase...")
    hosted_images = []
    for idx, img_url in enumerate(images[:10]):
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
            print(f"  📸 Foto {idx+1}/{len(images[:10])} salva no Storage do portal")
        except Exception as err:
            print(f"  ⚠️ Foto {idx+1} manteve link original: {err}")
            hosted_images.append(img_url)

    if not hosted_images:
        final_images = "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800"
    elif len(hosted_images) == 1:
        final_images = hosted_images[0]
    else:
        final_images = json.dumps(hosted_images)

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
    print(f"  📸 Fotos:     {len(hosted_images)} fotos salvas")
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
