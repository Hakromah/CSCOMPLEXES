"use client"
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';
interface MapProps {
    lat?: number;
    lng?: number;
}

export default function Map({ lat, lng }: MapProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Coordinates default to Liberia if none are provided from Strapi backend
    const latitude = lat || 6.280628622957243;
    const longitude = lng || -10.766005500256005;
    const position: [number, number] = [latitude, longitude];

    if (!isMounted) {
        return <div className="h-full w-full bg-gray-100 flex items-center justify-center">Loading Map...</div>;
    }

    const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `   <a href="https://maps.google.com/?q=${latitude},${longitude}" target="_blank" class="text group/marker h-full w-full block duration-500 justify-center">
        <div class="w-fit h-fit realtive overflow-visible duration-500">
                  <svg class="w-15 h-15" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none" class="animate-pulse">
                    <circle class="circle second-circle fill-primary opacity-20" cx="40" cy="40" r="40" />
                    <circle class="circle third-circle fill-primary opacity-40" cx="40.0006" cy="39.9999" r="26.6667" />
                    <circle class="circle fill-primary" cx="39.9993" cy="40.0001" r="13.3333" />
                    </svg>

                    <span class=" font-500 text-nowrap text-sm lg:hover:bg-primary py-2 px-4 rounded-[40px] border border-white/20 bg-white leading-18 text-black backdrop-blur-[13px] duration-500 md:hover:border-white lg:tracking-[-0.28px] lg:hover:text-white"> Get the Directions </span>

             </div>

        </a>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20],
    });

    return (
        <MapContainer
            center={position}
            zoom={15}
            scrollWheelZoom={false}
            className="map-container h-full rounded-3xl relative z-10 aspect-video overflow-hidden bg-transparent w-full   [&.leaflet-bottom]:hidden! [&.leaflet-control-attribution.leaflet-control]:opacity-0! [&>.leaflet-control-container>.leaflet-left]:right-0! [&>.leaflet-control-container>.leaflet-left]:bottom-0! [&>.leaflet-control-container>.leaflet-left]:h-fit [&>.leaflet-control-container>.leaflet-left]:w-fit"
            style={{ height: '100%', width: '100%' }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={position} icon={customIcon}>
                <Popup>
                    <div className="text-center">
                        <h3 className="font-bold text-[#2857AE]">A.M. Fofana High School</h3>
                        <p>Fish Market, Monrovia</p>
                        {/* <a href="https://maps.google.com/?q=6.280628622957243,-10.766005500256005" target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline mt-1 block">
                            Get Directions
                        </a> */}

                        <a href={`https://maps.google.com/?q=${latitude},${longitude}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline mt-1 block">
                            Get Directions
                        </a>
                    </div>
                </Popup>
            </Marker>
        </MapContainer>
    );
}
