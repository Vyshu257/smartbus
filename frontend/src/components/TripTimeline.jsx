const COLUMN_WIDTH = 132; // px per stop column
const DOT_ROW_HEIGHT = 16; // px
const NAME_ROW_HEIGHT = 32; // px
const DOT_CENTER = NAME_ROW_HEIGHT + DOT_ROW_HEIGHT / 2; // px from top of the strip

function formatTime(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

/**
 * Horizontal "Trip Details" strip - one column per stop, a line running
 * through every stop dot, and a bus icon placed between two dots at its
 * live fractional position. Modelled on APSRTC's own Trip Details screen,
 * turned sideways so it reads left-to-right instead of top-to-bottom.
 *
 * @param {{ stops: Array, busPositionIndex: number|null, delayMinutes: number }} props
 */
export default function TripTimeline({ stops, busPositionIndex, delayMinutes = 0 }) {
  if (!stops?.length) return null;

  const totalWidth = COLUMN_WIDTH * stops.length;
  const busLeft =
    busPositionIndex != null ? COLUMN_WIDTH * busPositionIndex + COLUMN_WIDTH / 2 : null;

  return (
    <div className="rounded-xl2 bg-white p-4 shadow-card ring-1 ring-black/5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-display text-base font-semibold">Trip timeline</p>
        {delayMinutes > 0 && (
          <span className="whitespace-nowrap rounded-full bg-warn/10 px-2.5 py-1 text-xs font-semibold text-warn">
            ~{delayMinutes} min behind schedule
          </span>
        )}
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="relative" style={{ width: totalWidth, minWidth: "100%" }}>
          {/* connecting line through every stop dot */}
          <div
            className="absolute bg-black/10"
            style={{
              top: DOT_CENTER - 1,
              left: COLUMN_WIDTH / 2,
              width: totalWidth - COLUMN_WIDTH,
              height: 2,
            }}
          />

          {/* live bus position, between two stops */}
          {busLeft != null && (
            <div
              className="absolute z-10 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full bg-brand-500 text-sm text-white shadow"
              style={{ top: DOT_CENTER - 12, left: busLeft }}
              title="Current position"
            >
              🚌
            </div>
          )}

          <div className="flex">
            {stops.map((stop) => (
              <div key={stop.stopId} className="flex shrink-0 flex-col items-center text-center" style={{ width: COLUMN_WIDTH }}>
                <div className="flex items-center justify-center px-1" style={{ height: NAME_ROW_HEIGHT }}>
                  <p className="line-clamp-2 text-xs font-semibold leading-tight">{stop.stopName}</p>
                </div>
                <div className="flex items-center justify-center" style={{ height: DOT_ROW_HEIGHT }}>
                  <span
                    className={`h-3 w-3 rounded-full border-2 border-white ring-1 ring-black/10 ${
                      stop.isPast ? "bg-brand-700" : "bg-live"
                    }`}
                  />
                </div>
                <p className="mt-2 text-xs text-muted">{formatTime(stop.scheduledTime)}</p>
                <p className="text-xs font-semibold text-danger">{formatTime(stop.actualOrEtaTime)}</p>
                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-brand-600">
                  {stop.status === "LEFT" ? "Left" : "Approximation"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-2 text-xs text-muted">
        Top time is the timetable. Bottom time is the actual departure (past stops) or a live ETA
        (stops ahead) — both are estimates while running on mock GPS data.
      </p>
    </div>
  );
}
