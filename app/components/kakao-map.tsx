'use client';

import { useEffect, useRef, useState } from 'react';
import { Flame, Leaf, MapPin, Recycle } from 'lucide-react';

export type MapReport = {
  id: number;
  lat: number;
  lng: number;
  category: string;
  place: string;
};

declare global {
  interface Window {
    kakao?: {
      maps: {
        load: (callback: () => void) => void;
        Map: new (container: HTMLElement, options: unknown) => { setCenter: (position: unknown) => void };
        LatLng: new (lat: number, lng: number) => unknown;
        Size: new (width: number, height: number) => unknown;
        Point: new (x: number, y: number) => unknown;
        MarkerImage: new (src: string, size: unknown, options?: unknown) => unknown;
        Marker: new (options: unknown) => { setMap: (map: unknown) => void };
        MarkerClusterer: new (options: unknown) => unknown;
      };
    };
  }
}

const reportKind = (category: string) => {
  if (category === '불법소각') return 'burning';
  if (['과수 전정가지', '볏짚', '고춧대', '기타 농업부산물'].includes(category)) return 'byproduct';
  return 'material';
};

const markerAsset = {
  material: '/markers/farm-material.svg',
  byproduct: '/markers/agri-byproduct.svg',
  burning: '/markers/illegal-burning.svg',
};

export function KakaoMap({ reports }: { reports: MapReport[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

  useEffect(() => {
    if (!appKey || !mapRef.current) return;
    const initialize = () => {
      if (!window.kakao || !mapRef.current) return;
      window.kakao.maps.load(() => {
        if (!window.kakao || !mapRef.current) return;
        const center = new window.kakao.maps.LatLng(36.5684, 128.7294);
        const map = new window.kakao.maps.Map(mapRef.current, { center, level: 9 });
        const markerImages = Object.fromEntries(Object.entries(markerAsset).map(([kind, src]) => [
          kind,
          new window.kakao!.maps.MarkerImage(src, new window.kakao!.maps.Size(36, 42), { offset: new window.kakao!.maps.Point(18, 42) }),
        ]));
        const markers = reports.map((report) => new window.kakao!.maps.Marker({
          position: new window.kakao!.maps.LatLng(report.lat, report.lng),
          title: `${report.place} · ${report.category}`,
          image: markerImages[reportKind(report.category)],
        }));
        new window.kakao.maps.MarkerClusterer({ map, averageCenter: true, minLevel: 11, markers });
        setReady(true);
      });
    };

    const existing = document.querySelector<HTMLScriptElement>('script[data-kakao-map]');
    if (existing) {
      if (window.kakao) initialize();
      else existing.addEventListener('load', initialize, { once: true });
      return;
    }
    const script = document.createElement('script');
    script.dataset.kakaoMap = 'true';
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=clusterer`;
    script.async = true;
    script.addEventListener('load', initialize, { once: true });
    script.addEventListener('error', () => setLoadFailed(true), { once: true });
    document.head.appendChild(script);
  }, [appKey, reports]);

  return (
    <div className="relative min-h-[410px] overflow-hidden bg-[#dce9e0] sm:min-h-[465px]">
      <div ref={mapRef} className={`absolute inset-0 transition-opacity ${ready ? 'opacity-100' : 'pointer-events-none opacity-0'}`} aria-label="안동시 환경 신고 지도" />
      {!ready && (
        <div className="absolute inset-0" aria-label="카카오맵 연결 전 시연용 안동 지도">
          <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(23,63,52,.10)_1px,transparent_1px),linear-gradient(90deg,rgba(23,63,52,.10)_1px,transparent_1px)] [background-size:48px_48px]" />
          <div className="absolute -left-[8%] top-[9%] h-[52%] w-[65%] rotate-[-8deg] rounded-[48%_52%_42%_58%] border-[18px] border-[#c7dcca] bg-[#edf5ee] shadow-inner" />
          <div className="absolute bottom-[-11%] right-[-9%] h-[70%] w-[72%] rotate-[10deg] rounded-[55%_45%_60%_40%] border-[16px] border-[#cee0d1] bg-[#e7f0e7]" />
          <div className="absolute left-[6%] top-[51%] h-[5px] w-[88%] rotate-[-13deg] rounded-full bg-[#a8c9c5]/70" />
          <div className="absolute left-[40%] top-[8%] h-[88%] w-[5px] rotate-[29deg] rounded-full bg-[#a8c9c5]/60" />
          <span className="absolute left-[23%] top-[21%] text-xs font-bold text-[#55766b]">풍산읍</span>
          <span className="absolute left-[55%] top-[16%] text-xs font-bold text-[#55766b]">와룡면</span>
          <span className="absolute right-[16%] top-[49%] text-xs font-bold text-[#55766b]">임하면</span>
          <span className="absolute bottom-[20%] left-[38%] text-xs font-bold text-[#55766b]">길안면</span>
          {reports.slice(0, 15).map((report) => {
            const kind = reportKind(report.category);
            const x = Math.min(90, Math.max(10, 10 + ((report.lng - 128.48) / 0.47) * 80));
            const y = Math.min(90, Math.max(10, 10 + ((36.78 - report.lat) / 0.36) * 80));
            const Icon = kind === 'burning' ? Flame : kind === 'byproduct' ? Leaf : Recycle;
            return <button key={report.id} aria-label={`${report.place} ${report.category}`} title={`${report.place} · ${report.category}`} className={`absolute grid size-9 -translate-x-1/2 -translate-y-full place-items-center rounded-full rounded-bl-md border-2 border-white text-white shadow-[0_7px_16px_rgba(23,63,52,.24)] transition hover:z-10 hover:scale-110 ${kind === 'burning' ? 'bg-[#e25d36]' : kind === 'byproduct' ? 'bg-[#88a832]' : 'bg-[#247b72]'}`} style={{ left: `${x}%`, top: `${y}%` }}><Icon className="size-[17px]" /></button>;
          })}
          <div className="absolute right-4 top-4 flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-xs font-bold text-[#41675b] shadow-sm backdrop-blur"><MapPin className="size-4 text-[#e7723c]" />{appKey ? loadFailed ? '카카오맵 연결을 확인해 주세요' : '카카오맵 불러오는 중' : '카카오맵 키 입력 전 예비 모드'}</div>
        </div>
      )}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-3 rounded-xl border border-white/70 bg-white/90 px-3 py-2 text-xs font-semibold text-[#47665c] shadow-sm backdrop-blur"><span className="flex items-center gap-1"><Recycle className="size-3.5 text-[#247b72]" />폐농자재</span><span className="flex items-center gap-1"><Leaf className="size-3.5 text-[#88a832]" />농업부산물</span><span className="flex items-center gap-1"><Flame className="size-3.5 text-[#e25d36]" />불법소각</span></div>
    </div>
  );
}
