'use client'

// On-device data-flow for kintsugi's privacy band. Deliberately soft: the
// subject is sensitive, so nothing here is flashy.

export function OnDeviceFlow() {
  return (
    <svg
      viewBox="0 0 900 280"
      className="h-auto w-full"
      role="img"
      aria-label="On-device data: SwiftData, with Keychain, a hashed JSON snapshot, and an optional private GitHub backup."
    >
      <defs>
        <pattern id="ks-flow-grid" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="var(--border)" opacity="0.4" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="900" height="280" fill="url(#ks-flow-grid)" />

      {/* center: SwiftData */}
      <rect x="360" y="110" width="180" height="70" rx="10" fill="var(--bg)" stroke="var(--signal-color,var(--accent))" strokeWidth="1.5" />
      <text x="380" y="145" fill="var(--text)" style={{ fontFamily: 'var(--font-mono)' }} fontSize="14" fontWeight="600">SwiftData</text>
      <text x="380" y="165" fill="var(--text-muted)" style={{ fontFamily: 'var(--font-mono)' }} fontSize="11">on the phone</text>

      {[
        { x: 60, label: 'Keychain', sub: 'survives uninstall' },
        { x: 660, label: 'JSON + SHA256', sub: 'on background' },
      ].map((n) => (
        <g key={n.label}>
          <rect x={n.x} y="110" width="180" height="70" rx="10" fill="var(--bg)" stroke="var(--border-hover)" />
          <text x={n.x + 20} y="145" fill="var(--text)" style={{ fontFamily: 'var(--font-mono)' }} fontSize="13" fontWeight="600">{n.label}</text>
          <text x={n.x + 20} y="165" fill="var(--text-muted)" style={{ fontFamily: 'var(--font-mono)' }} fontSize="10">{n.sub}</text>
        </g>
      ))}
      <line x1="240" y1="145" x2="360" y2="145" stroke="var(--border-hover)" />
      <line x1="540" y1="145" x2="660" y2="145" stroke="var(--border-hover)" />

      {/* optional github below */}
      <rect x="360" y="220" width="180" height="46" rx="10" fill="var(--bg)" stroke="var(--border)" strokeDasharray="4 4" />
      <text x="380" y="248" fill="var(--text-muted)" style={{ fontFamily: 'var(--font-mono)' }} fontSize="11">optional · private repo</text>
      <line x1="450" y1="180" x2="450" y2="220" stroke="var(--border)" strokeDasharray="4 4" />
    </svg>
  )
}
