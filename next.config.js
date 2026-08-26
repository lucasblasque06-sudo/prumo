/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      "/api/whatsapp": [
        "./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
      ],
    },
  },
};

module.exports = nextConfig;
