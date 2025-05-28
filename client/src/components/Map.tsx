import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Исправление проблемы с иконками маркеров в Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface Point {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description?: string;
}

interface MapProps {
  points: Point[];
  onMapClick?: (lat: number, lng: number) => void;
  interactive?: boolean;
  center?: [number, number];
  zoom?: number;
}

const Map = ({ 
  points, 
  onMapClick, 
  interactive = false, 
  center = [55.7558, 37.6173], // Москва по умолчанию
  zoom = 10 
}: MapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Инициализация карты, если она еще не создана
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(center, zoom);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);

      // Добавление обработчика клика по карте для интерактивного режима
      if (interactive && onMapClick) {
        mapRef.current.on('click', (e: L.LeafletMouseEvent) => {
          const { lat, lng } = e.latlng;
          onMapClick(lat, lng);
        });
      }
    } else {
      // Если карта уже создана, обновляем центр и масштаб
      mapRef.current.setView(center, zoom);
    }

    // Очистка и добавление новых маркеров при изменении точек
    const map = mapRef.current;
    const markersLayer = L.layerGroup().addTo(map);
    
    points.forEach(point => {
      const marker = L.marker([Number(point.lat), Number(point.lng)])
        .addTo(markersLayer)
        .bindPopup(`<b>${point.name}</b>${point.description ? `<br>${point.description}` : ''}`);
        
      if (interactive) {
        marker.on('click', () => {
          marker.openPopup();
        });
      }
    });

    // Если у нас есть хотя бы две точки, создаем линию между ними
    if (points.length >= 2) {
      const polyline = L.polyline(
        points.map(point => [Number(point.lat), Number(point.lng)]),
        { color: 'blue', weight: 3, opacity: 0.7 }
      ).addTo(markersLayer);
    }

    return () => {
      // Очистка маркеров при размонтировании компонента
      markersLayer.clearLayers();
    };
  }, [points, center, zoom, interactive, onMapClick]);

  return (
    <div ref={mapContainerRef} className="map-container" />
  );
};

export default Map; 