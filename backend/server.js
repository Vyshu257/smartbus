import express from "express";
import cors from "cors";
import authRoutes from "./src/routes/auth.js";
import buildApiRouter from "./src/routes/api.js";
import { MockBusDataProvider } from "./src/providers/MockBusDataProvider.js";
import { startGpsSimulation } from "./src/simulation/gpsSimulator.js";

const PORT = process.env.PORT || 4000;

// --- Data source -----------------------------------------------------
// Swap this single line for a real, authorized `APSRTCDataProvider` once
// one exists - everything else in the app talks only to the
// LiveBusDataProvider interface, never to mock data directly.
const provider = new MockBusDataProvider();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "smartbus-backend" }));
app.use("/api/auth", authRoutes);
app.use("/api", buildApiRouter(provider));

app.use((req, res) => {
  res.status(404).json({ error: `No such endpoint: ${req.method} ${req.path}` });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Unable to load live bus data. Please try again." });
});

startGpsSimulation();

app.listen(PORT, () => {
  console.log(`SmartBus API (mock data) running on http://localhost:${PORT}`);
  console.log(`Try: http://localhost:${PORT}/api/search?from=Nannur&to=Kurnool`);
});
