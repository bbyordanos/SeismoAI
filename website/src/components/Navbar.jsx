import React from 'react';
import { Activity, Database, BarChart2, Bell, Map, Cpu } from 'lucide-react';
import { useClock } from '../hooks/useSeismo';

const NAV_ITEMS = [
  { id:'dashboard',  label:'Dashboard',   Icon:Activity  },
  { id:'map',        label:'Seismic Map', Icon:Map       },
  { id:'data',       label:'Data Center', Icon:Database  },
  { id:'prediction', label:'Prediction',  Icon:BarChart2 },
  { id:'alerts',     label:'Alerts',      Icon:Bell      },
];

// Shows whether the backend is receiving real ESP32 data or not
function ESP32Badge({ wsStatus, lastSeen }) {
  const isLive    = wsStatus === 'open';
  const color     = isLive ? 'var(--green)' : 'var(--text3)';
  const bgColor   = isLive ? 'rgba(46,213,115,0.1)' : 'rgba(90,110,138,0.1)';
  const border    = isLive ? '1px solid rgba(46,213,115,0.3)' : '1px solid rgba(90,110,138,0.3)';
  const label     = isLive ? 'ESP32 Live' : 'No Sensor';

  return (
    <div style={{
      display:'flex', alignItems:'center', gap:5,
      background: bgColor, border, borderRadius:'var(--radius-sm)',
      padding:'3px 9px',
    }}>
      <Cpu size={10} color={color} />
      <div style={{
        width:6, height:6, borderRadius:'50%',
        background: color,
        boxShadow: isLive ? `0 0 6px ${color}` : 'none',
        animation: isLive ? 'pulseDot 2s infinite' : 'none',
      }} />
      <span style={{ fontSize:10, fontWeight:700, color, letterSpacing:'0.5px' }}>{label}</span>
    </div>
  );
}

export default function Navbar({ page, setPage, alertLevel, wsStatus }) {
  const time    = useClock();
  const isAlert = alertLevel === 'moderate' || alertLevel === 'strong';

  return (
    <nav style={{
      background:'var(--surface)', borderBottom:'1px solid var(--border)',
      padding:'0 20px', display:'flex', alignItems:'center',
      height:54, gap:0, position:'sticky', top:0, zIndex:100,
    }}>
      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginRight:24 }}>
        <svg width="24" height="24" viewBox="0 0 26 26" fill="none">
          <polygon points="13,2 24,24 2,24" fill="none" stroke="var(--teal)" strokeWidth="1.8"/>
          <line x1="13" y1="9" x2="13" y2="18" stroke="var(--teal)" strokeWidth="1.5"/>
          <circle cx="13" cy="21" r="1.3" fill="var(--teal)"/>
        </svg>
        <span style={{ fontSize:15, fontWeight:800, letterSpacing:'-0.5px' }}>
          Seismo<span style={{ color:'var(--teal)' }}>AI</span>
        </span>
      </div>

      {/* Nav Items */}
      <div style={{ display:'flex', alignItems:'center', gap:2, flex:1 }}>
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const active = page === id;
          return (
            <button key={id} onClick={() => setPage(id)} style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'6px 12px', borderRadius:'var(--radius-sm)',
              background: active ? 'var(--surface2)' : 'transparent',
              border: active ? '1px solid var(--border2)' : '1px solid transparent',
              color: active ? 'var(--text)' : 'var(--text3)',
              fontSize:12, fontWeight: active ? 700 : 500,
              cursor:'pointer', transition:'all 0.15s', fontFamily:'var(--font-ui)',
            }}>
              <Icon size={13} strokeWidth={active ? 2.5 : 2} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Right-side indicators */}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>

        {/* Seismic alert badge */}
        {isAlert && (
          <div style={{
            display:'flex', alignItems:'center', gap:6,
            background:'rgba(255,71,87,0.12)', border:'1px solid rgba(255,71,87,0.4)',
            borderRadius:'var(--radius-sm)', padding:'4px 10px',
          }}>
            <div style={{
              width:7, height:7, borderRadius:'50%',
              background:'var(--red)', boxShadow:'0 0 8px var(--red)',
              animation:'pulseDot 1s infinite',
            }} />
            <span style={{ fontSize:11, fontWeight:700, color:'var(--red)', letterSpacing:'1px', textTransform:'uppercase' }}>
              {alertLevel === 'strong' ? '⚠ STRONG ACTIVITY' : 'SEISMIC ALERT'}
            </span>
          </div>
        )}

        {/* ESP32 hardware connection badge */}
        <ESP32Badge wsStatus={wsStatus} />

        {/* UTC Clock */}
        <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text3)' }}>
          {time.toISOString().substr(11, 8)} UTC
        </span>
      </div>
    </nav>
  );
}
