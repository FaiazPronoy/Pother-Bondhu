import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

// Rough centre of each area. Posts only store the area, not a street address,
// so a pin marks the neighbourhood rather than the exact spot.
export const AREA_POINTS = {
  Badda: [23.7806, 90.4265],
  Banani: [23.7937, 90.4022],
  Bashundhara: [23.8193, 90.4526],
  Dhanmondi: [23.7465, 90.376],
  Gulshan: [23.7949, 90.4144],
  Khilgaon: [23.752, 90.427],
  Mirpur: [23.8069, 90.3687],
  Moghbazar: [23.749, 90.407],
  Mohammadpur: [23.7662, 90.3589],
  "Puran Dhaka": [23.7104, 90.4074],
  Uttara: [23.8759, 90.3795],
};

const DHAKA = [23.785, 90.4];

// pins: [{ key, at: [lat, lng], color, size, label, onPick }]
export default function AreaMap({ pins, label, className = "" }) {
  const box = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);

  useEffect(() => {
    let gone = false;
    import("leaflet").then(({ default: L }) => {
      if (gone || map.current) return;
      map.current = L.map(box.current, { scrollWheelZoom: false }).setView(DHAKA, 12);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map.current);
      layer.current = L.layerGroup().addTo(map.current);
      draw(L);
    });
    return () => {
      gone = true;
      map.current?.remove();
      map.current = null;
    };
    // the map is made once; pins are redrawn by the effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const draw = (L) => {
    if (!layer.current) return;
    layer.current.clearLayers();
    for (const p of pins) {
      const marker = L.circleMarker(p.at, {
        radius: p.size || 10, color: "#FFF8F0", weight: 2, fillColor: p.color, fillOpacity: 0.9,
      }).bindTooltip(p.label, { direction: "top" });
      if (p.onPick) marker.on("click", p.onPick);
      marker.addTo(layer.current);
    }
    if (pins.length) map.current.fitBounds(L.latLngBounds(pins.map((p) => p.at)).pad(0.2), { maxZoom: 13 });
  };

  useEffect(() => {
    if (map.current) import("leaflet").then(({ default: L }) => draw(L));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins]);

  return <div ref={box} role="region" aria-label={label} className={`area-map rounded-2xl border border-line ${className}`} />;
}
