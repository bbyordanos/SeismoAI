import React from 'react';

// ── Color helpers ────────────────────────────────────────────────────────────
export const LEVEL_COLOR = {
  none:     '#5a6e8a',
  mild:     '#ffa502',
  moderate: '#ff4757',
  strong:   '#ff0033',
  low:      '#2ed573',
  high:     '#ff4757',
};

export const RISK_BG = {
  low:      'rgba(46,213,115,0.12)',
  moderate: 'rgba(255,165,2,0.12)',
  high:     'rgba(255,71,87,0.12)',
};

// ── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, color = 'var(--teal)', style = {} }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: '16px 20px',
      ...style,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-mono)', color, letterSpacing: '-1px' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ── Section Header ───────────────────────────────────────────────────────────
export function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 12 }}>
      {children}
    </div>
  );
}

// ── LED Indicator ────────────────────────────────────────────────────────────
export function LED({ on, color, size = 12 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: on ? color : 'var(--surface3)',
      border: `1.5px solid ${on ? color : 'var(--border2)'}`,
      boxShadow: on ? `0 0 10px 2px ${color}` : 'none',
      transition: 'all 0.2s ease',
    }} />
  );
}

// ── Progress Bar ─────────────────────────────────────────────────────────────
export function ProgressBar({ value, max = 100, color = 'var(--teal)', height = 5 }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ background: 'var(--surface3)', borderRadius: 99, height, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.5s ease' }} />
    </div>
  );
}

// ── Axis Bar ─────────────────────────────────────────────────────────────────
export function AxisBar({ label, value, max = 2, color = 'var(--teal)' }) {
  const pct = Math.min((Math.abs(value) / max) * 100, 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)', width: 16 }}>{label}</span>
      <div style={{ flex: 1, background: 'var(--surface3)', borderRadius: 99, height: 5, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.15s ease' }} />
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text)', width: 44, textAlign: 'right' }}>
        {value.toFixed(3)}g
      </span>
    </div>
  );
}

// ── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ label, level = 'mild' }) {
  const colors = { mild: ['rgba(255,165,2,0.15)', '#ffa502'], moderate: ['rgba(255,71,87,0.15)', '#ff4757'], strong: ['rgba(255,0,51,0.15)', '#ff0033'], low: ['rgba(46,213,115,0.15)', '#2ed573'], high: ['rgba(255,71,87,0.15)', '#ff4757'], none: ['rgba(90,110,138,0.15)', '#5a6e8a'] };
  const [bg, fg] = colors[level] || colors.none;
  return (
    <span style={{ background: bg, color: fg, border: `1px solid ${fg}33`, borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', padding: '2px 8px' }}>
      {label}
    </span>
  );
}

// ── Button ───────────────────────────────────────────────────────────────────
export function Btn({ children, onClick, variant = 'primary', disabled, style = {} }) {
  const base = {
    border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-ui)',
    fontSize: 12, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
    padding: '9px 20px', borderRadius: 'var(--radius-sm)', transition: 'all 0.2s', opacity: disabled ? 0.5 : 1,
  };
  const styles = {
    primary: { background: 'var(--teal)', color: '#000' },
    danger:  { background: 'var(--red)',  color: '#fff' },
    ghost:   { background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)' },
    outline: { background: 'transparent', color: 'var(--teal)', border: '1px solid var(--teal)' },
  };
  return (
    <button onClick={!disabled ? onClick : undefined} style={{ ...base, ...styles[variant], ...style }}>
      {children}
    </button>
  );
}

// ── Panel wrapper ────────────────────────────────────────────────────────────
export function Panel({ title, children, style = {}, action }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, ...style }}>
      {title && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <SectionLabel>{title}</SectionLabel>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

// ── Alert Event Item ─────────────────────────────────────────────────────────
export function EventItem({ event, compact }) {
  const color = LEVEL_COLOR[event.level] || 'var(--text3)';
  return (
    <div style={{
      background: 'var(--surface2)', border: '1px solid var(--border)', borderLeft: `3px solid ${color}`,
      borderRadius: 'var(--radius-sm)', padding: compact ? '8px 10px' : '10px 14px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color }}>
          M {event.magnitude.toFixed(1)}
        </span>
        <Badge label={event.level} level={event.level} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{event.location}</div>
      {!compact && (
        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3, fontFamily: 'var(--font-mono)' }}>
          {new Date(event.time).toLocaleString()} · Depth {event.depth}km
        </div>
      )}
    </div>
  );
}
