'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import type { Icon, DivIcon } from 'leaflet';
import type { Hospital } from '@/lib/types';

interface EmergencyMapProps {
  hospitals: Hospital[];
  bestHospitalId: string | null;
  userLocation: { lat: number; lng: number } | null;
}

export default function EmergencyMap({ hospitals, bestHospitalId, userLocation }: EmergencyMapProps) {
  const [icons, setIcons] = useState<{
    default: Icon;
    best: DivIcon;
    user: DivIcon;
  } | null>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet');

    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    setIcons({
      default: new L.Icon.Default(),
      best: L.divIcon({
        className: '',
        html: '<div style="width:24px;height:24px;background:#10b981;border-radius:50%;border:2px solid white;box-shadow:0 0 6px rgba(16,185,129,0.8);"></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
      user: L.divIcon({
        className: '',
        html: '<div style="width:16px;height:16px;background:#3b82f6;border-radius:50%;border:2px solid white;box-shadow:0 0 6px rgba(59,130,246,0.8);"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      }),
    });
  }, []);

  if (!icons) return (
    <div className="h-[400px] w-full rounded-lg bg-gray-800 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Loading map...</p>
    </div>
  );

  const bestHospital = hospitals.find(h => h.id === bestHospitalId);

  return (
    <MapContainer
      center={[-25.4372, -49.2731]}
      zoom={13}
      style={{ height: '400px', width: '100%', borderRadius: '0.5rem' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      {hospitals.map((hospital) => (
        <Marker
          key={hospital.id}
          position={[hospital.lat, hospital.lng]}
          icon={hospital.id === bestHospitalId ? icons.best : icons.default}
        >
          <Popup>
            <div className="min-w-[150px]">
              <p className="font-bold text-sm mb-1">{hospital.name}</p>
              <p className="text-xs">
                Score:{' '}
                <span style={{
                  color: hospital.status === 'excellent' ? '#10b981'
                    : hospital.status === 'good' ? '#eab308'
                    : '#ef4444'
                }}>
                  {hospital.score}/100
                </span>
              </p>
              <p className="text-xs">{hospital.estimatedTime} min • {hospital.distance} km</p>
            </div>
          </Popup>
        </Marker>
      ))}

      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={icons.user}>
          <Popup>
            <p className="text-sm font-semibold">Your location</p>
          </Popup>
        </Marker>
      )}

      {userLocation && bestHospital && (
        <Polyline
          positions={[
            [userLocation.lat, userLocation.lng],
            [bestHospital.lat, bestHospital.lng],
          ]}
          color="#10b981"
          weight={3}
          dashArray="6, 10"
        />
      )}
    </MapContainer>
  );
}
