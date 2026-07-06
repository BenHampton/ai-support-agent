import styles from './CircuitDecor.module.css'

// Decorative circuit-board traces (inline SVG, no external assets). Rendered on both sides of the hero;
// the right instance is mirrored via CSS (scaleX(-1)). Purely decorative — aria-hidden.
//
// Each trace carries its own dots: `end` sits on the path's final coordinate, and optional `junctions`
// sit on the path's elbow (bend) points. All node coordinates lie exactly on the path, so no dot floats.
type Trace = { d: string; end: [number, number]; junctions?: [number, number][] }

const TRACES: Trace[] = [
  { d: 'M0 55 H50 L80 85 H150', end: [150, 85], junctions: [[80, 85]] },
  { d: 'M0 95 H80 L110 125 H165', end: [165, 125] },
  { d: 'M0 140 H60 L90 170 H130', end: [130, 170], junctions: [[90, 170]] },
  { d: 'M0 185 H100 L130 155 H170', end: [170, 155] },
  { d: 'M0 225 H45 L75 255 H120', end: [120, 255] },
  { d: 'M0 265 H90 L120 235 H165', end: [165, 235], junctions: [[120, 235]] },
  { d: 'M0 305 H55 L85 335 H140', end: [140, 335] },
  { d: 'M0 345 H100 L130 315 H170', end: [170, 315] },
  { d: 'M0 385 H40 L70 415 H115', end: [115, 415], junctions: [[70, 415]] },
  { d: 'M0 425 H95 L125 395 H165', end: [165, 395] },
  { d: 'M0 465 H60 L90 495 H135', end: [135, 495] },
  { d: 'M0 505 H100 L130 475 H170', end: [170, 475], junctions: [[130, 475]] },
  { d: 'M0 545 H45 L75 575 H125', end: [125, 575] },
  { d: 'M0 585 H90 L120 555 H165', end: [165, 555] }
]

export const CircuitDecor = (): JSX.Element => (
  <svg
    className={styles.circuit}
    viewBox="0 0 200 620"
    fill="none"
    preserveAspectRatio="xMinYMid meet"
    aria-hidden="true"
  >
    <g className={styles.circuitLines}>
      {TRACES.map(({ d }) => (
        <path key={d} d={d} />
      ))}
    </g>
    <g className={styles.circuitNodes}>
      {TRACES.map(({ end: [cx, cy] }) => (
        <circle key={`e-${cx}-${cy}`} cx={cx} cy={cy} r="4" />
      ))}
      {TRACES.flatMap(({ junctions = [] }) =>
        junctions.map(([cx, cy]) => <circle key={`j-${cx}-${cy}`} cx={cx} cy={cy} r="3" />)
      )}
    </g>
  </svg>
)
