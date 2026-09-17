// Base seed data: stops across several illustrative corridors.
//
// IMPORTANT: none of this is real APSRTC data - there is no public APSRTC
// API to source it from, and this project deliberately does not scrape or
// bypass APSRTC's systems (see backend/README.md). This is a big enough
// mock network to prove the app works at multi-route scale. To run this
// on real data, see backend/data/README.md for the import format - drop
// a real, legitimately-sourced dataset into backend/data/apsrtc-data.json
// and it merges into this at startup.

export const stops = [
  // --- Kurnool Road <-> Kurnool corridor ---
  { id: "stp_kurnool_road", name: "Kurnool Road", lat: 15.7550, lng: 78.0350 },
  { id: "stp_nannur", name: "Nannur", lat: 15.7460, lng: 78.0500 },
  { id: "stp_bandi_tandrapadu", name: "Bandi Tandrapadu", lat: 15.7700, lng: 78.0800 },
  { id: "stp_orvakal", name: "Orvakal", lat: 15.7930, lng: 78.0950 },
  { id: "stp_kurnool", name: "Kurnool", lat: 15.8281, lng: 78.0373 },

  // --- Kadapa <-> Pulivendla corridor ---
  { id: "stp_kadapa", name: "Kadapa", lat: 14.4673, lng: 78.8242 },
  { id: "stp_vempalli", name: "Vempalli", lat: 14.3706, lng: 78.7020 },
  { id: "stp_chennuru", name: "Chennuru", lat: 14.3200, lng: 78.5900 },
  { id: "stp_pulivendla", name: "Pulivendla", lat: 14.4212, lng: 78.2247 },

  // --- Anantapur <-> Dharmavaram corridor ---
  { id: "stp_anantapur", name: "Anantapur", lat: 14.6819, lng: 77.6006 },
  { id: "stp_singanamala", name: "Singanamala", lat: 14.6100, lng: 77.7300 },
  { id: "stp_bukkarayasamudram", name: "Bukkarayasamudram", lat: 14.5800, lng: 77.7800 },
  { id: "stp_dharmavaram", name: "Dharmavaram", lat: 14.4144, lng: 77.7181 },

  // --- Nellore <-> Kavali corridor ---
  { id: "stp_nellore", name: "Nellore", lat: 14.4426, lng: 79.9865 },
  { id: "stp_kovur", name: "Kovur", lat: 14.5200, lng: 79.9500 },
  { id: "stp_allur", name: "Allur", lat: 14.6900, lng: 79.9200 },
  { id: "stp_kavali", name: "Kavali", lat: 14.9139, lng: 79.9947 },
];
