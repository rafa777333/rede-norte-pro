# DEPLOY REDE NORTE - HOSTGATOR + VERCEL (Guia para iniciante)

Você tem dominio redeapucarana.com.br na HostGator (print que mandou).

## PASSO 1 - Criar contas (5 min cada)

1. GitHub.com -> Sign up (grátis)
2. Supabase.com -> Start free com Gmail -> New Project -> nome: rede-norte -> senha forte -> Região: South America (São Paulo) -> Create
3. Vercel.com -> Sign up com GitHub -> Continue

## PASSO 2 - Subir código

No seu computador:
- Baixe o zip rede-norte-pro.zip (que eu gerei)
- Descompacte
- Abra terminal (ou prompt) na pasta e rode:
  npm install
  npm run build

Depois crie repositório no GitHub e dê push. Se não souber, me fala que eu te guio.

## PASSO 3 - Banco de Dados

No Supabase:
- Vá em SQL Editor -> New Query -> Copie todo conteúdo de supabase-schema.sql -> Run
- Vá em Settings -> API -> copie URL e anon key -> cole no arquivo .env.local (crie a partir do .env.example)

## PASSO 4 - Colocar no ar na Vercel

- Na Vercel -> Add New Project -> Import do seu GitHub rede-norte-pro
- Em Environment Variables, adicione as 2 chaves do Supabase
- Deploy

Ela vai te dar um link tipo rede-norte-pro.vercel.app funcionando!

## PASSO 5 - Apontar seu dominio redeapucarana.com.br (sua tela da HostGator)

Na Vercel, depois do deploy:
- Settings -> Domains -> Add -> digite redeapucarana.com.br -> Add
- Ela vai mostrar 2 registros DNS.

Agora vá na HostGator onde você tirou o print:
- Clique em "Como criar ou alterar um registro (A, MX, TXT, CNAME e outros) na Zona DNS"
- Vá em Zona DNS de redeapucarana.com.br
- Apague registros A antigos @ se houver e adicione:
  Tipo A | Nome @ | Valor 76.76.21.21
  Tipo CNAME | Nome www | Valor cname.vercel-dns.com

Aguarde 1h a 4h. Seu dominio vai abrir a Rede Norte!

Email: Se quiser email @redeapucarana.com.br, na HostGator clique em "Crie seu novo Plano de E-mail Essentials" (30 dias grátis).
