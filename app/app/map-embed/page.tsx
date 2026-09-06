'use client';
import { useEffect, useState } from 'react';
import { EnvironmentMap } from '@/components/environment-map';
import { useEnvironment } from '@/hooks/use-environment';
export default function EmbeddedMap() {
  const cloud = useEnvironment();
  const [period, setPeriod] = useState('2027-10');
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('period');
    if (p && /^20[0-9]{2}-(0[1-9]|1[0-2])$/.test(p)) setPeriod(p);
  }, []);
  return (
    <div className="embedded-map">
      <EnvironmentMap
        inputs={cloud.inputs}
        records={cloud.records}
        period={period}
      />
    </div>
  );
}
