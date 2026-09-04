'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

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
        Marker: new (options: unknown) => { setMap: (map: unknown) => void };
        MarkerClusterer: new (options: unknown) => unknown;
      };
    };
  }
}

const fallbackMarkers = [
  { x: 28, y: 33, count: 12, level: 'high' },
  { x: 58, y: 25, count: 7, level: 'mid' },
  { x: 72, y: 56, count: 9, level: 'high' },
  { x: 42, y: 67, count: 4, level: 'low' },
  { x: 19, y: 72, count: 6, level: 'mid' },
];

export function KakaoMap({ reports }: { reports: MapReport[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

  useEffect(() => {
    if (!appKey || !mapRef.current) return;
    const initialize = () => {
      if (!window.kakao || !mapRef.current) return;
      window.kakao.maps.load(() => {
        if (!window.kakao || !mapRef.current) return;
        const center = new window.kakao.maps.LatLng(36.5684, 128.7294);
        const map = new window.kakao.maps.Map(mapRef.current, { center, level: 9 });
        const markers = reports.map((report) => new window.kakao!.maps.Marker({
          position: new window.kakao!.maps.LatLng(report.lat, report.lng),
          title: `${report.place} · ${report.category}`,
        }));
        new window.kakao.maps.MarkerClusterer({ map, averageCenter: true, minLevel: 7, markers });
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
          {fallbackMarkers.map((marker) => (
            <button key={`${marker.x}-${marker.y}`} aria-label={`신고 ${marker.count}건`} className={`absolute grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-white text-xs font-extrabold text-white shadow-[0_8px_20px_rgba(23,63,52,.24)] transition hover:scale-110 ${marker.level === 'high' ? 'bg-[#e7723c]' : marker.level === 'mid' ? 'bg-[#d5a53b]' : 'bg-[#36715d]'}`} style={{ left: `${marker.x}%`, top: `${marker.y}%` }}>{marker.count}</button>
          ))}
          <div className="absolute right-4 top-4 flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-xs font-bold text-[#41675b] shadow-sm backdrop-blur"><MapPin className="size-4 text-[#e7723c]" />카카오맵 키 입력 전 예비 모드</div>
        </div>
      )}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-3 rounded-xl border border-white/70 bg-white/90 px-3 py-2 text-xs font-semibold text-[#47665c] shadow-sm backdrop-blur"><span className="flex items-center gap-1"><i className="size-2 rounded-full bg-[#36715d]" />낮음</span><span className="flex items-center gap-1"><i className="size-2 rounded-full bg-[#d5a53b]" />주의</span><span className="flex items-center gap-1"><i className="size-2 rounded-full bg-[#e7723c]" />집중</span></div>
    </div>
  );
}
