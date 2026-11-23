import sys
import os
import json
import re
import time
import urllib.parse
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

def obter_anuncios_existentes(sb_base, sb_key):
    """Retorna conjunto de IDs já cadastrados no Supabase para evitar duplicidade"""
    existing = set()
    try:
        url = f"{sb_base}/rest/v1/classified_ads?select=id,slug"
        req = urllib.request.Request(url, headers={
            "apikey": sb_key,
            "Authorization": f"Bearer {sb_key}"
        })
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read().decode("utf-8"))
            for item in data:
                slug = item.get("slug") or ""
                m = re.findall(r'\d{6,}', slug)
                for num in m:
                    existing.add(num)
    except Exception as e:
        print(f"⚠️ Aviso ao verificar anúncios existentes: {e}")
    return existing

def buscar_links_radar(termo_ou_url, max_links=50):
    """Varre as páginas de busca da OLX e retorna os links dos anúncios mais recentes"""
    if termo_ou_url.startswith("http"):
        url = termo_ou_url
    else:
        q = urllib.parse.quote_plus(termo_ou_url)
        url = f"https://www.olx.com.br/estado-pr?q={q}"

    try:
        resp = requests.get(url, impersonate="chrome120", timeout=20)
        if resp.status_code != 200:
            print(f"❌ Erro HTTP {resp.status_code} ao vasculhar a OLX")
            return []

        links = list(set(re.findall(r'href="(https://(?:pr\.)?olx\.com\.br/[^"]+-\d+)"', resp.text)))
        # Filtrar links do tipo ajuda, suporte, etc.
        valid_links = [
            l for l in links
            if not any(x in l for x in ['/ajuda', '/seguranca', '/termos', '/central', '/desapega'])
            and any(c in l for c in ['/imoveis', '/autos', '/veiculos', '/servicos', '/para-a-sua-casa', '/eletronicos', '/comercio', '/terrenos'])
        ]
        return valid_links[:max_links]
    except Exception as e:
        print(f"❌ Erro de conexão com a OLX: {e}")
        return []

def extrair_telefone(texto):
    if not texto:
        return ""
    m1 = re.search(r'(?:(?:\+|0)?55\s*)?(?:\(?0?([1-9]{2})\)?\s*)?(?:9\s*[0-9]{4}[-\s.]?[0-9]{4})', texto)
    if m1:
        raw = re.sub(r'\D', '', m1.group(0))
        if raw.startswith('55') and len(raw) in [12, 13]:
            raw = raw[2:]
        if raw.startswith('0') and len(raw) == 12:
            raw = raw[1:]
        if len(raw) == 11 and raw[2] == '9':
            return raw
        if len(raw) == 9 and raw[0] == '9':
            return '43' + raw
        if len(raw) == 10:
            return raw

    m2 = re.search(r'(?:whats(?:app)?|watss|contato|fone|tel|celular)[\s:]*([0-9\(\)\s-]{8,16})', texto, re.I)
    if m2:
        digits = re.sub(r'\D', '', m2.group(1))
        if len(digits) == 11:
            return digits
        if len(digits) == 9:
            return '43' + digits
        if len(digits) == 8:
            return '439' + digits

    return ""

def extrair_dados_anuncio(url_olx):
    """Extrai título, preço, fotos reais, descrição e contato em multicamadas"""
    try:
        resp = requests.get(url_olx, impersonate="chrome120", timeout=25)
        if resp.status_code != 200:
            return None
    except Exception:
        return None

    html = resp.text
    titulo = None
    raw_desc = ""
    images = []

    # Camada 1: JSON-LD
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

    # Camada 2: __NEXT_DATA__
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

    # Rejeita anúncio sem título válido ou sem nenhuma foto real
    if not titulo or titulo == "Anúncio da Região" or not images:
        return None

    clean_desc = re.sub(r'<[^>]+>', ' ', raw_desc).replace('&nbsp;', ' ').strip()
    clean_desc = re.sub(r'\s+', ' ', clean_desc)

    # Preço
    price_m = re.search(r'"price":"?(\d+)"?', html)
    if price_m:
        preco_val = int(price_m.group(1))
        preco = f"R$ {preco_val:,}".replace(",", ".")
    else:
        preco = "A combinar"

    # Cidade
    cidades_slugs = [
        ('apucarana', 'Apucarana'), ('arapongas', 'Arapongas'), ('ivaipora', 'Ivaiporã'),
        ('jandaia-do-sul', 'Jandaia do Sul'), ('faxinal', 'Faxinal'), ('cambira', 'Cambira'),
        ('california', 'Califórnia'), ('marilandia-do-sul', 'Marilândia do Sul'),
        ('maua-da-serra', 'Mauá da Serra'), ('borrazopolis', 'Borrazópolis'),
        ('sao-pedro-do-ivai', 'São Pedro do Ivaí'), ('sao-joao-do-ivai', 'São João do Ivaí')
    ]
    cidade_slug = "apucarana"
    url_lower = url_olx.lower()
    text_lower = (titulo + " " + clean_desc).lower()
    
    for slug, nome in cidades_slugs:
        if slug in url_lower or nome.lower() in text_lower:
            cidade_slug = slug
            break

    # Categoria
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

    # WhatsApp (extração precisa - nunca usa número pessoal como fallback)
    contato = extrair_telefone(clean_desc)

    clean_id = re.sub(r'\D', '', url_olx)[-6:]
    slug = f"{cidade_slug}-{re.sub(r'[^a-z0-9]+', '-', titulo.lower()).strip('-')[:80]}-{clean_id}"

    return {
        "titulo": titulo,
        "slug": slug,
        "cidade_slug": cidade_slug,
        "categoria": categoria,
        "preco": preco,
        "descricao": f"{clean_desc}\n\n📍 Anúncio original capturado da OLX.",
        "images": images[:8],
        "contato": contato,
        "clean_id": clean_id,
        "url_olx": url_olx
    }

def salvar_no_supabase(ad_data, env):
    """Baixa fotos reais, sobe no Storage e salva no banco de dados"""
    sb_base = env.get("NEXT_PUBLIC_SUPABASE_URL", "")
    sb_key = env.get("SUPABASE_SERVICE_ROLE_KEY") or env.get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")

    slug = ad_data["slug"]
    images = ad_data["images"]

    hosted_images = []
    for idx, img_url in enumerate(images):
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
            with urllib.request.urlopen(req_up, timeout=12):
                pass

            pub_url = f"{sb_base}/storage/v1/object/public/rede-norte-media/{storage_rel}"
            hosted_images.append(pub_url)
        except Exception:
            hosted_images.append(img_url)

    final_images = json.dumps(hosted_images) if len(hosted_images) > 1 else (hosted_images[0] if hosted_images else "")

    payload = {
        "titulo": ad_data["titulo"],
        "slug": ad_data["slug"],
        "cidade_slug": ad_data["cidade_slug"],
        "categoria": ad_data["categoria"],
        "preco": ad_data["preco"],
        "descricao": ad_data["descricao"],
        "imagem": final_images,
        "contato": ad_data["contato"],
        "status": "published"
    }

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
            return res[0].get("id")
    except Exception as e:
        print(f"❌ Erro ao salvar no banco: {e}")
        return None

def executar_radar(termo, limite=5):
    env = carregar_env()
    sb_base = env.get("NEXT_PUBLIC_SUPABASE_URL", "")
    sb_key = env.get("SUPABASE_SERVICE_ROLE_KEY") or env.get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")

    print("\n" + "="*65)
    print(f"   📡 RADAR ATIVADO: Buscando anúncios de '{termo}' na OLX")
    print("="*65)

    print("\n[1/3] Consultando anúncios já publicados no portal...")
    existentes = obter_anuncios_existentes(sb_base, sb_key)
    print(f"  ✓ {len(existentes)} identificadores conhecidos no banco de dados.")

    print(f"\n[2/3] Vasculhando a OLX em busca dos mais recentes...")
    links = buscar_links_radar(termo, max_links=50)
    print(f"  ✓ {len(links)} anúncios encontrados na varredura.")

    novos_links = []
    for l in links:
        m = re.findall(r'\d{6,}', l)
        ja_existe = any(num in existentes for num in m)
        if not ja_existe:
            novos_links.append(l)

    print(f"  ✓ {len(novos_links)} anúncios são INÉDITOS e prontos para publicação.")

    if not novos_links:
        print("\n🎉 Nenhum anúncio novo pendente. Todos os anúncios desta busca já estão no portal!")
        return

    links_para_processar = novos_links[:limite]
    print(f"\n[3/3] Processando e publicando os {len(links_para_processar)} primeiros anúncios novos...")
    print("-" * 65)

    publicados = 0
    for idx, link in enumerate(links_para_processar):
        print(f"\n👉 [{idx+1}/{len(links_para_processar)}] Analisando: {link[:70]}...")
        ad_data = extrair_dados_anuncio(link)
        if not ad_data:
            print("  ⚠️ Anúncio ignorado (sem fotos reais ou dados incompletos).")
            continue

        print(f"  📌 {ad_data['titulo'][:50]} | 💰 {ad_data['preco']} | 🏙️ {ad_data['cidade_slug'].capitalize()} | 📂 {ad_data['categoria']}")
        print(f"  📱 WhatsApp do Vendedor: {ad_data['contato'] if ad_data['contato'] else 'Não divulgado (negociação via chat original)'}")
        print(f"  📸 Baixando e salvando {len(ad_data['images'])} fotos reais no Supabase...")
        
        ad_id = salvar_no_supabase(ad_data, env)
        if ad_id:
            print(f"  ✅ PUBLICADO COM SUCESSO! (ID: {ad_id[:8]}...)")
            publicados += 1
            # Marca o ID localmente para não repetir
            if ad_data.get("clean_id"):
                existentes.add(ad_data["clean_id"])
        
        time.sleep(1) # Intervalo educado entre requisições

    print("\n" + "="*65)
    print(f"  🏁 VARREDURA CONCLUÍDA: {publicados} anúncios novos publicados no ar!")
    print(f"  🌐 Veja agora em: https://www.redeapucarana.com.br/comprasevendas")
    print("="*65 + "\n")

def menu_principal():
    while True:
        print("=========================================================")
        print("   📡 RADAR AUTOMÁTICO DE ANÚNCIOS - REDE APUCARANA")
        print("   Vasculha a OLX na Região e publica direto no portal")
        print("=========================================================")
        print("Escolha a varredura que deseja fazer hoje:")
        print("  [1] Apucarana (Anúncios Gerais Mais Recentes)")
        print("  [2] Arapongas (Anúncios Gerais Mais Recentes)")
        print("  [3] Fretes & Carretos (Apucarana e Vale do Ivaí)")
        print("  [4] Veículos & Motos (Região de Apucarana)")
        print("  [5] Imóveis & Aluguel (Região de Apucarana)")
        print("  [6] Jandaia do Sul & Vale do Ivaí")
        print("  [7] Digitar termo personalizado (ex: 'Gol', 'iPhone', 'Titan')")
        print("  [0] Sair")
        print("---------------------------------------------------------")
        opcao = input("Digite a opção desejada [1-7]: ").strip()

        if opcao == "0":
            break

        termo = "apucarana"
        if opcao == "1":
            termo = "apucarana"
        elif opcao == "2":
            termo = "arapongas"
        elif opcao == "3":
            termo = "frete apucarana"
        elif opcao == "4":
            termo = "carros apucarana"
        elif opcao == "5":
            termo = "imoveis apucarana"
        elif opcao == "6":
            termo = "jandaia do sul"
        elif opcao == "7":
            termo = input("\nDigite a cidade ou produto para o Radar buscar: ").strip()
            if not termo:
                continue
        else:
            print("Opção inválida!")
            continue

        qtd_str = input("Quantos anúncios deseja importar agora? (padrão: 5): ").strip()
        limite = int(qtd_str) if qtd_str.isdigit() and int(qtd_str) > 0 else 5

        executar_radar(termo, limite=limite)
        input("Pressione Enter para voltar ao menu...")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        termo = sys.argv[1]
        limite = int(sys.argv[2]) if len(sys.argv) > 2 and sys.argv[2].isdigit() else 5
        executar_radar(termo, limite)
    else:
        menu_principal()
