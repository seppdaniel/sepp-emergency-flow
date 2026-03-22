'use client';

import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => console.log('[PWA] Service worker registered'))
        .catch((err) => console.error('[PWA] Registration failed:', err));
    }
  }, []);

  return null;
}
