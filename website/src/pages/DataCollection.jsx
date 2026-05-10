import React, { useState, useEffect, useRef } from 'react';
import {
  ScatterChart, Scatter, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Play, Square, Download, Trash2, Upload } from 'lucide-react';
import { Panel, SectionLabel, Btn, Badge, StatCard } from '../components/UI';
import { HISTORICAL_DATA } from '../hooks/useSeismo';

export default function DataPage({ readings, waveHistory }) {
  const [recording, setRecording] = useState(false);
  const [samples, setSamples] = useState(HISTORICAL_DATA.slice(0, 80));
  const [labelMode, setLabelMode] = useState('auto');
  const [filter, setFilter] = useState('all');
  const bufRef = useRef([]);

  useEffect(() => {
    if (!recording) return;
    const sample = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      x: readings.x,
      y: readings.y,
      z: readings.z,
      magnitude: readings.magnitude,
      label: labelMode === 'auto' ? (readings.magnitude > 0.15 ? 1 : 0) : (labelMode === 'quake' ? 1 : 0),
    };
    bufRef.current.push(sample);
    if (bufRef.current.length >= 5) {
      setSamples(prev => [...prev, ...bufRef.current].slice(-500));
      bufRef.current = [];
    }
  }, [readings, recording, labelMode]);

  const quakeCount  = samples.filter(s => s.label === 1).length;
  const noiseCount  = samples.filter(s => s.label === 0).length;
  const filtered    = filter === 'all' ? samples : samples.filter(s => s.label === (filter === 'quake' ? 1 : 0));
  const scatterData = samples.slice(-200).map(s => ({ x: s.x, y: s.y, label: s.label }));

  const exportCSV = () => {
    const header = 'timestamp,x,y,z,magnitude,label';
    const rows = samples.map(s => `${s.timestamp},${s.x},${s.y},${s.z},${s.magnitude},${s.label}`);
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'seismoai_data.csv'; a.click();
  };

  const clearData = () => { if (window.confirm('Clear all collected data?')) setSamples([]); };

  const recentLine = samples.slice(-60).map((s, i) => ({ i, mag: s.magnitude, label: s.label }));

  return (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        <StatCard label="Total Samples"   value={samples.length}  sub="Collected"          color="var(--teal)"  />
        <StatCard label="Seismic Events"  value={quakeCount}       sub="Labeled as quake"   color="var(--red)"   />
        <StatCard label="Background Noise" value={noiseCount}      sub="Labeled as noise"   color="var(--text2)" />
        <StatCard label="Dataset Balance" value={`${quakeCount ? Math.round(quakeCount/samples.length*100) : 0}%`} sub="Quake ratio" color="var(--amber)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, alignItems: 'start' }}>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <Panel title="Recording Controls">
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn variant={recording ? 'danger' : 'primary'} onClick={() => setRecording(r => !r)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {recording ? <><Square size={12} /> Stop</> : <><Play size={12} /> Start Recording</>}
              </Btn>
            </div>
            {recording && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.3)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)', boxShadow: '0 0 6px var(--red)', animation: 'pulseDot 1s infinite' }} />
                <span style={{ fontSize: 12, color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>Recording live data...</span>
              </div>
            )}
          </Panel>

          <Panel title="Label Mode">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { id: 'auto',  label: 'Auto-label',    sub: 'Threshold-based (>0.15g = quake)' },
                { id: 'quake', label: 'Force: Quake',  sub: 'Mark all new samples as quake'    },
                { id: 'noise', label: 'Force: Noise',  sub: 'Mark all new samples as noise'    },
              ].map(opt => (
                <button key={opt.id} onClick={() => setLabelMode(opt.id)} style={{
                  background: labelMode === opt.id ? 'var(--surface3)' : 'var(--surface2)',
                  border: `1px solid ${labelMode === opt.id ? 'var(--teal)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)', padding: '9px 12px', cursor: 'pointer', textAlign: 'left',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: labelMode === opt.id ? 'var(--teal)' : 'var(--text)' }}>{opt.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{opt.sub}</div>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Data Actions">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Btn variant="outline" onClick={exportCSV}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Download size={12} /> Export CSV
              </Btn>
              <Btn variant="ghost" onClick={clearData}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Trash2 size={12} /> Clear Data
              </Btn>
            </div>
            <div style={{ padding: '10px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 11, color: 'var(--text3)', lineHeight: 1.7 }}>
              <strong style={{ color: 'var(--text2)' }}>ESP32 Integration:</strong><br/>
              POST sensor data to <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--teal)', background: 'var(--surface3)', padding: '1px 5px', borderRadius: 3 }}>/api/ingest</code><br/>
              Fields: x, y, z, timestamp
            </div>
          </Panel>

          {/* Current reading */}
          <Panel title="Live Sensor Feed">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {['x','y','z'].map((ax, i) => (
                <div key={ax} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3 }}>Axis {ax.toUpperCase()}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: ['var(--teal)','var(--blue)','var(--amber)'][i] }}>
                    {readings[ax].toFixed(3)}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text3)' }}>g</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Magnitude timeline */}
          <Panel title="Collected Magnitude Timeline" action={
            <div style={{ display: 'flex', gap: 6 }}>
              {['all','quake','noise'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase',
                  padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--font-ui)',
                  background: filter === f ? 'var(--teal)' : 'var(--surface2)',
                  color: filter === f ? '#000' : 'var(--text3)',
                  border: `1px solid ${filter === f ? 'var(--teal)' : 'var(--border)'}`,
                }}>{f}</button>
              ))}
            </div>
          }>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={recentLine} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,45,69,0.8)" />
                <XAxis dataKey="i" tick={{ fill: '#5a6e8a', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#5a6e8a', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0,'auto']} />
                <Tooltip contentStyle={{ background: '#162035', border: '1px solid #1e2d45', borderRadius: 8, fontSize: 11 }} />
                <ReferenceLine y={0.15} stroke="rgba(255,165,2,0.5)" strokeDasharray="4 4" label={{ value: 'threshold', fill: '#ffa502', fontSize: 9 }} />
                <Line type="monotone" dataKey="mag" stroke="#00e5c3" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Panel>

          {/* X vs Y scatter */}
          <Panel title="X vs Y Acceleration Scatter — Label Distribution">
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,45,69,0.8)" />
                <XAxis type="number" dataKey="x" name="X-axis" tick={{ fill: '#5a6e8a', fontSize: 10 }} label={{ value: 'X (g)', position: 'insideBottom', offset: -2, fill: '#5a6e8a', fontSize: 10 }} />
                <YAxis type="number" dataKey="y" name="Y-axis" tick={{ fill: '#5a6e8a', fontSize: 10 }} label={{ value: 'Y (g)', angle: -90, position: 'insideLeft', fill: '#5a6e8a', fontSize: 10 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: '#162035', border: '1px solid #1e2d45', borderRadius: 8, fontSize: 11 }} />
                <Scatter name="Noise" data={scatterData.filter(d => d.label === 0)} fill="#00e5c3" fillOpacity={0.5} r={3} />
                <Scatter name="Quake" data={scatterData.filter(d => d.label === 1)} fill="#ff4757" fillOpacity={0.7} r={4} />
              </ScatterChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text3)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#00e5c3', display: 'inline-block' }}/> Noise ({noiseCount})</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#ff4757', display: 'inline-block' }}/> Quake ({quakeCount})</span>
            </div>
          </Panel>

          {/* Sample table */}
          <Panel title={`Recent Samples (${filtered.length})`}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['#', 'Timestamp', 'X (g)', 'Y (g)', 'Z (g)', 'Magnitude', 'Label'].map(h => (
                      <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: 'var(--text3)', fontWeight: 700, fontSize: 10, letterSpacing: '0.8px', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(-12).reverse().map((s, i) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border)', opacity: i === 0 ? 1 : 0.8 }}>
                      <td style={{ padding: '5px 10px', color: 'var(--text3)' }}>{s.id.toString().slice(-4)}</td>
                      <td style={{ padding: '5px 10px', color: 'var(--text2)' }}>{new Date(s.timestamp).toLocaleTimeString()}</td>
                      <td style={{ padding: '5px 10px', color: 'var(--teal)' }}>{s.x.toFixed(4)}</td>
                      <td style={{ padding: '5px 10px', color: '#1e90ff' }}>{s.y.toFixed(4)}</td>
                      <td style={{ padding: '5px 10px', color: 'var(--amber)' }}>{s.z.toFixed(4)}</td>
                      <td style={{ padding: '5px 10px', color: s.magnitude > 0.15 ? 'var(--red)' : 'var(--text)' }}>{s.magnitude.toFixed(4)}</td>
                      <td style={{ padding: '5px 10px' }}><Badge label={s.label === 1 ? 'quake' : 'noise'} level={s.label === 1 ? 'high' : 'none'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
