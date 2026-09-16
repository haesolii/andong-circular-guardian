import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '11mb',
      // Vinext checks multipart API requests before dispatching route handlers.
      // Match the existing field-app CORS trust; never allow wildcard origins.
      allowedOrigins: [
        'deulnyeok-field.roy919491.chatgpt.site',
        ...(process.env.NODE_ENV === 'development' ? ['localhost:3001'] : []),
      ],
    },
  },
};

export default nextConfig;
