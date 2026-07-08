import React, { useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { MapPin, AlertTriangle, Key, ArrowRight, Settings, Compass, Info } from 'lucide-react';

interface LeadMapProps {
  address: string;
  name: string;
}

let GOOGLE_MAPS_ENV_KEY = '';
try {
  if (typeof process !== 'undefined' && process && typeof process.env === 'object' && process.env !== null) {
    GOOGLE_MAPS_ENV_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || process.env.GOOGLE_MAPS_API_KEY || '';
  }
} catch (e) {
  // Safe fallback
}

let GOOGLE_MAPS_VITE_KEY = '';
try {
  GOOGLE_MAPS_VITE_KEY = (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY || (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';
} catch (e) {
  // Safe fallback
}

let GOOGLE_MAPS_GLOBAL_KEY = '';
try {
  GOOGLE_MAPS_GLOBAL_KEY = (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY || (globalThis as any).GOOGLE_MAPS_API_KEY || '';
} catch (e) {
  // Safe fallback
}

const API_KEY = GOOGLE_MAPS_ENV_KEY || GOOGLE_MAPS_VITE_KEY || GOOGLE_MAPS_GLOBAL_KEY || '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY' && API_KEY.trim() !== '';

// Default to Santiago, Chile
const DEFAULT_CENTER = { lat: -33.4489, lng: -70.6693 };

function MapController({ address }: { address: string }) {
  const map = useMap();
  const [position, setPosition] = useState<google.maps.LatLngLiteral | null>(null);
  const [error, setError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!map || !address) return;

    setIsLoading(true);
    setError(false);

    const geocoder = new google.maps.Geocoder();
    // Bias results locally to Chile
    const queryAddress = address.trim().toLowerCase().includes('chile') 
      ? address 
      : `${address}, Chile`;

    geocoder.geocode({ address: queryAddress }, (results, status) => {
      setIsLoading(false);
      if (status === 'OK' && results && results[0]) {
        const loc = results[0].geometry.location;
        const latLng = { lat: loc.lat(), lng: loc.lng() };
        setPosition(latLng);
        map.setCenter(latLng);
        map.setZoom(15);
      } else {
        console.warn('Geocoding search failed with status:', status);
        setError(true);
        // Fallback to average location (e.g. Center of commune if possible, or Santiago default)
        map.setCenter(DEFAULT_CENTER);
        map.setZoom(10);
      }
    });
  }, [map, address]);

  if (isLoading) {
    return (
      <div className="absolute inset-0 bg-slate-50/80 flex items-center justify-center backdrop-blur-[1px] z-10 transition-opacity duration-300">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Geolocalizando dirección...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute inset-0 bg-amber-50/95 flex flex-col items-center justify-center p-4 text-center z-10">
        <AlertTriangle className="w-8 h-8 text-amber-550 mb-2 animate-bounce" />
        <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Cruce de Ubicación Incierto</p>
        <p className="text-[10px] text-slate-500 font-semibold max-w-[180px] mt-1">
          No logramos situar "{address}" con exactitud. Mostrando mapa general regional.
        </p>
      </div>
    );
  }

  return position ? (
    <AdvancedMarker position={position} title={address}>
      <Pin 
        background="#4f46e5" 
        glyphColor="#ffffff" 
        borderColor="#4338ca"
        scale={1.1}
      />
    </AdvancedMarker>
  ) : null;
}

export function LeadMap({ address, name }: LeadMapProps) {
  if (!hasValidKey) {
    return (
      <div className="bg-slate-50 border border-slate-200/70 rounded-[28px] p-5 text-left space-y-4 shadow-sm relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-50 rounded-full blur-xl pointer-events-none" />
        
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-indigo-50 border border-indigo-100/60 rounded-xl text-indigo-600 shadow-xs">
            <Key className="w-5 h-5 text-indigo-650" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">Mapa Georeferencial Exclusivo</h4>
            <p className="text-[9.5px] font-bold text-slate-400">Requiere configuración de llave secreta del sistema de mapas</p>
          </div>
        </div>

        <div className="text-[10.5px] text-slate-600 font-medium leading-relaxed bg-white border border-slate-100 p-3.5 rounded-2xl space-y-2">
          <p className="font-bold flex items-center gap-1.5 text-indigo-700">
            <Compass className="w-3.5 h-3.5 text-indigo-600 animate-spin" /> Para habilitar la visualización del mapa interactivo:
          </p>
          <ol className="list-decimal list-inside pl-1 space-y-1.5 text-slate-500 font-semibold">
            <li>Consigue un token de Google Maps API ingresando a: <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-bold">Consola GMP</a></li>
            <li>Haz clic en el ícono de engranaje <strong className="text-slate-800 inline-flex items-center gap-0.5"><Settings className="w-3 h-3 text-slate-500" /> Ajustes (Settings)</strong> en la esquina superior derecha de la pantalla.</li>
            <li>Ingresa a la sección <strong className="text-slate-800">Secrets</strong>.</li>
            <li>Registra la variable <code className="bg-slate-50 px-1 py-0.5 border border-slate-200 rounded font-mono text-[9px] text-indigo-600">GOOGLE_MAPS_PLATFORM_KEY</code> con tu clave recién generada.</li>
          </ol>
        </div>

        <div className="flex items-center justify-between pt-1 text-[9px] text-slate-400 font-semibold">
          <span className="flex items-center gap-1"><Info className="w-3 h-3 text-slate-400" /> Integración Segura API</span>
          <span className="italic">El mapa se actualizará automáticamente</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-[28px] p-4 text-left space-y-3 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-550/10 text-indigo-650 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-indigo-600 animate-pulse" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight truncate py-0.5 block">{name}</h4>
          </div>
        </div>
        <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-0.5 border border-slate-200/60 rounded-md shrink-0">
          Mapa Activo
        </span>
      </div>

      <div className="h-44 w-full rounded-2xl border border-slate-150 overflow-hidden relative shadow-inner [mask-image:radial-gradient(ellipse_at_center,black_90%,transparent_100%)]">
        <APIProvider apiKey={API_KEY} version="weekly">
          <Map
            defaultCenter={DEFAULT_CENTER}
            defaultZoom={12}
            mapId="DEMO_MAP_ID"
            disableDefaultUI={true}
            zoomControl={true}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
          >
            <MapController address={address} />
          </Map>
        </APIProvider>
      </div>

      <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/60 p-2.5 rounded-xl text-[10px] font-semibold text-slate-500 text-left">
        <span className="text-[9.5px] font-black uppercase text-indigo-600 tracking-wider block shrink-0">Dirección:</span>
        <span className="truncate" title={address}>{address}</span>
      </div>
    </div>
  );
}
