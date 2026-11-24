import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { Box } from '@mui/material';
import { TIMISOARA } from '../lib/geo';

// Leaflet resolves its default icon relative to the CSS file, which breaks under bundlers.
// Use an explicit icon built from the bundled assets for every marker.
L.Marker.prototype.options.icon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

/** Leaflet measures its container once; re-measure when the container is resized (cards, collapses, lazy layout). */
function AutoResize() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);
  return null;
}

const tiles = (
  <TileLayer
    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  />
);

/** Read-only map with a single pin. */
export function EventMap({ latitude, longitude, height = 260 }: { latitude: number; longitude: number; height?: number }) {
  return (
    <Box sx={{ height, borderRadius: '16px', overflow: 'hidden', border: 1, borderColor: 'divider', isolation: 'isolate' }}>
      <MapContainer center={[latitude, longitude]} zoom={15} scrollWheelZoom={false} style={{ height: '100%' }}>
        {tiles}
        <AutoResize />
        <Marker position={[latitude, longitude]} />
      </MapContainer>
    </Box>
  );
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

function Recenter({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.panTo(position);
  }, [map, position]);
  return null;
}

/** Map the user clicks to choose a location. */
export function LocationPicker({
  latitude,
  longitude,
  onChange,
  height = 280,
}: {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
  height?: number;
}) {
  const position: [number, number] | null =
    latitude !== null && longitude !== null ? [latitude, longitude] : null;

  return (
    <Box sx={{ height, borderRadius: '16px', overflow: 'hidden', border: 1, borderColor: 'divider', cursor: 'crosshair', isolation: 'isolate' }}>
      <MapContainer center={position ?? TIMISOARA} zoom={13} style={{ height: '100%' }}>
        {tiles}
        <AutoResize />
        <ClickHandler onPick={(lat, lng) => onChange(Number(lat.toFixed(6)), Number(lng.toFixed(6)))} />
        <Recenter position={position} />
        {position && (
          <Marker
            position={position}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const ll = (e.target as L.Marker).getLatLng();
                onChange(Number(ll.lat.toFixed(6)), Number(ll.lng.toFixed(6)));
              },
            }}
          />
        )}
      </MapContainer>
    </Box>
  );
}
