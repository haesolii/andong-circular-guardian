'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Camera, CheckCircle2, MapPinned, Recycle, Sparkles, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const cards = [
  { number: '01', icon: Camera, title: '사진으로 현장 데이터를 수집', body: '청년 농촌환경관리자가 농가를 순회하며 부산물과 위험요인을 기록합니다.', color: 'bg-[#eaf3ef] text-[#36715d]' },
  { number: '02', icon: MapPinned, title: '위치와 유형을 자동 첨부', body: 'GPS와 AI가 신고 위치와 폐기물 유형을 빠르게 정리합니다.', color: 'bg-[#eaf2f8] text-[#3a7294]' },
  { number: '03', icon: Users, title: '예방 업무를 우선 배정', body: '고위험 농가와 파쇄 요청을 확인해 방문·수거 업무를 연결합니다.', color: 'bg-[#fff3e8] text-[#c66232]' },
  { number: '04', icon: Recycle, title: '성과와 직무경력으로 전환', body: '처리 결과가 탄소감축 지표와 청년의 현장 프로젝트 경력으로 남습니다.', color: 'bg-[#f0f5d8] text-[#506626]' },
];

export function IntroDialog({ open, onOpenChange, onStartReport }: { open: boolean; onOpenChange: (open: boolean) => void; onStartReport: () => void }) {
  const [index, setIndex] = useState(0);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const card = cards[index];
  const Icon = card.icon;
  const finish = () => { onOpenChange(false); setIndex(0); };

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') finish();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/20 p-3 backdrop-blur-xs" onMouseDown={(event) => { if (event.target === event.currentTarget) finish(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="intro-title" aria-describedby="intro-description" className="relative grid max-h-[calc(100dvh-1.5rem)] w-full max-w-xl overflow-y-auto rounded-[26px] bg-popover text-sm text-popover-foreground shadow-2xl ring-1 ring-foreground/10">
        <Button ref={closeButtonRef} type="button" variant="ghost" size="icon-sm" aria-label="안내 닫기" onClick={finish} className="absolute right-3 top-3 z-20 rounded-full bg-black/20 text-white hover:bg-black/35 hover:text-white"><X className="size-4" /></Button>
        <div className="bg-[#173f34] px-6 pb-7 pt-6 text-white sm:px-8">
          <div className="mb-7 flex items-center gap-2 text-sm font-bold text-[#d9f260]"><Sparkles className="size-4" />60초로 보는 안동 순환지킴이</div>
          <div className="flex flex-col gap-2">
            <h2 id="intro-title" className="text-2xl font-extrabold leading-tight tracking-[-0.035em] sm:text-3xl">사진 한 장이<br />마을의 순환을 시작합니다.</h2>
            <p id="intro-description" className="mt-2 text-sm text-white/60">사전 현장관리부터 자원화·성과·직무경력까지 하나로 연결합니다.</p>
          </div>
        </div>
        <div className="p-6 sm:p-8">
          <div className="mb-6 flex items-start gap-4">
            <span className={`grid size-14 shrink-0 place-items-center rounded-2xl ${card.color}`}><Icon className="size-7" /></span>
            <div><span className="text-xs font-extrabold tracking-[.12em] text-[#7b938a]">STEP {card.number}</span><h3 className="mt-1 text-xl font-extrabold tracking-tight text-[#173f34]">{card.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.body}</p></div>
          </div>
          <div className="mb-6 flex gap-2">{cards.map((item, cardIndex) => <button key={item.number} aria-label={`${cardIndex + 1}단계 보기`} onClick={() => setIndex(cardIndex)} className={`h-1.5 rounded-full transition-all ${cardIndex === index ? 'w-10 bg-[#36715d]' : 'w-5 bg-[#dce6e1]'}`} />)}</div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            <Button variant="ghost" className="h-11 rounded-xl" onClick={() => { finish(); onStartReport(); }}><Camera />현장 기록 체험</Button>
            {index < cards.length - 1 ? <Button className="h-11 rounded-xl bg-[#173f34] px-5" onClick={() => setIndex((current) => current + 1)}>다음 단계<ArrowRight /></Button> : <Button className="h-11 rounded-xl bg-[#d9f260] px-5 font-bold text-[#173f34] hover:bg-[#e6fa86]" onClick={finish}><CheckCircle2 />현황판 둘러보기</Button>}
          </div>
        </div>
      </section>
    </div>
  );
}
