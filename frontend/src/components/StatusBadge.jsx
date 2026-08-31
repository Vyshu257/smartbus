const STYLES = {
  AT_STOP: "bg-live/10 text-live",
  APPROACHING: "bg-live/10 text-live",
  COMING: "bg-warn/10 text-warn",
  PASSED: "bg-danger/10 text-danger",
  COMPLETED: "bg-danger/10 text-danger",
  NOT_STARTED: "bg-muted/10 text-muted",
  LOCATION_UNAVAILABLE: "bg-muted/10 text-muted",
};

export default function StatusBadge({ status, label }) {
  const style = STYLES[status] || "bg-muted/10 text-muted";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {label}
    </span>
  );
}
