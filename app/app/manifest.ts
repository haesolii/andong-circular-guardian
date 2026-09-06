import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '안동 순환지킴이',
    short_name: '순환지킴이',
    description: '청년 농촌환경관리 현장 업무 플랫폼',
    start_url: '/',
    display: 'standalone',
    background_color: '#f5f8f6',
    theme_color: '#123c31',
    lang: 'ko',
    icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
