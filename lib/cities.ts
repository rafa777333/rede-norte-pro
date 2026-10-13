export type City = { slug: string; nome: string; ibge?: string };
export const CITIES: City[] = [
  { slug: 'apucarana', nome: 'Apucarana' },
  { slug: 'arapongas', nome: 'Arapongas' },
  { slug: 'ivaipora', nome: 'Ivaiporã' },
  { slug: 'jandaia-do-sul', nome: 'Jandaia do Sul' },
  { slug: 'cambira', nome: 'Cambira' },
  { slug: 'faxinal', nome: 'Faxinal' },
  { slug: 'sao-joao-do-ivai', nome: 'São João do Ivaí' },
  { slug: 'jardim-alegre', nome: 'Jardim Alegre' },
];
export const CITY_MAP = Object.fromEntries(CITIES.map(c=>[c.slug,c]));
