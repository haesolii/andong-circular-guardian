'use client';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  MapPin,
  Sprout,
  FileText,
  BriefcaseBusiness,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
export function ProductTour({
  field = false,
  openRequest = 0,
}: {
  field?: boolean;
  openRequest?: number;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const storageKey = field
    ? 'deulnyeok-field-tour-v1'
    : 'deulnyeok-workspace-tour-v1';
  useEffect(() => {
    try {
      if (!sessionStorage.getItem(storageKey)) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, [storageKey]);
  useEffect(() => {
    if (openRequest) {
      setStep(0);
      setOpen(true);
    }
  }, [openRequest]);
  const close = () => {
    setOpen(false);
    try {
      sessionStorage.setItem(storageKey, 'seen');
    } catch {}
  };
  const cards = field
    ? [
        {
          icon: MapPin,
          title: '오늘의 확인 업무부터',
          body: '배정된 마을의 예측자료를 확인하고 표본 현장을 방문하세요.',
        },
        {
          icon: Sprout,
          title: '사진과 GPS로 현장을 기록',
          body: '발생상태, 예측과의 차이, 처리현황을 입력하세요. GPS는 위치 권한을 허용하면 기록됩니다.',
        },
        {
          icon: BriefcaseBusiness,
          title: '내 기록이 분석과 경력으로',
          body: '저장한 현장정보는 분석 웹의 지도와 DB에 반영되고, 직접 수행한 업무로 누적됩니다.',
        },
      ]
    : [
        {
          icon: Sprout,
          title: '예측으로 시작하는 현장 업무',
          body: '작물, 재배면적, 발생시기를 확인하고 선택한 마을의 현장검증 업무를 배정하세요.',
        },
        {
          icon: MapPin,
          title: '현장과 예측을 한 지도에서',
          body: '청년이 기록한 GPS·사진·현장정보를 예측자료와 비교하고 환경 DB에 축적합니다.',
        },
        {
          icon: FileText,
          title: '나의 해석을 보고서에 남기기',
          body: '시스템이 정리한 자료에 청년 실무자가 분석과 제안을 작성합니다. 최종 정책판단은 공무원이 합니다.',
        },
      ];
  const item = cards[step];
  const Icon = item.icon;
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) close();
        else setOpen(true);
      }}
    >
      <DialogContent className="tour-dialog">
        <p className="eyebrow">
          들녘 {field ? 'FIELD' : 'WORKSPACE'} · {step + 1} / {cards.length}
        </p>
        <div className="tour-symbol">
          <Icon size={36} strokeWidth={1.5} />
        </div>
        <DialogTitle className="tour-title">{item.title}</DialogTitle>
        <DialogDescription className="tour-description">
          {item.body}
        </DialogDescription>
        <div className="tour-progress">
          {cards.map((_, i) => (
            <i key={i} className={i === step ? 'active' : ''} />
          ))}
        </div>
        <div className="button-row">
          <Button variant="ghost" onClick={close}>
            안내 닫기
          </Button>
          <Button
            className="action-button"
            onClick={() => {
              if (step === cards.length - 1) close();
              else setStep((s) => s + 1);
            }}
          >
            {step === cards.length - 1 ? (
              <>
                <Check />
                업무 시작하기
              </>
            ) : (
              <>
                다음
                <ArrowRight />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
