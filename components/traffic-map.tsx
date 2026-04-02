'use client';
import { useEffect, useRef, useState } from 'react';

interface Stop {
  lat: number;
  lng: number;
  name: string;
  order: number;
}

interface Props {
  stops: Stop[];
  center?: { lat: number; lng: number };
}

export default function TrafficMap({ stops, center }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || !mapRef.current || stops.length === 0) return;

    const initMap = async () => {
      const L = (await import('leaflet')).default;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const defaultCenter = center || { lat: 13.0827, lng: 80.2707 };
      const map = L.map(mapRef.current!, {
        center: [defaultCenter.lat, defaultCenter.lng],
        zoom: 12,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      const points: [number, number][] = [];

      stops.forEach((stop) => {
        const icon = L.divIcon({
          html: `<div style="background:linear-gradient(135deg,#0F172A,#1E293B);color:white;width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.2)">${stop.order}</div>`,
          className: '',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        L.marker([stop.lat, stop.lng], { icon })
          .addTo(map)
          .bindPopup(`<b>${stop.order}. ${stop.name}</b>`);

        points.push([stop.lat, stop.lng]);
      });

      if (points.length > 1) {
        L.polyline(points, {
          color: '#0F172A',
          weight: 3,
          opacity: 0.5,
          dashArray: '8, 8',
        }).addTo(map);
      }

      if (points.length > 0) {
        map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
      }

      mapInstanceRef.current = map;
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mounted, stops, center]);

  if (!mounted) {
    return <div className="w-full h-[400px] skeleton rounded-2xl" />;
  }

  return (
    <div className="card-premium overflow-hidden">
      <div ref={mapRef} className="w-full h-[400px]" />
    </div>
  );
}
