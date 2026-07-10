"use client";
import type { MapSettingData } from '@/types/strapi';

interface MapProps {
    // Legacy coordinate props (from contact-info) kept for backwards compat
    lat?: number;
    lng?: number;
    // Full map settings from map-setting Strapi single type
    mapSetting?: MapSettingData | null;
}

export default function Map({ lat, lng, mapSetting }: MapProps) {
    // Coordinates: prefer mapSetting, fall back to lat/lng props, then default to Conakry
    const latitude = mapSetting?.latitude ?? lat ?? 9.537500;
    const longitude = mapSetting?.longitude ?? lng ?? -13.677330;
    const zoomLevel = mapSetting?.zoomLevel ?? 15;
    const schoolName = mapSetting?.schoolName ?? 'Complex Scolaire Camara Salemtou';

    // Parse the iframe source URL from map setting
    let embedUrl = "";
    const rawUrl = mapSetting?.googleMapsUrl?.trim();
    
    if (rawUrl) {
        if (rawUrl.includes("google.com/maps/embed")) {
            embedUrl = rawUrl;
        } else if (rawUrl.includes("<iframe")) {
            // Extract the src attribute if the user pasted the entire HTML iframe tag
            const match = rawUrl.match(/src="([^"]+)"/);
            embedUrl = match ? match[1] : rawUrl;
        } else if (rawUrl.includes("google.com/maps") && rawUrl.includes("output=embed")) {
            embedUrl = rawUrl;
        } else {
            // Fallback for standard Google Maps URLs that are not directly embeddable
            embedUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&z=${zoomLevel}&output=embed`;
        }
    } else {
        embedUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&z=${zoomLevel}&output=embed`;
    }

    return (
        <iframe
            src={embedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={true}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-full w-full md:rounded-3xl max-md:rounded-md"
            title={schoolName}
        />
    );
}
