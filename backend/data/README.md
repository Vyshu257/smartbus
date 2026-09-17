# Loading a real dataset

SmartBus ships with a mock, multi-corridor dataset (see
`../src/data/seedStops.js`, `seedRoutes.js`, `seedBuses.js`) so every page
of the app works out of the box. It is **not** real APSRTC data - there is
no public APSRTC API to source it from, and this project does not scrape
or bypass APSRTC's systems.

If you obtain a real dataset legitimately - an official/authorized feed,
a GTFS export, or timetables you've digitized yourself - drop it in here
as `apsrtc-data.json` and it will be merged into the app at startup,
**in addition to** the seed data (existing ids are never overwritten).

## Format

```json
{
  "stops": [
    { "id": "stp_example", "name": "Example Stop", "lat": 15.83, "lng": 78.04 }
  ],
  "routes": [
    {
      "id": "rt_example",
      "name": "Example - Route - Name",
      "origin": "stp_example",
      "destination": "stp_other",
      "stopIds": ["stp_example", "stp_other"],
      "cumulativeKm": [0, 12.5],
      "scheduledMinutesFromStart": [0, 20]
    }
  ],
  "buses": [
    {
      "tripId": "trip_example",
      "busNumber": "AP00X0000",
      "serviceNumber": "EX1/1",
      "serviceType": "EXPRESS",
      "routeId": "rt_example",
      "capacity": 50,
      "currentKm": 0,
      "status": "NOT_STARTED",
      "updatedAt": null,
      "scheduleDelayMinutes": 0,
      "scheduledStartTime": 1735689600000
    }
  ]
}
```

Notes:
- `stopIds` on a route MUST be in real travel order - that ordering is
  what the filtering engine uses to detect direction and "already
  passed" buses. A route running the opposite way needs its own entry
  with `stopIds` reversed (see `rt_kroad_nannur_kurnool` vs
  `rt_kurnool_nannur_reverse` in the seed data for the pattern).
- `cumulativeKm` and `scheduledMinutesFromStart` must have one entry per
  stop, in the same order as `stopIds`, both starting at `0`.
- `status` is one of `"ACTIVE"`, `"COMPLETED"`, `"NOT_STARTED"`. Only
  `"ACTIVE"` trips get moved by the GPS simulator - if you have a real
  live-position feed instead of the simulator, you'll want a real
  `LiveBusDataProvider` implementation (see
  `../src/providers/LiveBusDataProvider.js`) rather than this import.

## Adding data without editing JSON by hand

You can also add stops/routes/buses one at a time from the Admin
dashboard in the app (log in as an admin, then use the "Add stop / Add
route / Add bus" forms), or in bulk via:

```
POST /api/admin/import
Authorization: Bearer <admin token>
Content-Type: application/json

{ "stops": [...], "routes": [...], "buses": [...] }
```

Anything added this way is written to `runtime-additions.json` next to
this file, so it survives a server restart.
