type ThreatRingProps = {
  value: number; // 0–100
  color: string;
  size?: number;
  strokeWidth?: number;
  label?: string;
};

export default function ThreatRing({
  value,
  color,
  size = 56,
  strokeWidth = 5,
  label,
}: ThreatRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const center = size / 2;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label ?? "Threat score"}: ${clamped}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span
        className="absolute font-display font-semibold"
        style={{ color, fontSize: size * 0.32 }}
      >
        {clamped}
      </span>
    </div>
  );
}
