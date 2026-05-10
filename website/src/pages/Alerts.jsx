import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';
import { Bell, BellOff, Send, Filter, MapPin, Clock, Layers } from 'lucide-react';
import { Panel, StatCard, Badge, Btn, SectionLabel, EventItem, LEVEL_COLOR } from '../components/UI';

const TELEGRAM_LOG = [
  { id:1, time:'04:12:33', msg:'🔴 ALERT: M2.1 mild earthquake detected! Location: Awash Valley. Stay alert.', sent:true },
  { id:2, time:'01:55:08', msg:'🚨 ALERT: M3.6 moderate earthquake detected! Location: Lake Turkana. Take cover!', sent:true },
  { id:3, time:'Yesterday', msg:'⚠️ ALERT: M1.8 mild earthquake detected. Location: Addis Ababa Basin.', sent:true },
  { id:4, time:'2 days ago', msg:'🚨 ALERT: M4.1 moderate earthquake! Depth: 15.3km. Region: Central Rift Valley.', sent:true },
];

const MONTHLY = [
  { month: 'Aug', events: 8, maxMag: 3.1 },
  { month: 'Sep', events: 12, maxMag: 4.2 },
  { month: 'Oct', events: 7, maxMag: 2.8 },
  { month: 'Nov', events: 15, maxMag: 4.5 },
  { month: 'Dec', events: 9, maxMag: 3.3 },
  { month: 'Jan', events: 14, maxMag: 3.6 },
];

export default function AlertsPage({ events }) {
  const [telegramEnabled, setTelegramEnabled] = useState(true);
  const [threshold, setThreshold] = useState('1.5');
  const [filterLevel, setFilterLevel] = useState('all');
  const [testMsg, setTestMsg] = useState('');

  const filtered = filterLevel === 'all' ? events : events.filter(e => e.level === filterLevel);

  const mild     = events.filter(e => e.level === 'mild').length;
  const moderate = events.filter(e => e.level === 'moderate').length;
  const strong   = events.filter(e => e.level === 'strong').length;

  const sendTest = () => {
    setTestMsg('✓ Test message sent to Telegram!');
    setTimeout(() => setTestMsg(''), 3000);
  };

  return (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        <StatCard label="Total Events"      value={events.length} sub="All time"        color="var(--teal)"  />
        <StatCard label="Mild"              value={mild}          sub="M < 3.0"         color="var(--amber)" />
        <StatCard label="Moderate"          value={moderate}      sub="M 3.0 – 4.5"     color="var(--red)"   />
        <StatCard label="Strong / Severe"   value={strong}        sub="M > 4.5"         color="#ff0033"      />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, alignItems: 'start' }}>

        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Telegram config */}
          <Panel title="Telegram Notifications">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Send size={14} color={telegramEnabled ? 'var(--teal)' : 'var(--text3)'} />
                <span style={{ fontSize: 12, color: telegramEnabled ? 'var(--text)' : 'var(--text3)' }}>Telegram Bot</span>
              </div>
              <button onClick={() => setTelegramEnabled(t => !t)} style={{
                width: 40, height: 22, borderRadius: 99, border: 'none', cursor: 'pointer',
                background: telegramEnabled ? 'var(--teal)' : 'var(--surface3)',
                position: 'relative', transition: 'background 0.2s',
              }}>
                <span style={{
                  position: 'absolute', top: 3, left: telegramEnabled ? 20 : 3,
                  width: 16, height: 16, borderRadius: '50%', background: '#fff',
                  transition: 'left 0.2s',
                }} />
              </button>
            </div>

            <div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>Alert Threshold (min magnitude)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
                {['1.0','1.5','2.0','3.0'].map(v => (
                  <button key={v} onClick={() => setThreshold(v)} style={{
                    padding: '7px 0', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
                    background: threshold === v ? 'var(--teal)' : 'var(--surface2)',
                    color: threshold === v ? '#000' : 'var(--text3)',
                    border: `1px solid ${threshold === v ? 'var(--teal)' : 'var(--border)'}`,
                    transition: 'all 0.15s',
                  }}>M{v}</button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>Bot Token</div>
              <input defaultValue="7xxx...YAA" style={{
                width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '7px 10px', color: 'var(--text)', fontSize: 12,
                fontFamily: 'var(--font-mono)', outline: 'none',
              }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>Chat ID</div>
              <input defaultValue="-100xxxx" style={{
                width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '7px 10px', color: 'var(--text)', fontSize: 12,
                fontFamily: 'var(--font-mono)', outline: 'none',
              }} />
            </div>

            <Btn variant="ghost" onClick={sendTest} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Send size={12} /> Send Test Alert
            </Btn>
            {testMsg && (
              <div style={{ fontSize: 12, color: 'var(--green)', padding: '7px 10px', background: 'rgba(46,213,115,0.1)', border: '1px solid rgba(46,213,115,0.3)', borderRadius: 'var(--radius-sm)' }}>
                {testMsg}
              </div>
            )}
          </Panel>

          {/* Telegram message log */}
          <Panel title="Telegram Message Log">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {TELEGRAM_LOG.map(m => (
                <div key={m.id} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)' }}>{m.time}</span>
                    <Badge label="Sent" level="low" />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.5 }}>{m.msg}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Monthly chart */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Panel title="Monthly Event Count">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={MONTHLY} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,45,69,0.8)" />
                  <XAxis dataKey="month" tick={{ fill: '#5a6e8a', fontSize: 11, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#5a6e8a', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#162035', border: '1px solid #1e2d45', borderRadius: 8, fontSize: 11 }} />
                  <Bar dataKey="events" radius={[3,3,0,0]}>
                    {MONTHLY.map((m, i) => <Cell key={i} fill="#00e5c3" fillOpacity={0.6 + i * 0.07} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Panel>

            <Panel title="Max Monthly Magnitude">
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={MONTHLY} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="magGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#ff4757" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ff4757" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,45,69,0.8)" />
                  <XAxis dataKey="month" tick={{ fill: '#5a6e8a', fontSize: 11, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#5a6e8a', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 6]} />
                  <Tooltip contentStyle={{ background: '#162035', border: '1px solid #1e2d45', borderRadius: 8, fontSize: 11 }} />
                  <Area type="monotone" dataKey="maxMag" stroke="#ff4757" strokeWidth={2} fill="url(#magGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </Panel>
          </div>

          {/* Event list */}
          <Panel title="Event Log" action={
            <div style={{ display: 'flex', gap: 6 }}>
              {['all','mild','moderate','strong'].map(f => (
                <button key={f} onClick={() => setFilterLevel(f)} style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase',
                  padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--font-ui)',
                  background: filterLevel === f ? 'var(--teal)' : 'var(--surface2)',
                  color: filterLevel === f ? '#000' : 'var(--text3)',
                  border: `1px solid ${filterLevel === f ? 'var(--teal)' : 'var(--border)'}`,
                }}>{f}</button>
              ))}
            </div>
          }>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto' }}>
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text3)', fontSize: 13 }}>No events yet</div>
              ) : filtered.map(e => (
                <div key={e.id} style={{ background: 'var(--surface2)', border: `1px solid var(--border)`, borderLeft: `3px solid ${LEVEL_COLOR[e.level] || 'var(--text3)'}`, borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: LEVEL_COLOR[e.level] }}>M {e.magnitude.toFixed(1)}</span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Badge label={e.level} level={e.level} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)' }}>
                        {new Date(e.time).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 20, fontSize: 11, color: 'var(--text3)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11}/> {e.location}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Layers size={11}/> {e.depth}km depth</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>{e.lat}°N, {e.lon}°E</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
