'use client';

import dynamic from 'next/dynamic';
import type { Hospital } from '@/lib/types';

const EmergencyMap = dynamic(() => import('./EmergencyMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full rounded-lg bg-gray-800 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Loading map...</p>
    </div>
  ),
});

interface MapWrapperProps {
  hospitals: Hospital[];
  bestHospitalId: string | null;
  userLocation: { lat: number; lng: number } | null;
}

export default function MapWrapper(props: MapWrapperProps) {
  return <EmergencyMap {...props} />;
}
