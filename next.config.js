/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/noticia/:slug*',
        destination: '/noticias/:slug*',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
