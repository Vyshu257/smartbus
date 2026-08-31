// Seed data: physical stops along the Nannur <-> Kurnool corridor.

export const stops = [
  {
    id: "stp_kurnool_road",
    name: "Kurnool Road",
    district: "Kurnool",
    mandal: "Kurnool",
    pincode: "518001",
    state: "AP",
    lat: 15.7550,
    lng: 78.0350,
  },

  {
    id: "stp_nannur",
    name: "Nannur",
    district: "Kurnool",
    mandal: "Kurnool",
    pincode: "518002",
    state: "AP",
    lat: 15.7460,
    lng: 78.0500,
  },

  {
    id: "stp_bandi_tandrapadu",
    name: "Bandi Tandrapadu",
    district: "Kurnool",
    mandal: "Kurnool",
    pincode: "518003",
    state: "AP",
    lat: 15.7700,
    lng: 78.0800,
  },

  {
    id: "stp_orvakal",
    name: "Orvakal",
    district: "Kurnool",
    mandal: "Orvakal",
    pincode: "518216",
    state: "AP",
    lat: 15.7930,
    lng: 78.0950,
  },

  {
    id: "stp_kurnool",
    name: "Kurnool",
    district: "Kurnool",
    mandal: "Kurnool",
    pincode: "518001",
    state: "AP",
    lat: 15.8281,
    lng: 78.0373,
  },
];

export function getStopById(id) {
  return stops.find((s) => s.id === id) || null;
}

export function getStopByName(name) {
  return (
    stops.find(
      (s) => s.name.toLowerCase() === String(name).toLowerCase()
    ) || null
  );
}

// Autocomplete search
export function searchStops(query) {
  const text = String(query || "").trim().toLowerCase();

  if (!text) return [];

  return stops
    .filter((stop) =>
      stop.name.toLowerCase().includes(text)
    )
    .slice(0, 8);
}