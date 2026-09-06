import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '들녘 — 농촌환경 데이터 워크스페이스',
  description: '영농부산물 발생 예측, 청년 현장검증, 환경지도와 분석보고서를 연결하는 안동형 현장 업무 플랫폼',
  applicationName: '들녘',
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
