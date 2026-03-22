'use client';

import { useState, useEffect } from 'react';
import { EmergencyType, Hospital, DecisionResult, HospitalBase, DecisionRecord, MetricsSnapshot } from '@/lib/types';
import { fetchDecision, fetchHospitals, fetchDecisionWithData, fetchHistory, fetchMetrics } from '@/lib/api';
import { decisionBreaker } from '@/lib/circuitBreaker';
import MapWrapper from '@/app/components/MapWrapper';
import MetricsPanel from '@/app/components/MetricsPanel';

const EMERGENCY_OPTIONS: { value: EmergencyType; label: string }[] = [
  { value: 'heart_attack', label: 'Heart attack' },
  { value: 'stroke', label: 'Stroke' },
  { value: 'accident', label: 'Accident' },
  { value: 'breathing_problem', label: 'Breathing problem' },
  { value: 'severe_bleeding', label: 'Severe bleeding' },
];

function StatusBadge({ status }: { status: Hospital['status'] }) {
  const styles = {
    excellent: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    good: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    risk: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function formatEmergencyType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function HomePage() {
  const [selectedEmergency, setSelectedEmergency] = useState<EmergencyType | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DecisionResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveHospitals, setLiveHospitals] = useState<(HospitalBase & { beds: number; occupancy: number })[] | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [history, setHistory] = useState<DecisionRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<MetricsSnapshot | null>(null);
  const [showMetrics, setShowMetrics] = useState(false);
  const [circuitOpen, setCircuitOpen] = useState(false);

  useEffect(() => {
    setCircuitOpen(decisionBreaker.getState() === 'open');
  }, []);

  useEffect(() => {
    const pollMetrics = async () => {
      try {
        const data = await fetchMetrics();
        setMetrics(data);
      } catch {
        // Silent metrics error
      }
    };

    pollMetrics();
    const interval = setInterval(pollMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          setLocationError('Location unavailable — using default distances');
        }
      );
    }
  }, []);

  useEffect(() => {
    if (!selectedEmergency) return;

    const pollHospitals = async () => {
      try {
        const hospitals = await fetchHospitals();
        setLiveHospitals(hospitals);
        setLastUpdated(new Date().toLocaleTimeString());
      } catch {
        // Silent polling error
      }
    };

    pollHospitals();
    const interval = setInterval(pollHospitals, 10000);

    return () => clearInterval(interval);
  }, [selectedEmergency]);

  const handleSearch = async () => {
    if (!selectedEmergency) return;

    setIsLoading(true);
    setHasSearched(true);
    setError(null);
    setResult(null);

    try {
      const decision = liveHospitals
        ? await fetchDecisionWithData(selectedEmergency, liveHospitals)
        : await fetchDecision(selectedEmergency, userLocation || undefined);
      setResult(decision);

      try {
        const hist = await fetchHistory(10);
        setHistory(hist);
      } catch {
        // Silent history error
      }
    } catch (err) {
      setCircuitOpen(decisionBreaker.getState() === 'open');
      setError('Unable to connect to the decision service. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const bestHospital = result?.best ?? null;
  const alternativeHospitals = result?.alternatives ?? [];
  const mapHospitals = result?.best ? [result.best, ...result.alternatives] : [];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="mx-auto max-w-md px-4 py-8 sm:max-w-lg sm:px-6 lg:max-w-xl lg:px-8">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-emerald-400 sm:text-4xl">
              Emergency Flow
            </h1>
            <p className="mt-2 text-sm text-gray-400 sm:text-base">
              Real-time decision system
            </p>
          </div>
          {metrics !== null && (
            <button
              onClick={() => setShowMetrics(!showMetrics)}
              className="text-xs text-gray-500 hover:text-emerald-400 border border-gray-700 hover:border-emerald-500 rounded px-2 py-1 transition-colors"
            >
              ⚡ Metrics
            </button>
          )}
        </header>

        {circuitOpen && (
          <div className="mb-4 rounded-lg border border-red-500 bg-red-950/30 p-3 flex items-center gap-2">
            <span className="text-red-400 text-sm font-semibold">⚠ Backend unavailable</span>
            <span className="text-red-300 text-xs">System is recovering. Please wait 15 seconds before retrying.</span>
          </div>
        )}

        {showMetrics && metrics && (
          <div className="mb-6">
            <MetricsPanel metrics={metrics} />
          </div>
        )}

        <section className="mb-6 rounded-lg bg-gray-900 p-6 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="emergency-select"
              className="block text-sm font-medium text-gray-300"
            >
              Select Emergency Type
            </label>
            {liveHospitals && (
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"></span>
                  <span className="text-xs text-emerald-400">Live data</span>
                </div>
                {lastUpdated && (
                  <span className="text-xs text-gray-500">Updated: {lastUpdated}</span>
                )}
              </div>
            )}
          </div>

          <div className="mb-3 flex items-center gap-2">
            {userLocation ? (
              <>
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"></span>
                <span className="text-xs text-emerald-400">GPS active</span>
              </>
            ) : locationError ? (
              <>
                <span className="h-2 w-2 rounded-full bg-yellow-400"></span>
                <span className="text-xs text-yellow-400">{locationError}</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-gray-500"></span>
                <span className="text-xs text-gray-500">Acquiring location...</span>
              </>
            )}
          </div>

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

          {history.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="mt-2 block w-full text-sm text-gray-400 hover:text-gray-200 underline text-center"
            >
              View history ({history.length})
            </button>
          )}
        </section>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500 bg-red-950/30 p-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {showHistory && history.length > 0 && (
          <section className="mb-6 rounded-lg bg-gray-900 p-4 shadow-lg">
            <h2 className="mb-3 text-sm font-semibold text-gray-400 uppercase tracking-wide">
              Decision History
            </h2>
            {history.map((record) => (
              <div
                key={record.id}
                className="mb-2 rounded bg-gray-800 p-3 border-l-2 border-emerald-500"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">
                    {new Date(record.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatEmergencyType(record.emergencyType)}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-200">
                    {record.bestHospitalName}
                  </span>
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
                    {record.bestHospitalScore}/100
                  </span>
                </div>
                <p className="text-xs italic text-gray-500">{record.reasoning}</p>
              </div>
            ))}
          </section>
        )}

        {hasSearched && !isLoading && result && (
          <div className="space-y-6">
            {bestHospital && (
              <section>
                <h2 className="mb-3 text-lg font-semibold text-emerald-400">
                  Best Option
                </h2>
                <div className="rounded-lg border-2 border-emerald-500 bg-emerald-950/30 p-5 shadow-lg">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-emerald-300">
                        {bestHospital.name}
                      </h3>
                      <StatusBadge status={bestHospital.status} />
                    </div>
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

                  <p className="mt-3 text-sm italic text-emerald-300">
                    {result.reasoning}
                  </p>

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
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-200">
                            {hospital.name}
                          </h3>
                          <StatusBadge status={hospital.status} />
                        </div>
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

        {hasSearched && !isLoading && mapHospitals.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-3 text-lg font-semibold text-emerald-400">Map</h2>
            <MapWrapper
              hospitals={mapHospitals}
              bestHospitalId={result?.best?.id ?? null}
              userLocation={userLocation}
            />
          </section>
        )}

        {hasSearched && !isLoading && result?.alternatives.length === 0 && (
          <div className="rounded-lg border border-yellow-500 bg-yellow-950/30 p-6 text-center">
            <p className="text-yellow-400">No hospitals found in your area</p>
          </div>
        )}
      </div>
    </div>
  );
}
