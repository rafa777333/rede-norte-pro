/** @type {import('next').NextConfig} */
const noCacheHeaders = [
  {
    key: 'Cache-Control',
    value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  },
  {
    key: 'Pragma',
    value: 'no-cache',
  },
  {
    key: 'Expires',
    value: '0',
  },
];

const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'all, index, follow',
          },
        ],
      },
      {
        source: '/',
        headers: noCacheHeaders,
      },
      {
        source: '/tv-online',
        headers: noCacheHeaders,
      },
      {
        source: '/videos',
        headers: noCacheHeaders,
      },
      {
        source: '/videos/:path*',
        headers: noCacheHeaders,
      },
      {
        source: '/admin',
        headers: noCacheHeaders,
      },
      {
        source: '/admin/:path*',
        headers: noCacheHeaders,
      },
      {
        source: '/sw.js',
        headers: noCacheHeaders,
      },
      {
        source: '/manifest.json',
        headers: noCacheHeaders,
      },
      {
        source: '/manifest.webmanifest',
        headers: noCacheHeaders,
      },
      {
        source: '/empregos',
        headers: noCacheHeaders,
      },
      {
        source: '/empregos/:path*',
        headers: noCacheHeaders,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/noticia/:slug*',
        destination: '/noticias/:slug*',
        permanent: true,
      },
      {
        source: '/promocoes',
        destination: '/ofertas',
        permanent: false,
      },
      {
        source: '/servicos',
        destination: '/empregos',
        permanent: false,
      },
      {
        source: '/servicos/:path*',
        destination: '/empregos',
        permanent: false,
      },
      {
        source: '/autonomos',
        destination: '/empregos',
        permanent: false,
      },
      {
        source: '/autonomos/:path*',
        destination: '/empregos',
        permanent: false,
      },
      {
        source: '/compras-e-vendas',
        destination: '/comprasevendas',
        permanent: true,
      },
      {
        source: '/compras',
        destination: '/comprasevendas',
        permanent: true,
      },
      {
        source: '/classificados',
        destination: '/comprasevendas',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
