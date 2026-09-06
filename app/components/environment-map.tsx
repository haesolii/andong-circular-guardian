'use client';
import { useEffect, useRef, useState } from 'react';
import { Layers, MapPin } from 'lucide-react';
import { NativeSelect } from '@/components/ui/native-select';
import {
  type Village,
  type Verification,
  predictTons,
  quantityLevel,
  villageName,
} from '@/lib/environment-data';
type Position = unknown;
type MapInstance = { setCenter: (p: Position) => void };
type Marker = { setMap: (map: MapInstance | null) => void };
type Maps = {
  load: (cb: () => void) => void;
  Map: new (el: HTMLElement, options: unknown) => MapInstance;
  LatLng: new (lat: number, lng: number) => Position;
  Size: new (w: number, h: number) => unknown;
  Point: new (x: number, y: number) => unknown;
  MarkerImage: new (src: string, size: unknown, opts?: unknown) => unknown;
  Marker: new (options: unknown) => Marker;
};
const sdk = () => (window as unknown as { kakao?: { maps: Maps } }).kakao?.maps;
let loading: Promise<Maps> | undefined;
function loadMap(key: string) {
  if (!loading)
    loading = new Promise<Maps>((resolve, reject) => {
      const ready = () => {
        const maps = sdk();
        if (!maps) {
          reject(new Error('지도 연결 실패'));
          return;
        }
        maps.load(() => resolve(maps));
      };
      if (sdk()) {
        ready();
        return;
      }
      let script = document.querySelector<HTMLScriptElement>(
        'script[data-environment-map]',
      );
      if (!script) {
        script = document.createElement('script');
        script.dataset.environmentMap = 'true';
        script.src =
          'https://dapi.kakao.com/v2/maps/sdk.js?appkey=' +
          encodeURIComponent(key) +
          '&autoload=false';
        script.async = true;
        document.head.appendChild(script);
      }
      script.addEventListener('load', ready, { once: true });
      script.addEventListener(
        'error',
        () => reject(new Error('지도 연결 실패')),
        { once: true },
      );
    });
  return loading;
}
export const mapLayers = [
  '작물 분포',
  '예상 발생량',
  '발생 예상시기',
  '현장검증 결과',
  '처리현황',
];
export function EnvironmentMap({
  inputs,
  records,
  period,
  district = '전체',
}: {
  inputs: Village[];
  records: Verification[];
  period: string;
  district?: string;
}) {
  const [layer, setLayer] = useState('예상 발생량');
  const [selected, setSelected] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapInstance | null>(null);
  const markers = useRef<Marker[]>([]);
  const maps = useRef<Maps | null>(null);
  const isRecords = layer === '현장검증 결과' || layer === '처리현황';
  const selectedVillages = inputs.filter(
    (v) =>
      v.month === Number(period.slice(5)) &&
      (district === '전체' || v.district === district),
  );
  const filtered = records.filter(
    (r) =>
      r.period === period &&
      (district === '전체' ||
        inputs.find((v) => v.id === r.villageId)?.district === district),
  );
  const points = isRecords
    ? filtered.map((r) => ({
        id: r.id,
        lat: r.lat,
        lng: r.lng,
        name: villageName(r.villageId),
        label: layer === '현장검증 결과' ? r.comparison : r.processing,
        level:
          r.comparison === '예상보다 많음'
            ? 2
            : r.comparison === '예상과 유사'
              ? 1
              : 0,
        demo: !!r.demo,
      }))
    : selectedVillages.map((v) => ({
        id: v.id,
        lat: v.lat,
        lng: v.lng,
        name: v.district + ' ' + v.name,
        label:
          layer === '작물 분포'
            ? v.crop
            : layer === '발생 예상시기'
              ? v.timing
              : predictTons(v).toFixed(1) +
                't · ' +
                quantityLevel(predictTons(v)),
        level: predictTons(v) >= 12 ? 2 : predictTons(v) >= 6 ? 1 : 0,
        demo: true,
      }));
  const key = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
  useEffect(() => {
    if (!key) {
      setFailed(true);
      return;
    }
    let active = true;
    const timer = setTimeout(() => {
      if (active && !map.current) setFailed(true);
    }, 10000);
    void loadMap(key)
      .then((k) => {
        if (!active || !container.current) return;
        maps.current = k;
        map.current = new k.Map(container.current, {
          center: new k.LatLng(36.56, 128.73),
          level: 10,
        });
        setReady(true);
        setFailed(false);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
      clearTimeout(timer);
      markers.current.forEach((m) => m.setMap(null));
      map.current = null;
    };
  }, [key]);
  const signature = JSON.stringify(points);
  useEffect(() => {
    const k = maps.current;
    if (!ready || !k || !map.current) return;
    markers.current.forEach((m) => m.setMap(null));
    markers.current = points.map((p) => {
      const fill = ['#c6e0d2', '#62ad89', '#0c8c5e'][p.level];
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="38"><path d="M16 37C14 31 2 23 2 16a14 14 0 1 1 28 0c0 7-12 15-14 21Z" fill="' +
        fill +
        '" stroke="white" stroke-width="2"/><circle cx="16" cy="15" r="4" fill="white"/></svg>';
      return new k.Marker({
        map: map.current,
        position: new k.LatLng(p.lat, p.lng),
        title: p.name + ' · ' + p.label,
        image: new k.MarkerImage(
          'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg),
          new k.Size(32, 38),
          { offset: new k.Point(16, 38) },
        ),
      });
    });
  }, [ready, signature]);
  const focus = (id: string) => {
    setSelected(id);
    const p = points.find((p) => p.id === id);
    if (p && maps.current && map.current)
      map.current.setCenter(new maps.current.LatLng(p.lat, p.lng));
  };
  useEffect(() => setSelected(null), [period, district, layer]);
  return (
    <section className="surface map-surface">
      <div className="section-heading">
        <div>
          <p className="eyebrow">MAP · ENVIRONMENTAL DATA</p>
          <h2>영농부산물 관리 지도</h2>
          <p>마을 단위 예측과 현장 지점의 기록을 겹쳐 살펴보세요.</p>
        </div>
        <NativeSelect
          aria-label="지도 레이어"
          value={layer}
          onChange={(e) => setLayer(e.target.value)}
        >
          {mapLayers.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </NativeSelect>
      </div>
      <div className="map-layout">
        <div className="map-canvas">
          <div
            className="kakao-container"
            ref={container}
            aria-label="카카오 기반 안동 환경지도"
          />
          {!ready && (
            <div className="coordinate-map">
              <div className="coordinate-caption">
                {failed
                  ? '지도 연결을 확인해 주세요 · 아래는 좌표 분포도'
                  : '카카오 지도 불러오는 중'}
                <small>실제 행정경계가 아닌 위경도 배치 · 예시 위치 포함</small>
              </div>
              {points.map((p) => (
                <button
                  key={p.id}
                  title={p.name + ' · ' + p.label}
                  aria-label={p.name + ' ' + p.label}
                  onClick={() => focus(p.id)}
                  className={'coordinate-point level-' + p.level}
                  style={{
                    left:
                      Math.max(
                        7,
                        Math.min(93, ((p.lng - 128.5) / 0.45) * 86 + 7),
                      ) + '%',
                    top:
                      Math.max(
                        22,
                        Math.min(88, ((36.7 - p.lat) / 0.3) * 65 + 22),
                      ) + '%',
                  }}
                >
                  <MapPin size={18} />
                </button>
              ))}
            </div>
          )}
          <div className="map-legend">
            <Layers size={15} />
            {layer === '예상 발생량' ? (
              <>
                <i className="level-0" />
                낮음
                <i className="level-1" />
                보통
                <i className="level-2" />
                높음
              </>
            ) : (
              <span>
                {layer} · {points.length}개 지점
              </span>
            )}
          </div>
        </div>
        <div className="map-points">
          {points.map((p) => (
            <button
              key={p.id}
              className={selected === p.id ? 'active' : ''}
              onClick={() => focus(p.id)}
            >
              <div>
                <MapPin size={16} />
                <strong>{p.name}</strong>
                <small>{p.demo ? '예시' : '직접 입력'}</small>
              </div>
              <p>{p.label}</p>
              {selected === p.id && (
                <span>
                  {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
                </span>
              )}
            </button>
          ))}
          {!points.length && (
            <p className="empty-state">이 기간·지역의 표시 자료가 없습니다.</p>
          )}
        </div>
      </div>
      <p className="data-footnote">
        예시 마을의 위치는 대략적인 배치입니다. 처리현황은 현장 실무자가 확인한
        범위의 기록입니다.
      </p>
    </section>
  );
}
