import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";

// Default Leaflet marker icons reference image files that Vite won't
// resolve automatically - point them at the CDN copies instead.
const busIcon = new L.DivIcon({
  className: "",
  html: `<div style="font-size:22px;line-height:1;transform:translate(-50%,-100%)">🚌</div>`,
  iconSize: [24, 24],
});
const stopIcon = new L.DivIcon({
  className: "",
  html: `<div style="font-size:18px;line-height:1;transform:translate(-50%,-100%)">📍</div>`,
  iconSize: [18, 18],
});

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) {
      map.fitBounds(points, { padding: [40, 40] });
    } else if (points.length === 1) {
      map.setView(points[0], 13);
    }
  }, [JSON.stringify(points)]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/**
 * @param {{ busPosition?: {lat:number,lng:number}, boardingStop?: {lat:number,lng:number,name:string}, destinationStop?: {lat:number,lng:number,name:string}, routeStops?: Array<{lat:number,lng:number,name:string}>, busLabel?: string }} props
 */
export default function MapView({ busPosition, boardingStop, destinationStop, routeStops = [], busLabel }) {
  const points = [
    ...(routeStops.length ? routeStops : [boardingStop, destinationStop].filter(Boolean)),
  ].map((s) => [s.lat, s.lng]);

  return (
    <MapContainer center={points[0] || [15.78, 78.05]} zoom={12} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {routeStops.length > 1 && (
        <Polyline positions={routeStops.map((s) => [s.lat, s.lng])} pathOptions={{ color: "#1f4fb8", weight: 3, opacity: 0.6 }} />
      )}

      {boardingStop && (
        <Marker position={[boardingStop.lat, boardingStop.lng]} icon={stopIcon}>
          <Popup>Boarding: {boardingStop.name}</Popup>
        </Marker>
      )}

      {destinationStop && (
        <Marker position={[destinationStop.lat, destinationStop.lng]} icon={stopIcon}>
          <Popup>Destination: {destinationStop.name}</Popup>
        </Marker>
      )}

      {busPosition && (
        <Marker position={[busPosition.lat, busPosition.lng]} icon={busIcon}>
          <Popup>{busLabel || "Bus"}</Popup>
        </Marker>
      )}

      <FitBounds points={points} />
    </MapContainer>
  );
}
