import { useState } from "react";
import { api } from "../api/client.js";

export default function Conductor() {
  const [busNumber, setBusNumber] = useState("");
  const [boardingStop, setBoardingStop] = useState("");
  const [destinationStop, setDestinationStop] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState(null);
  const loggedIn = Boolean(localStorage.getItem("smartbus_token"));

  async function handleIssue(e) {
    e.preventDefault();
    setStatus(null);
    try {
      const trip = await api.trackByBusNumber(busNumber.trim());
      const ticket = await api.issueTicket({
        tripId: trip.tripId,
        boardingStopId: boardingStop,
        destinationStopId: destinationStop,
        quantity: Number(quantity),
      });
      setStatus({ ok: true, message: `Ticket issued for ${quantity} passenger(s) on ${trip.busNumber}.`, ticket });
    } catch (err) {
      setStatus({ ok: false, message: err.message });
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Conductor — issue ticket</h1>
        <p className="mt-1 text-muted">
          Prototype only. This is a simulated ticketing screen, not connected to any real APSRTC
          conductor machine.
        </p>
      </div>

      {!loggedIn && (
        <div className="rounded-xl2 bg-warn/10 p-4 text-sm text-warn">
          Log in with a CONDUCTOR or ADMIN account to issue tickets. Seeded demo login:
          conductor@smartbus.dev / conductor123.
        </div>
      )}

      <form onSubmit={handleIssue} className="space-y-4 rounded-xl2 bg-white p-5 shadow-card ring-1 ring-black/5">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Bus number</span>
          <input
            className="mt-1 w-full rounded-lg border border-black/10 bg-paper px-3 py-2.5 text-base uppercase"
            placeholder="AP21Z0646"
            value={busNumber}
            onChange={(e) => setBusNumber(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Passenger boards (stop id)</span>
          <input
            className="mt-1 w-full rounded-lg border border-black/10 bg-paper px-3 py-2.5 text-base"
            placeholder="stp_nannur"
            value={boardingStop}
            onChange={(e) => setBoardingStop(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Destination (stop id)</span>
          <input
            className="mt-1 w-full rounded-lg border border-black/10 bg-paper px-3 py-2.5 text-base"
            placeholder="stp_kurnool"
            value={destinationStop}
            onChange={(e) => setDestinationStop(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Passengers</span>
          <input
            type="number"
            min="1"
            className="mt-1 w-full rounded-lg border border-black/10 bg-paper px-3 py-2.5 text-base"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </label>

        {status && (
          <p className={`text-sm ${status.ok ? "text-live" : "text-danger"}`}>{status.message}</p>
        )}

        <button
          type="submit"
          disabled={!loggedIn}
          className="w-full rounded-lg bg-brand-500 py-3 text-base font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
        >
          Issue ticket
        </button>
      </form>

      <p className="text-xs text-muted">
        Tip: use the seed stop ids from the backend (stp_kurnool_road, stp_nannur,
        stp_bandi_tandrapadu, stp_orvakal, stp_kurnool) — a production build would replace this
        with a stop picker.
      </p>
    </div>
  );
}
