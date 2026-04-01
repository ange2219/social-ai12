'use client'

const ICON = 20

function Instagram() {
  return (
    <svg width={ICON} height={ICON} viewBox="0 0 20 20" fill="none">
      <rect width="20" height="20" rx="5" fill="#E1306C"/>
      <rect x="5" y="5" width="10" height="10" rx="3" stroke="white" strokeWidth="1.4" fill="none"/>
      <circle cx="10" cy="10" r="2.4" stroke="white" strokeWidth="1.4" fill="none"/>
      <circle cx="14.2" cy="5.8" r="0.9" fill="white"/>
    </svg>
  )
}

function Facebook() {
  return (
    <svg width={ICON} height={ICON} viewBox="0 0 20 20" fill="none">
      <rect width="20" height="20" rx="5" fill="#1877F2"/>
      <path d="M11.2 15v-4.2h1.4l.2-1.8h-1.6V7.9c0-.5.1-.8.8-.8h.9V5.3c-.3 0-.9-.1-1.6-.1-1.5 0-2.5.9-2.5 2.6V9H7v1.8h1.8V15h2.4z" fill="white"/>
    </svg>
  )
}

function XTwitter() {
  return (
    <svg width={ICON} height={ICON} viewBox="0 0 20 20" fill="none">
      <rect width="20" height="20" rx="5" fill="#0F0F0F"/>
      <path d="M11.6 9.2L15.5 5h-1L11 8.5 8.3 5H5l4.1 5.8L5 15h1l3.6-4.2L12.8 15H16l-4.4-5.8z" fill="white"/>
    </svg>
  )
}

function LinkedIn() {
  return (
    <svg width={ICON} height={ICON} viewBox="0 0 20 20" fill="none">
      <rect width="20" height="20" rx="5" fill="#0A66C2"/>
      <path d="M6.8 8.5H5v6.5h1.8V8.5zm-.9-2.8a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM15 11.4c0-1.9-1-3-2.6-3-.8 0-1.5.4-1.9 1V8.5H8.7V15h1.8v-3.3c0-.8.4-1.5 1.2-1.5.8 0 1.2.5 1.2 1.5V15H15v-3.6z" fill="white"/>
    </svg>
  )
}

function TikTok() {
  return (
    <svg width={ICON} height={ICON} viewBox="0 0 20 20" fill="none">
      <rect width="20" height="20" rx="5" fill="#010101"/>
      <path d="M13.8 5.5c-1.1 0-1.9-.6-2.3-1.5H9.6V13c0 .9-.7 1.5-1.5 1.5s-1.5-.6-1.5-1.5.7-1.5 1.5-1.5V9.6c-2 0-3.5 1.5-3.5 3.4 0 1.9 1.5 3.4 3.5 3.4 1.9 0 3.4-1.5 3.4-3.4V8.4c.7.4 1.5.6 2.3.6V7.2c-.1 0-.3-1.1 0-1.7z" fill="white"/>
    </svg>
  )
}

function OrbitIcon({
  children,
  radius,
  duration,
  delay,
  direction,
}: {
  children: React.ReactNode
  radius: number
  duration: number
  delay: number
  direction: 'cw' | 'ccw'
}) {
  const orbit = direction === 'cw' ? 'logo-cw' : 'logo-ccw'
  const counter = direction === 'cw' ? 'logo-ccw' : 'logo-cw'

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: 0,
      height: 0,
      transformOrigin: '0 0',
      animation: `${orbit} ${duration}s linear ${delay}s infinite`,
    }}>
      <div style={{
        position: 'absolute',
        top: -(radius + ICON / 2),
        left: -(ICON / 2),
        transformOrigin: `${ICON / 2}px ${ICON / 2}px`,
        animation: `${counter} ${duration}s linear ${delay}s infinite`,
      }}>
        {children}
      </div>
    </div>
  )
}

export function LogoAnimation({ size = 160 }: { size?: number }) {
  const rOuter = size * 0.375   // 60 at size=160
  const rInner = size * 0.2375  // 38 at size=160
  const center = size * 0.265   // chat bubble size ~42

  return (
    <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
      <style>{`
        @keyframes logo-cw  { to { transform: rotate( 360deg); } }
        @keyframes logo-ccw { to { transform: rotate(-360deg); } }
      `}</style>

      {/* Orbit rings */}
      <svg
        width={size}
        height={size}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      >
        <circle
          cx={size / 2} cy={size / 2} r={rOuter}
          fill="none" stroke="rgba(59,123,246,0.18)" strokeWidth="1"
          strokeDasharray="5 5"
        />
        <circle
          cx={size / 2} cy={size / 2} r={rInner}
          fill="none" stroke="rgba(59,123,246,0.12)" strokeWidth="1"
          strokeDasharray="3 4"
        />
      </svg>

      {/* Center: chat bubble */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: center, height: center,
        background: '#3B7BF6',
        borderRadius: Math.round(center * 0.28),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 20px rgba(59,123,246,0.45)',
      }}>
        <svg
          width={center * 0.58}
          height={center * 0.58}
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M18 13a2 2 0 0 1-2 2H6l-4 4V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8z"
            fill="white"
            fillOpacity=".95"
          />
        </svg>
      </div>

      {/* Outer orbit — CW 14s: Instagram (0°), X (120°), TikTok (240°) */}
      <OrbitIcon radius={rOuter} duration={14} delay={0}                    direction="cw"><Instagram /></OrbitIcon>
      <OrbitIcon radius={rOuter} duration={14} delay={-(14 / 3)}            direction="cw"><XTwitter /></OrbitIcon>
      <OrbitIcon radius={rOuter} duration={14} delay={-(14 * 2 / 3)}        direction="cw"><TikTok /></OrbitIcon>

      {/* Inner orbit — CCW 10s: Facebook (0°), LinkedIn (180°) */}
      <OrbitIcon radius={rInner} duration={10} delay={0}                    direction="ccw"><Facebook /></OrbitIcon>
      <OrbitIcon radius={rInner} duration={10} delay={-5}                   direction="ccw"><LinkedIn /></OrbitIcon>
    </div>
  )
}
