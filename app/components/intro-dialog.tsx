'use client';

import { useState } from 'react';
import { ArrowRight, Camera, CheckCircle2, MapPinned, Recycle, Sparkles, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const cards = [
  { number: '01', icon: Camera, title: '사진으로 발견을 기록', body: '환경지킴이가 폐농자재와 농업부산물을 촬영합니다.', color: 'bg-[#eaf3ef] text-[#36715d]' },
  { number: '02', icon: MapPinned, title: '위치와 유형을 자동 첨부', body: 'GPS와 AI가 신고 위치와 폐기물 유형을 빠르게 정리합니다.', color: 'bg-[#eaf2f8] text-[#3a7294]' },
  { number: '03', icon: Users, title: '청년 코디네이터가 배정', body: '신고를 확인해 가까운 환경지킴이에게 수거 업무를 연결합니다.', color: 'bg-[#fff3e8] text-[#c66232]' },
  { number: '04', icon: Recycle, title: '수거에서 자원화까지 추적', body: '처리 결과가 지도와 탄소·일자리 성과에 바로 반영됩니다.', color: 'bg-[#f0f5d8] text-[#506626]' },
];

export function IntroDialog({ open, onOpenChange, onStartReport }: { open: boolean; onOpenChange: (open: boolean) => void; onStartReport: () => void }) {
  const [index, setIndex] = useState(0);
  const card = cards[index];
  const Icon = card.icon;
  const finish = () => { onOpenChange(false); setIndex(0); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton className="overflow-hidden rounded-[26px] p-0 sm:max-w-xl">
        <div className="bg-[#173f34] px-6 pb-7 pt-6 text-white sm:px-8">
          <div className="mb-7 flex items-center gap-2 text-sm font-bold text-[#d9f260]"><Sparkles className="size-4" />60초로 보는 안동 순환지킴이</div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold leading-tight tracking-[-0.035em] sm:text-3xl">사진 한 장이<br />마을의 순환을 시작합니다.</DialogTitle>
            <DialogDescription className="mt-2 text-white/60">신고부터 수거·자원화·성과관리까지 하나로 연결합니다.</DialogDescription>
          </DialogHeader>
        </div>
        <div className="p-6 sm:p-8">
          <div className="mb-6 flex items-start gap-4">
            <span className={`grid size-14 shrink-0 place-items-center rounded-2xl ${card.color}`}><Icon className="size-7" /></span>
            <div><span className="text-xs font-extrabold tracking-[.12em] text-[#7b938a]">STEP {card.number}</span><h3 className="mt-1 text-xl font-extrabold tracking-tight text-[#173f34]">{card.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.body}</p></div>
          </div>
          <div className="mb-6 flex gap-2">{cards.map((item, cardIndex) => <button key={item.number} aria-label={`${cardIndex + 1}단계 보기`} onClick={() => setIndex(cardIndex)} className={`h-1.5 rounded-full transition-all ${cardIndex === index ? 'w-10 bg-[#36715d]' : 'w-5 bg-[#dce6e1]'}`} />)}</div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            <Button variant="ghost" className="h-11 rounded-xl" onClick={() => { finish(); onStartReport(); }}><Camera />직접 신고 체험</Button>
            {index < cards.length - 1 ? <Button className="h-11 rounded-xl bg-[#173f34] px-5" onClick={() => setIndex((current) => current + 1)}>다음 단계<ArrowRight /></Button> : <Button className="h-11 rounded-xl bg-[#d9f260] px-5 font-bold text-[#173f34] hover:bg-[#e6fa86]" onClick={finish}><CheckCircle2 />현황판 둘러보기</Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
