'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import { Camera, Check, Crosshair, ImagePlus, LoaderCircle, MapPin, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { Progress, ProgressLabel, ProgressValue } from '@/components/ui/progress';

export type NewReport = {
  category: string;
  description: string;
  lat: number;
  lng: number;
  place: string;
  image?: string;
};

const categories = ['폐비닐', '폐농약 용기', '폐농자재', '과수 전정가지', '볏짚', '고춧대', '불법소각', '불법투기', '기타 농업부산물'];

export function ReportDialog({ open, onOpenChange, onSubmit }: { open: boolean; onOpenChange: (open: boolean) => void; onSubmit: (report: NewReport) => void }) {
  const [image, setImage] = useState<string>();
  const [category, setCategory] = useState('폐비닐');
  const [description, setDescription] = useState('');
  const [position, setPosition] = useState<{ lat: number; lng: number; place: string }>();
  const [locationState, setLocationState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<{ category: string; confidence: number; reason: string }>();
  const [analysisError, setAnalysisError] = useState('');

  useEffect(() => {
    if (!open) return;
    setPosition(undefined);
    setLocationState('idle');
  }, [open]);

  const chooseImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setAnalysis(undefined);
      setAnalysisError('10MB 이하의 사진을 선택해 주세요.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const nextImage = String(reader.result);
      setImage(nextImage);
      setAnalyzing(true);
      setAnalysis(undefined);
      setAnalysisError('');
      try {
        const response = await fetch('/api/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: nextImage }),
        });
        const result = await response.json() as { category?: string; confidence?: number; reason?: string; error?: string };
        if (!response.ok || !result.category) throw new Error(result.error || 'AI 분석을 완료하지 못했습니다.');
        setCategory(result.category);
        setAnalysis({
          category: result.category,
          confidence: Number(result.confidence) || 0,
          reason: result.reason || '사진 속 주요 대상을 기준으로 분류했습니다.',
        });
      } catch (error) {
        setAnalysisError(error instanceof Error ? error.message : 'AI 분석을 완료하지 못했습니다.');
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const locate = () => {
    setLocationState('loading');
    if (!navigator.geolocation) {
      setLocationState('error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        let place = '현재 위치';
        try {
          const response = await fetch(`/api/location?lat=${coords.latitude}&lng=${coords.longitude}`);
          const result = await response.json() as { place?: string };
          if (result.place) place = result.place;
        } catch {
          // 좌표는 확보했으므로 주소 변환 실패와 관계없이 신고를 계속한다.
        }
        setPosition({ lat: coords.latitude, lng: coords.longitude, place });
        setLocationState('done');
      },
      () => {
        setPosition({ lat: 36.5684, lng: 128.7294, place: '안동시청 인근 · 시연 위치' });
        setLocationState('error');
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const submit = () => {
    const location = position ?? { lat: 36.5684, lng: 128.7294, place: '안동시청 인근 · 시연 위치' };
    onSubmit({ category, description, ...location, image });
    setImage(undefined);
    setDescription('');
    setAnalysis(undefined);
    setAnalysisError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-[24px] p-5 sm:max-w-lg sm:p-6">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-2 text-sm font-bold text-[#36715d]"><Camera className="size-4" />현장 환경 신고</div>
          <DialogTitle className="text-xl font-extrabold tracking-tight text-[#173f34]">사진 한 장으로 신고하기</DialogTitle>
          <DialogDescription>사진과 위치를 확인한 뒤 환경관리단에 전달합니다.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <section>
            <p className="mb-2 text-sm font-bold text-[#284e43]">1. 현장 사진</p>
            <label className="relative flex min-h-44 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-[#b9cec5] bg-[#f2f7f4] text-center transition hover:border-[#6f9c8a]">
              {image ? <img src={image} alt="신고할 현장 미리보기" className="absolute inset-0 size-full object-cover" /> : <><span className="mb-3 grid size-12 place-items-center rounded-2xl bg-white text-[#36715d] shadow-sm"><ImagePlus className="size-6" /></span><strong className="text-sm text-[#284e43]">사진 촬영 또는 앨범에서 선택</strong><span className="mt-1 text-xs text-muted-foreground">JPG, PNG · 최대 10MB</span></>}
              <input className="sr-only" type="file" accept="image/*" capture="environment" onChange={chooseImage} />
              {image && <span className="absolute bottom-3 right-3 rounded-lg bg-black/65 px-3 py-1.5 text-xs font-bold text-white">사진 변경</span>}
            </label>
            {analyzing && <div className="mt-3 rounded-xl bg-[#eef4f1] p-3"><Progress value={66}><ProgressLabel className="flex items-center gap-2 text-[#36715d]"><LoaderCircle className="size-4 animate-spin" />AI가 유형을 확인하고 있습니다</ProgressLabel><ProgressValue>{() => '66%'}</ProgressValue></Progress></div>}
            {analysis && <div className="mt-3 rounded-xl border border-[#cfe0d9] bg-[#f4faf6] p-3 text-sm text-[#2f6654]"><div className="flex items-center gap-2 font-semibold"><Sparkles className="size-4" />AI 추천: {analysis.category}<span className="ml-auto text-xs text-[#628177]">신뢰도 {analysis.confidence}%</span></div><p className="mt-1.5 text-xs leading-relaxed text-[#5d7a70]">{analysis.reason}</p></div>}
            {analysisError && <div className="mt-3 rounded-xl border border-[#efd6c8] bg-[#fff7f2] p-3 text-xs font-medium text-[#9a512f]">{analysisError} 유형은 아래에서 직접 선택할 수 있습니다.</div>}
          </section>

          <section>
            <p className="mb-2 text-sm font-bold text-[#284e43]">2. 신고 위치</p>
            <Button type="button" variant="outline" className="h-12 w-full justify-start rounded-xl border-[#cbdad4] px-4" onClick={locate} disabled={locationState === 'loading'}>
              {locationState === 'loading' ? <LoaderCircle className="animate-spin" /> : locationState === 'done' ? <Check className="text-[#36715d]" /> : <Crosshair className="text-[#e7723c]" />}
              <span className="text-left"><strong className="block text-sm">{locationState === 'done' ? position?.place : locationState === 'error' ? '위치 권한이 없어 시연 위치를 사용합니다' : '현재 위치 자동 첨부'}</strong>{position && <small className="text-xs text-muted-foreground">{position.lat.toFixed(5)}, {position.lng.toFixed(5)}</small>}</span>
            </Button>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div><label htmlFor="category" className="mb-2 block text-sm font-bold text-[#284e43]">3. 신고 유형</label><NativeSelect id="category" value={category} onChange={(event) => setCategory(event.target.value)} className="w-full"><NativeSelectOption value="" disabled>유형 선택</NativeSelectOption>{categories.map((item) => <NativeSelectOption key={item} value={item}>{item}</NativeSelectOption>)}</NativeSelect></div>
            <div className="rounded-xl bg-[#fff4ec] p-3 text-xs leading-relaxed text-[#9a512f]"><strong className="mb-1 block">안전 안내</strong>폐농약·화학물질은 직접 만지지 말고 위치만 신고해 주세요.</div>
          </section>

          <section><label htmlFor="description" className="mb-2 block text-sm font-bold text-[#284e43]">추가 설명 <span className="font-normal text-muted-foreground">(선택)</span></label><Textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="수량, 접근 방법 등 현장 상황을 적어주세요." className="min-h-20 rounded-xl" /></section>
        </div>

        <DialogFooter className="mt-1 -mx-5 -mb-5 p-4 sm:-mx-6 sm:-mb-6">
          <Button variant="outline" className="h-11 rounded-xl px-5" onClick={() => onOpenChange(false)}>취소</Button>
          <Button className="h-11 rounded-xl bg-[#173f34] px-6 text-white hover:bg-[#245747]" onClick={submit}><MapPin />신고 접수</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
