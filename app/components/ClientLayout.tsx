'use client';

import dynamic from 'next/dynamic';
import PWARegisterInner from '@/app/components/PWARegister';

const PWARegister = dynamic(() => Promise.resolve({ default: PWARegisterInner }), { ssr: false });

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PWARegister />
    </>
  );
}
