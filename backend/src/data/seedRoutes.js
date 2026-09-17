// Base seed routes. A "route" is a fixed, ORDERED sequence of stops -
// that order is what lets the filtering engine tell "still to come" from
// "already passed", and forward travel from reverse travel. Each physical
// corridor gets a forward AND a reverse route (separate entries), same as
// a real transit system would model an "up" and "down" service.
//
// See seedStops.js for the same note on this being illustrative/mock
// data, not a real APSRTC feed.

export const routes = [
  // --- Kurnool Road <-> Kurnool ---
  {
    id: "rt_kroad_nannur_kurnool",
    name: "Kurnool Road - Nannur - Kurnool",
    origin: "stp_kurnool_road",
    destination: "stp_kurnool",
    stopIds: ["stp_kurnool_road", "stp_nannur", "stp_bandi_tandrapadu", "stp_orvakal", "stp_kurnool"],
    cumulativeKm: [0, 3.2, 9.8, 16.4, 24.0],
    scheduledMinutesFromStart: [0, 6, 18, 31, 45],
  },
  {
    id: "rt_kurnool_nannur_reverse",
    name: "Kurnool - Nannur - Kurnool Road (reverse)",
    origin: "stp_kurnool",
    destination: "stp_kurnool_road",
    stopIds: ["stp_kurnool", "stp_orvakal", "stp_bandi_tandrapadu", "stp_nannur", "stp_kurnool_road"],
    cumulativeKm: [0, 7.6, 14.2, 20.8, 24.0],
    scheduledMinutesFromStart: [0, 14, 27, 39, 45],
  },

  // --- Kadapa <-> Pulivendla ---
  {
    id: "rt_kadapa_pulivendla",
    name: "Kadapa - Vempalli - Chennuru - Pulivendla",
    origin: "stp_kadapa",
    destination: "stp_pulivendla",
    stopIds: ["stp_kadapa", "stp_vempalli", "stp_chennuru", "stp_pulivendla"],
    cumulativeKm: [0, 14.5, 27.0, 58.0],
    scheduledMinutesFromStart: [0, 22, 42, 80],
  },
  {
    id: "rt_pulivendla_kadapa_reverse",
    name: "Pulivendla - Chennuru - Vempalli - Kadapa (reverse)",
    origin: "stp_pulivendla",
    destination: "stp_kadapa",
    stopIds: ["stp_pulivendla", "stp_chennuru", "stp_vempalli", "stp_kadapa"],
    cumulativeKm: [0, 31.0, 43.5, 58.0],
    scheduledMinutesFromStart: [0, 38, 58, 80],
  },

  // --- Anantapur <-> Dharmavaram ---
  {
    id: "rt_anantapur_dharmavaram",
    name: "Anantapur - Singanamala - Bukkarayasamudram - Dharmavaram",
    origin: "stp_anantapur",
    destination: "stp_dharmavaram",
    stopIds: ["stp_anantapur", "stp_singanamala", "stp_bukkarayasamudram", "stp_dharmavaram"],
    cumulativeKm: [0, 12.0, 20.0, 33.0],
    scheduledMinutesFromStart: [0, 17, 28, 46],
  },
  {
    id: "rt_dharmavaram_anantapur_reverse",
    name: "Dharmavaram - Bukkarayasamudram - Singanamala - Anantapur (reverse)",
    origin: "stp_dharmavaram",
    destination: "stp_anantapur",
    stopIds: ["stp_dharmavaram", "stp_bukkarayasamudram", "stp_singanamala", "stp_anantapur"],
    cumulativeKm: [0, 13.0, 21.0, 33.0],
    scheduledMinutesFromStart: [0, 18, 29, 46],
  },

  // --- Nellore <-> Kavali ---
  {
    id: "rt_nellore_kavali",
    name: "Nellore - Kovur - Allur - Kavali",
    origin: "stp_nellore",
    destination: "stp_kavali",
    stopIds: ["stp_nellore", "stp_kovur", "stp_allur", "stp_kavali"],
    cumulativeKm: [0, 9.0, 32.0, 55.0],
    scheduledMinutesFromStart: [0, 13, 45, 75],
  },
  {
    id: "rt_kavali_nellore_reverse",
    name: "Kavali - Allur - Kovur - Nellore (reverse)",
    origin: "stp_kavali",
    destination: "stp_nellore",
    stopIds: ["stp_kavali", "stp_allur", "stp_kovur", "stp_nellore"],
    cumulativeKm: [0, 23.0, 46.0, 55.0],
    scheduledMinutesFromStart: [0, 30, 62, 75],
  },
];
