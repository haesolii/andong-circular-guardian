import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '안동 순환지킴이',
  description: '청년의 농촌환경관리 현장 업무와 데이터 경력을 연결하는 안동형 플랫폼',
  applicationName: '안동 순환지킴이',
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
