/** @type {import('next').NextConfig} */
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
