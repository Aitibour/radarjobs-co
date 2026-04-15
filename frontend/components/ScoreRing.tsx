interface ScoreRingProps {
  score: number
  size?: number
  strokeWidth?: number
}

export default function ScoreRing({ score, size = 64, strokeWidth = 6 }: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clampedScore = Math.max(0, Math.min(100, score))
  const offset = circumference - (clampedScore / 100) * circumference

  const color =
    clampedScore >= 80
      ? '#22c55e'
      : clampedScore >= 60
      ? '#f59e0b'
      : '#ef4444'

  const fontSize = size / 4

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={`${clampedScore}% match score`}
      role="img"
    >
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#f3f4f6"
        strokeWidth={strokeWidth}
      />
      {/* Progress ring — starts at top via rotate(-90deg) */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }}
      />
      {/* Score label */}
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={fontSize}
        fontWeight="700"
        fill={color}
        style={{ fontFamily: 'inherit' }}
      >
        {clampedScore}
      </text>
    </svg>
  )
}
