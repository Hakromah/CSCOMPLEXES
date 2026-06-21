/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
// @ts-ignore: side-effect import of stylesheet without type declarations
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { MapSettingData } from '@/types/strapi';

interface MapProps {
    // Legacy coordinate props (from contact-info) kept for backwards compat
    lat?: number;
    lng?: number;
    // Full map settings from map-setting Strapi single type
    mapSetting?: MapSettingData | null;
}

export default function Map({ lat, lng, mapSetting }: MapProps) {
    // Guard against SSR — Leaflet requires the browser DOM
    const isClient = typeof window !== 'undefined';

    // Coordinates: prefer mapSetting, fall back to lat/lng props, then default to Conakry
    const latitude = mapSetting?.latitude ?? lat ?? 9.537500;
    const longitude = mapSetting?.longitude ?? lng ?? -13.677330;
    const position: [number, number] = [latitude, longitude];
    const zoomLevel = mapSetting?.zoomLevel ?? 15;

    // Display fields from Strapi or sensible defaults
    const schoolName = mapSetting?.schoolName ?? 'Complex Scolaire Camara Salemtou';
    const popupSubtitle = mapSetting?.popupSubtitle ?? 'Conakry, Guinee';
    const directionsLabel = mapSetting?.directionsLabel ?? "Obtenir l'itineraire";
    const markerPulse = mapSetting?.markerPulse ?? true;

    // Build the Google Maps directions URL
    const mapsUrl = mapSetting?.googleMapsUrl && mapSetting.googleMapsUrl.trim() !== ''
        ? mapSetting.googleMapsUrl
        : `https://maps.google.com/?q=${latitude},${longitude}`;

    if (!isClient) {
        return (
            <div className="h-full w-full bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col items-center justify-center gap-3 rounded-3xl">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-500 font-medium">Chargement de la carte...</span>
            </div>
        );
    }


    const pulseClass = markerPulse ? 'animate-pulse' : '';

    const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `
        <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer"
        style="display:block;text-decoration:none;cursor:pointer;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
            <svg class="${pulseClass}" style="width:60px;height:60px;filter:drop-shadow(0 4px 12px rgba(40,87,174,0.45));"
                xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
            <circle fill="#394995" fill-opacity="0.15" cx="40" cy="40" r="40"/>
            <circle fill="#394995" fill-opacity="0.35" cx="40" cy="40" r="26.667"/>
            <circle fill="#394995" cx="40" cy="40" r="13.333"/>
            </svg>
            <span style="
            font-family:system-ui,sans-serif;
            font-size:11px;font-weight:600;white-space:nowrap;
            background:white;color:#394995;
            padding:4px 12px;border-radius:20px;
            border:1px solid rgba(40,87,174,0.2);
            box-shadow:0 2px 8px rgba(0,0,0,0.1);
            backdrop-filter:blur(8px);
            ">Get Directions</span>
        </div>
        </a>`,
        iconSize: [100, 90],
        iconAnchor: [50, 30],
        popupAnchor: [0, -35],
    });

    return (
        <MapContainer
            center={position}
            zoom={zoomLevel}
            scrollWheelZoom={false}
            className="h-full w-full md:rounded-3xl max-md:rounded-md"
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={position} icon={customIcon}>
                <Popup>
                    <div style={{ textAlign: 'center', minWidth: '160px' }}>
                        <h3 style={{ fontWeight: 700, color: '#394995', marginBottom: '4px', fontSize: '14px' }}>
                            {schoolName}
                        </h3>
                        {popupSubtitle && (
                            <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '6px' }}>
                                {popupSubtitle}
                            </p>
                        )}
                        <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#394995', fontSize: '12px', textDecoration: 'underline' }}
                        >
                            {directionsLabel}
                        </a>
                    </div>
                </Popup>
            </Marker>
        </MapContainer>
    );
}
