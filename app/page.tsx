'use client';

import { useState } from 'react';

type EmergencyType = 'heart_attack' | 'accident' | 'breathing_problem';

interface Hospital {
  id: string;
  name: string;
  distance: number;
  beds: number;
  occupancy: number;
  score: number;
  estimatedTime: number;
}

const EMERGENCY_OPTIONS: { value: EmergencyType; label: string }[] = [
  { value: 'heart_attack', label: 'Heart attack' },
  { value: 'accident', label: 'Accident' },
  { value: 'breathing_problem', label: 'Breathing problem' },
];

const HOSPITAL_NAMES = [
  'General Hospital Central',
  'City Medical Center',
  'Emergency Care Unit',
  'Trauma Hospital',
  'Heart Institute',
];

function calculateScore(distance: number, beds: number, occupancy: number) {
  const maxDistance = 20;
  const distanceScore = Math.max(0, 100 - (distance / maxDistance) * 100);

  const bedsScore = Math.min(100, beds * 4);

  const occupancyScore = (1 - occupancy) * 100;

  const distanceWeight = 0.6;
  const bedsWeight = 0.25;
  const occupancyWeight = 0.15;

  const finalScore =
    distanceScore * distanceWeight +
    bedsScore * bedsWeight +
    occupancyScore * occupancyWeight;

  return Math.round(Math.max(0, Math.min(100, finalScore)));
}
function getStatus(score: number) {
  if (score >= 75) return "Excellent";
  if (score >= 55) return "Good";
  return "Risk";
}
function generateMockHospitals(): Hospital[] {
  const hospitals: Hospital[] = HOSPITAL_NAMES.slice(0, 4).map((name, index) => {
    const distance = Math.random() * 15 + 2;
    const beds = Math.floor(Math.random() * 20) + 5;
    const occupancy = Math.random() * 0.8 + 0.2;
    const score = calculateScore(distance, beds, occupancy);

    return {
      id: `hospital-${index}`,
      name,
      distance: Math.round(distance * 10) / 10,
      beds,
      occupancy,
      score,
      estimatedTime: Math.floor(distance * 2.5) + 5,
    };
  });

  return hospitals.sort((a, b) => b.score - a.score);
}

export default function HomePage() {
  const [selectedEmergency, setSelectedEmergency] = useState<EmergencyType | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Hospital[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!selectedEmergency) return;

    setIsLoading(true);
    setHasSearched(true);

    await new Promise((resolve) => setTimeout(resolve, 800));

    const hospitals = generateMockHospitals();
    setResults(hospitals);
    setIsLoading(false);
  };

  const bestHospital = results?.[0] ?? null;
  const alternativeHospitals = results?.slice(1, 4) ?? [];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="mx-auto max-w-md px-4 py-8 sm:max-w-lg sm:px-6 lg:max-w-xl lg:px-8">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-emerald-400 sm:text-4xl">
            Emergency Flow
          </h1>
          <p className="mt-2 text-sm text-gray-400 sm:text-base">
            Real-time decision system
          </p>
        </header>

        <section className="mb-6 rounded-lg bg-gray-900 p-6 shadow-lg">
          <label
            htmlFor="emergency-select"
            className="mb-2 block text-sm font-medium text-gray-300"
          >
            Select Emergency Type
          </label>
          <select
            id="emergency-select"
            value={selectedEmergency}
            onChange={(e) => setSelectedEmergency(e.target.value as EmergencyType)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-gray-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            <option value="">Choose an option</option>
            {EMERGENCY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            onClick={handleSearch}
            disabled={!selectedEmergency || isLoading}
            className="mt-4 w-full rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-500 sm:py-4"
          >
            {isLoading ? 'Searching...' : 'Find best destination'}
          </button>
        </section>

        {hasSearched && !isLoading && results && (
          <div className="space-y-6">
            {bestHospital && (
              <section>
                <h2 className="mb-3 text-lg font-semibold text-emerald-400">
                  Best Option
                </h2>
                <div className="rounded-lg border-2 border-emerald-500 bg-emerald-950/30 p-5 shadow-lg">
                  <div className="mb-4 flex items-start justify-between">
                    <h3 className="text-xl font-bold text-emerald-300">
                      {bestHospital.name}
                    </h3>
                    <div className="rounded-full bg-emerald-500/20 px-3 py-1">
                      <span className="text-lg font-bold text-emerald-400">
                        {bestHospital.score}
                      </span>
                      <span className="ml-1 text-xs text-emerald-300">/100</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Est. Time</p>
                      <p className="font-semibold">{bestHospital.estimatedTime} min</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Distance</p>
                      <p className="font-semibold">{bestHospital.distance} km</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Beds</p>
                      <p className="font-semibold">{bestHospital.beds} avail</p>
                    </div>
                  </div>

                  <button className="mt-4 w-full rounded-lg bg-emerald-600 py-2 font-semibold text-white transition-colors hover:bg-emerald-500">
                    Open route
                  </button>
                </div>
              </section>
            )}

            {alternativeHospitals.length > 0 && (
              <section>
                <h2 className="mb-3 text-lg font-semibold text-gray-300">
                  Alternatives
                </h2>
                <div className="space-y-3">
                  {alternativeHospitals.map((hospital) => (
                    <div
                      key={hospital.id}
                      className="rounded-lg border border-gray-700 bg-gray-900 p-4"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-200">
                          {hospital.name}
                        </h3>
                        <span className="text-sm font-bold text-gray-400">
                          {hospital.score}
                          <span className="ml-1 text-xs text-gray-500">/100</span>
                        </span>
                      </div>
                      <div className="flex gap-4 text-sm text-gray-400">
                        <span>{hospital.estimatedTime} min</span>
                        <span>•</span>
                        <span>{hospital.distance} km</span>
                        <span>•</span>
                        <span>{hospital.beds} beds</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {hasSearched && !isLoading && results?.length === 0 && (
          <div className="rounded-lg border border-yellow-500 bg-yellow-950/30 p-6 text-center">
            <p className="text-yellow-400">No hospitals found in your area</p>
          </div>
        )}
      </div>
    </div>
  );
}
