import React, { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Wifi, Cpu, Zap, TrendingUp } from 'lucide-react';
import WaveformCanvas from '../components/WaveformCanvas';
import { StatCard, Panel, SectionLabel, AxisBar, LED, EventItem, Badge, LEVEL_COLOR } from '../components/UI';

const WEEK_DATA = [
  { day: 'Mon', events: 2, maxMag: 2.1 },
  { day: 'Tue', events: 1, maxMag: 1.8 },
  { day: 'Wed', events: 3, maxMag: 3.1 },
  { day: 'Thu', events: 4, maxMag: 3.6 },
  { day: 'Fri', events: 1, maxMag: 1.5 },
  { day: 'Sat', events: 2, maxMag: 2.4 },
  { day: 'Sun', events: 1, maxMag: 1.9 },
];

const MAG_DIST = [
  { name: 'M1–2', value: 6, color: '#00e5c3' },
  { name: 'M2–3', value: 5, color: '#ffa502' },
  { name: 'M3–4', value: 2, color: '#ff4757' },
  { name: 'M4+',  value: 1, color: '#ff0033' },
];

export default function DashboardPage({ readings, waveHistory, alertLevel, events }) {
  const ledActive = { mild: [true,false,false], moderate: [true,true,false], strong: [true,true,true], none: [false,false,false] };
  const leds = ledActive[alertLevel] || [false,false,false];
  const ledColors = ['#ffa502', '#ff4757', '#ff0033'];
  const levelColor = LEVEL_COLOR[alertLevel] || 'var(--text3)';

  const recentEvents = events.slice(0, 6);

  const hourlyData = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => ({
      hour: `${String(i).padStart(2,'0')}:00`,
      pga: parseFloat((Math.random() * 0.15 + 0.01).toFixed(3)),
    })), []);

  return (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatCard label="Current Intensity" value={`${readings.magnitude.toFixed(3)}g`} sub="Peak acceleration" color="var(--teal)" />
        <StatCard label="Events (7 days)"    value="14"  sub="+3 from last week"    color="var(--amber)" />
        <StatCard label="Max Magnitude"      value="3.6" sub="Last 24 hours"        color="var(--red)" />
        <StatCard label="Telegram Alerts"    value="6"   sub="Sent today"           color="var(--green)" />
      </div>

      {/* Main content grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, alignItems: 'start' }}>

        {/* Left sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Device status */}
          <Panel title="Device Status">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: Cpu,  label: 'ESP32 MCU',       ok: true  },
                { icon: Wifi, label: 'WiFi / Telegram',  ok: true  },
                { icon: Zap,  label: 'ADXL335 Sensor',   ok: true  },
              ].map(({ icon: Icon, label, ok }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon size={14} color="var(--text3)" />
                    <span style={{ fontSize: 12, color: 'var(--text2)' }}>{label}</span>
                  </div>
                  <Badge label={ok ? 'Online' : 'Offline'} level={ok ? 'low' : 'high'} />
                </div>
              ))}
            </div>
          </Panel>

          {/* Sensor axes */}
          <Panel title="ADXL335 Readings">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <AxisBar label="X" value={readings.x} color="var(--teal)" />
              <AxisBar label="Y" value={readings.y} color="var(--blue)" />
              <AxisBar label="Z" value={readings.z} max={1.5} color="var(--amber)" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>Sample rate</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--teal)' }}>200 Hz</span>
            </div>
          </Panel>

          {/* LED alert panel */}
          <Panel title="LED Alert Status">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {leds.map((on, i) => (
                <LED key={i} on={on} color={ledColors[i]} size={16} />
              ))}
              <span style={{ fontSize: 12, fontWeight: 700, color: levelColor, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                {alertLevel === 'none' ? 'No activity' : alertLevel}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>
              1 LED = Mild · 2 LEDs = Moderate · 3 LEDs = Strong
            </div>
          </Panel>

          {/* Recent events list */}
          <Panel title="Recent Events" style={{ gap: 8 }}>
            {recentEvents.slice(0, 4).map(e => <EventItem key={e.id} event={e} compact />)}
          </Panel>
        </div>

        {/* Right charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Live waveform */}
          <Panel title="Live Seismic Waveform — ADXL335">
            <WaveformCanvas data={waveHistory} alertLevel={alertLevel} height={150} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
              <span>STA/LTA: {readings.magnitude > 0.3 ? (readings.magnitude * 4.2).toFixed(2) : '0.91'}</span>
              <span>PGA: {readings.magnitude.toFixed(4)} g</span>
              <span>Status: <span style={{ color: levelColor }}>{alertLevel === 'none' ? 'QUIET' : alertLevel.toUpperCase()}</span></span>
            </div>
          </Panel>

          {/* Two-col charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Panel title="Event Frequency — 7 Days">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={WEEK_DATA} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,45,69,0.8)" />
                  <XAxis dataKey="day" tick={{ fill: '#5a6e8a', fontSize: 11, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#5a6e8a', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#162035', border: '1px solid #1e2d45', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#9aafc8' }} itemStyle={{ color: '#00e5c3' }} />
                  <Bar dataKey="events" fill="#00e5c3" fillOpacity={0.7} radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Panel>

            <Panel title="Magnitude Distribution">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={MAG_DIST} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {MAG_DIST.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.8} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#162035', border: '1px solid #1e2d45', borderRadius: 8, fontSize: 12 }} />
                  <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 11, color: '#5a6e8a' }} />
                </PieChart>
              </ResponsiveContainer>
            </Panel>
          </div>

          {/* 24h PGA timeline */}
          <Panel title="24-Hour PGA Timeline" action={<span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>Peak Ground Acceleration</span>}>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={hourlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="pgaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00e5c3" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00e5c3" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,45,69,0.8)" />
                <XAxis dataKey="hour" tick={{ fill: '#5a6e8a', fontSize: 9, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} interval={5} />
                <YAxis tick={{ fill: '#5a6e8a', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#162035', border: '1px solid #1e2d45', borderRadius: 8, fontSize: 11 }} />
                <Area type="monotone" dataKey="pga" stroke="#00e5c3" strokeWidth={1.5} fill="url(#pgaGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      </div>
    </div>
  );
}
