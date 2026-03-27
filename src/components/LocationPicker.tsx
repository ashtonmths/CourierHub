"use client";

/**
 * LocationPicker — interactive Leaflet map for selecting a delivery location.
 *
 * • Click anywhere on the map to drop a pin
 * • Uses OpenStreetMap tiles (free, no API key)
 * • Nominatim reverse-geocoding to resolve coordinates → address string
 * • Calls onSelect({ lat, lng, address, city, state, country }) on every pin drop
 */

import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2, LocateFixed, X } from "lucide-react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";

export interface LocationResult {
  lat: number;
  lng: number;
  address: string;
  city?: string;
  state?: string;
  country?: string;
}

interface LocationPickerProps {
  label: string;
  value?: LocationResult;
  onSelect: (loc: LocationResult) => void;
  defaultCenter?: [number, number];
}

// ── Nominatim reverse-geocode ────────────────────────────────────────────────

async function reverseGeocode(lat: number, lng: number): Promise<LocationResult> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
  const res = await fetch(url, {
    headers: { "Accept-Language": "en", "User-Agent": "CourierHub/1.0" },
  });
  if (!res.ok) throw new Error("Geocoding failed");
  const data = await res.json();
  const a = data.address ?? {};

  const city =
    a.city ?? a.town ?? a.village ?? a.suburb ?? a.county ?? "";
  const state = a.state ?? "";
  const country = a.country ?? "";
  const road = [a.house_number, a.road].filter(Boolean).join(" ");
  const address =
    [road, a.suburb, city, state, a.postcode, country]
      .filter(Boolean)
      .join(", ") || data.display_name;

  return { lat, lng, address, city, state, country };
}

// ── Component ────────────────────────────────────────────────────────────────

export default function LocationPicker({
  label,
  value,
  onSelect,
  defaultCenter = [20.5937, 78.9629], // India centroid
}: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Init map (runs only once, client-side) ────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    let mounted = true;

    import("leaflet").then((L) => {
      // Guard: if the component unmounted while the import was resolving,
      // or if Leaflet already initialized this container (React Strict Mode double-invoke)
      if (!mounted || !containerRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((containerRef.current as any)._leaflet_id) return;

      // Fix default icon paths broken by webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const center: [number, number] = value
        ? [value.lat, value.lng]
        : defaultCenter;

      const map = L.map(containerRef.current!, {
        center,
        zoom: value ? 14 : 5,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Restore existing pin if value is set
      if (value) {
        markerRef.current = L.marker([value.lat, value.lng], { draggable: true }).addTo(map);
        markerRef.current.on("dragend", () => {
          const pos = markerRef.current!.getLatLng();
          handlePick(L, pos.lat, pos.lng);
        });
      }

      // Click to place / move pin
      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        handlePick(L, e.latlng.lat, e.latlng.lng);
      });

      mapRef.current = map;
    });

    return () => {
      mounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Place / move marker & reverse-geocode ─────────────────────────────────
  async function handlePick(L: typeof import("leaflet"), lat: number, lng: number) {
    setError(null);
    setGeocoding(true);

    // Place / move marker
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current!);
      markerRef.current.on("dragend", () => {
        const pos = markerRef.current!.getLatLng();
        handlePick(L, pos.lat, pos.lng);
      });
    }

    try {
      const result = await reverseGeocode(lat, lng);
      onSelect(result);
    } catch {
      setError("Could not resolve address. Check your internet connection.");
    } finally {
      setGeocoding(false);
    }
  }

  // ── Use my location ───────────────────────────────────────────────────────
  async function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const L = await import("leaflet");
        mapRef.current?.setView([lat, lng], 15);
        await handlePick(L, lat, lng);
        setLocating(false);
      },
      () => {
        setError("Location access denied.");
        setLocating(false);
      }
    );
  }

  // ── Clear pin ─────────────────────────────────────────────────────────────
  function clearPin() {
    if (markerRef.current && mapRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <MapPin className="h-4 w-4 text-accent" />
          {label}
        </label>
        <div className="flex items-center gap-2">
          {value && (
            <button
              type="button"
              onClick={clearPin}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className="flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            {locating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <LocateFixed className="h-3 w-3 text-accent" />
            )}
            Use my location
          </button>
        </div>
      </div>

      {/* Map container */}
      <div className="relative overflow-hidden rounded-xl border bg-muted" style={{ height: 260 }}>
        <div ref={containerRef} className="h-full w-full" />

        {/* Loading overlay */}
        {geocoding && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm z-[1000]">
            <div className="flex items-center gap-2 rounded-lg bg-card px-4 py-2 text-sm font-medium shadow-elevated">
              <Loader2 className="h-4 w-4 animate-spin text-accent" />
              Resolving address…
            </div>
          </div>
        )}

        {/* Click hint — only shown when no pin placed yet */}
        {!value && !geocoding && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] rounded-full bg-card/90 px-3 py-1.5 text-xs text-muted-foreground shadow backdrop-blur-sm">
            Click anywhere on the map to set location
          </div>
        )}
      </div>

      {/* Resolved address */}
      {value && (
        <div className="rounded-lg border border-accent/25 bg-accent/5 px-3 py-2 text-xs leading-relaxed text-foreground">
          <span className="font-semibold text-accent">📍 </span>
          {value.address}
          <span className="ml-2 text-muted-foreground">
            ({value.lat.toFixed(5)}, {value.lng.toFixed(5)})
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
