import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '안동 순환지킴이',
  description: '사진 한 장으로 신고부터 수거·자원화까지 연결하는 안동형 환경관리 플랫폼',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
