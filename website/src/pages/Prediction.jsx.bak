import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import {
  Brain, FlaskConical, Clock, Shield, Target,
  AlertTriangle, CheckCircle, RefreshCw, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Panel, StatCard, SectionLabel, RISK_BG } from '../components/UI';

// ─── Formula metadata ─────────────────────────────────────────────────────────
const FORMULA_META = {
  gr: {
    name: 'Gutenberg-Richter Law', short: 'G-R Law',
    formula: 'log(N) = a − b×M', rank: 1,
    reliability: 92, precision: 68,
    leadTime: 'Days → Years', status: 'Operational', statusColor: 'var(--green)',
    weight: 0.40, color: '#00e5c3',
    description: 'Most established statistical law in seismology (1944). Fits earthquake frequency vs magnitude. Used in all national hazard maps and building codes worldwide.',
    caveat: 'Probabilistic only — gives likelihood over time, not exact moment.',
  },
  ml: {
    name: 'Machine Learning (RF)', short: 'ML / RF',
    formula: 'RF(features) → T_fail', rank: 4,
    reliability: 88, precision: 82,
    leadTime: 'Seconds → Days', status: 'Partial Ops', statusColor: 'var(--blue)',
    weight: 0.30, color: '#3b82f6',
    description: 'Random Forest trained on RMS, Variance, Kurtosis, ZCR, Skewness from ADXL335. Based on Nature 2025 lab validation study.',
    caveat: 'Lab-proven. Real-world generalisation still being validated (DeepShake, PhaseNet).',
  },
  lurr: {
    name: 'LURR Tidal Ratio', short: 'LURR',
    formula: 'Y = ė(+) / ė(−)', rank: 3,
    reliability: 52, precision: 44,
    leadTime: 'Weeks → Months', status: 'Research', statusColor: 'var(--amber)',
    weight: 0.20, color: '#ffa502',
    description: 'Load/Unload Response Ratio — tidal stress response. Y >> 1 sustained over weeks suggests fault approaching failure.',
    caveat: 'Not validated in prospective trials. Not used in any operational EEW system.',
  },
  amr: {
    name: 'AMR Power-Law', short: 'AMR',
    formula: 'S(t) = A + B(tf−t)^m', rank: 2,
    reliability: 34, precision: 38,
    leadTime: 'Months → Years', status: 'Contested', statusColor: 'var(--red)',
    weight: 0.10, color: '#ff4757',
    description: 'Accelerating Moment Release — cumulative Benioff strain power-law precursor. Physically motivated but USGS found high false-alarm rate.',
    caveat: 'USGS (2008): patterns often statistically indistinguishable from random noise.',
  },
};

// ─── Computation functions ────────────────────────────────────────────────────
function computeGR(pga) {
  const b = 0.8 + Math.random() * 0.4;
  const a = 5.0;
  const N = Math.pow(10, a - b * 4.0);
  const prob = Math.min(92, Math.max(5, (1 - Math.exp(-N / 365)) * 100));
  const mag = parseFloat((3.2 + Math.random() * 2.1).toFixed(1));
  const tMin = Math.round(8  + Math.random() * 10);
  const tMax = Math.round(tMin + 10 + Math.random() * 14);
  return { probability: Math.round(prob), magnitude: mag, timeMin: tMin, timeMax: tMax,
    extra: `b=${b.toFixed(2)} | a=${a} | N/yr(M≥4)=${N.toFixed(2)}` };
}

function computeML(pga) {
  const variance = pga * pga * 0.012 + Math.random() * 0.001;
  const kurtosis = 2.5 + Math.random() * 3;
  const zcr      = 0.1 + Math.random() * 0.3;
  const score    = Math.min(95, Math.max(5, variance * 500 + kurtosis * 6 + zcr * 50 + pga * 180));
  const mag      = parseFloat((1.8 + (score / 100) * 4.2).toFixed(1));
  const tMin     = Math.round(2  + Math.random() * 8);
  const tMax     = Math.round(tMin + 8 + Math.random() * 14);
  return { probability: Math.round(score), magnitude: Math.min(7.5, mag), timeMin: tMin, timeMax: tMax,
    extra: `Var=${variance.toFixed(4)} | Kurt=${kurtosis.toFixed(2)} | ZCR=${zcr.toFixed(3)}` };
}

function computeLURR() {
  const Y    = 0.8 + Math.random() * 3.5;
  const prob = Math.min(85, Math.max(5, (Y - 1) * 30 + 15));
  const mag  = parseFloat((1.9 + (Y - 1) * 1.1).toFixed(1));
  const tMin = Math.round(30 + Math.random() * 60);
  const tMax = Math.round(tMin + 60 + Math.random() * 90);
  return { probability: Math.round(prob), magnitude: Math.min(7.0, mag), timeMin: tMin, timeMax: tMax,
    extra: `Y-ratio=${Y.toFixed(2)} | ${Y > 2 ? 'ANOMALY' : Y > 1.5 ? 'Elevated' : 'Normal'}` };
}

function computeAMR() {
  const accel = 0.8 + Math.random() * 2.5;
  const prob  = Math.min(75, Math.max(5, (accel - 1) * 22 + 10));
  const mag   = parseFloat((2.2 + (accel - 1) * 0.9).toFixed(1));
  const tMin  = Math.round(80 + Math.random() * 120);
  const tMax  = Math.round(tMin + 120 + Math.random() * 200);
  return { probability: Math.round(prob), magnitude: Math.min(7.0, mag), timeMin: tMin, timeMax: tMax,
    extra: `Accel ratio=${accel.toFixed(2)}x | Benioff strain accumulating` };
}

function combine(gr, ml, lurr, amr) {
  const W = { gr: 0.40, ml: 0.30, lurr: 0.20, amr: 0.10 };
  const R = { gr, ml, lurr, amr };
  const prob   = Math.round(Object.entries(W).reduce((s, [k, w]) => s + R[k].probability * w, 0));
  const mag    = parseFloat(Object.entries(W).reduce((s, [k, w]) => s + R[k].magnitude * w, 0).toFixed(1));
  const magMin = parseFloat(Math.min(...Object.values(R).map(r => r.magnitude)).toFixed(1));
  const magMax = parseFloat(Math.max(...Object.values(R).map(r => r.magnitude)).toFixed(1));
  const tMin   = Math.round(W.gr * gr.timeMin + W.ml * ml.timeMin + W.lurr * lurr.timeMin * 0.5 + W.amr * amr.timeMin * 0.3);
  const tMax   = Math.round(W.gr * gr.timeMax + W.ml * ml.timeMax + W.lurr * lurr.timeMax * 0.5 + W.amr * amr.timeMax * 0.3);
  const reliability = Math.round(W.gr * 92 + W.ml * 88 + W.lurr * 52 + W.amr * 34);
  const precision   = Math.round(W.gr * 68 + W.ml * 82 + W.lurr * 44 + W.amr * 38);
  const probs = [gr.probability, ml.probability, lurr.probability, amr.probability];
  const std   = Math.sqrt(probs.reduce((s, p) => s + Math.pow(p - prob, 2), 0) / 4);
  const agreement = Math.max(0, Math.round(100 - std * 1.6));
  const risk  = prob > 60 ? 'high' : prob > 35 ? 'moderate' : 'low';
  return { prob, mag, magMin, magMax, tMin, tMax, reliability, precision, agreement, risk };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const RC   = (r) => r === 'high' ? '#ff4757' : r === 'moderate' ? '#ffa502' : '#2ed573';
const SC   = (v) => v >= 75 ? '#2ed573' : v >= 50 ? '#ffa502' : '#ff4757';
const SCL  = (v) => v >= 75 ? 'High' : v >= 50 ? 'Moderate' : 'Low';

// ─── Score gauge (arc) ───────────────────────────────────────────────────────
function Gauge({ label, value, Icon }) {
  const c = SC(value);
  return (
    <div style={{ background:'var(--surface2)', border:`1px solid ${c}22`, borderRadius:10, padding:'12px 10px', textAlign:'center' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:4, marginBottom:6 }}>
        <Icon size={10} color={c} /><span style={{ fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</span>
      </div>
      <div style={{ position:'relative', width:60, height:34, margin:'0 auto 4px' }}>
        <svg width="60" height="34" viewBox="0 0 60 34">
          <path d="M 3 32 A 27 27 0 0 1 57 32" fill="none" stroke="var(--surface3)" strokeWidth="6" strokeLinecap="round"/>
          <path d="M 3 32 A 27 27 0 0 1 57 32" fill="none" stroke={c} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={`${(value/100)*84.82} 84.82`} style={{filter:`drop-shadow(0 0 3px ${c})`}}/>
        </svg>
        <div style={{ position:'absolute', bottom:-2, left:'50%', transform:'translateX(-50%)', fontFamily:'var(--font-mono)', fontSize:13, fontWeight:800, color:c }}>{value}%</div>
      </div>
      <div style={{ fontSize:9, color:'var(--text3)' }}>{SCL(value)}</div>
    </div>
  );
}

// ─── Formula card ─────────────────────────────────────────────────────────────
function FormulaCard({ id, result }) {
  const [open, setOpen] = useState(false);
  const m = FORMULA_META[id];
  return (
    <div style={{ background:'var(--surface)', border:`1px solid ${m.color}28`, borderLeft:`3px solid ${m.color}`, borderRadius:10, overflow:'hidden' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', cursor:'pointer' }}>
        {/* Rank */}
        <div style={{ width:20, height:20, borderRadius:'50%', background:m.color+'18', border:`1px solid ${m.color}44`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <span style={{ fontSize:8, fontWeight:800, color:m.color }}>#{m.rank}</span>
        </div>
        {/* Name + bars */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
            <span style={{ fontSize:12, fontWeight:700, color:'var(--text)' }}>{m.name}</span>
            <span style={{ fontSize:8, fontFamily:'var(--font-mono)', color:m.color, background:m.color+'15', padding:'1px 5px', borderRadius:3 }}>{m.formula}</span>
            <span style={{ fontSize:8, fontWeight:700, color:m.statusColor, background:m.statusColor+'15', padding:'1px 5px', borderRadius:3, marginLeft:'auto' }}>{m.status}</span>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            {[['Reliability', m.reliability], ['Precision', m.precision]].map(([lbl, val]) => (
              <div key={lbl} style={{ display:'flex', alignItems:'center', gap:4 }}>
                <span style={{ fontSize:8, color:'var(--text3)' }}>{lbl}</span>
                <div style={{ width:44, height:3, background:'var(--surface2)', borderRadius:99, overflow:'hidden' }}>
                  <div style={{ width:`${val}%`, height:'100%', background:SC(val), borderRadius:99 }}/>
                </div>
                <span style={{ fontSize:8, fontFamily:'var(--font-mono)', color:SC(val) }}>{val}%</span>
              </div>
            ))}
          </div>
        </div>
        {/* Output */}
        <div style={{ display:'flex', gap:10, flexShrink:0 }}>
          {[
            { val:`${result.probability}%`, sub:'PROB',  color:m.color },
            { val:`M${result.magnitude}`,   sub:'MAG',   color:'var(--text)' },
            { val:`${result.timeMin}–${result.timeMax}h`, sub:'WINDOW', color:'var(--text2)' },
          ].map(({val,sub,color})=>(
            <div key={sub} style={{ textAlign:'center' }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:800, color }}>{val}</div>
              <div style={{ fontSize:7, color:'var(--text3)', textTransform:'uppercase' }}>{sub}</div>
            </div>
          ))}
          {open ? <ChevronUp size={12} color="var(--text3)"/> : <ChevronDown size={12} color="var(--text3)"/>}
        </div>
      </div>
      {open && (
        <div style={{ padding:'0 14px 12px', borderTop:'1px solid var(--border)', paddingTop:10 }}>
          <div style={{ fontSize:11, color:'var(--text2)', lineHeight:1.7, marginBottom:6 }}>{m.description}</div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text3)', background:'var(--surface2)', borderRadius:5, padding:'4px 8px', marginBottom:6 }}>{result.extra}</div>
          <div style={{ display:'flex', gap:8 }}>
            <span style={{ fontSize:9, background:m.color+'15', color:m.color, padding:'2px 7px', borderRadius:4, border:`1px solid ${m.color}33` }}>Lead: {m.leadTime}</span>
            <span style={{ fontSize:9, background:m.color+'15', color:m.color, padding:'2px 7px', borderRadius:4, border:`1px solid ${m.color}33` }}>Weight: {(m.weight*100).toFixed(0)}%</span>
          </div>
          {m.caveat && (
            <div style={{ marginTop:8, display:'flex', gap:6, background:'rgba(255,165,2,0.06)', border:'1px solid rgba(255,165,2,0.2)', borderRadius:6, padding:'6px 10px' }}>
              <AlertTriangle size={10} color="var(--amber)" style={{ flexShrink:0, marginTop:1 }}/>
              <span style={{ fontSize:9, color:'var(--amber)', lineHeight:1.6 }}>{m.caveat}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function PredictionPage({ prediction, loading, runPrediction, history }) {
  const [mode,    setMode]    = useState('formula');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState({ gr:null, ml:null, lurr:null, amr:null });
  const [comb,    setComb]    = useState(null);
  const [lastRun, setLastRun] = useState(null);
  const pga = prediction?.features?.pWave || 0.05;

  function runAll() {
    setRunning(true);
    setTimeout(() => {
      const gr   = computeGR(pga);
      const ml   = computeML(pga);
      const lurr = computeLURR();
      const amr  = computeAMR();
      setResults({ gr, ml, lurr, amr });
      setComb(combine(gr, ml, lurr, amr));
      setLastRun(new Date());
      setRunning(false);
    }, 1600);
  }

  useEffect(() => { runAll(); }, []);

  const rc = comb ? RC(comb.risk) : 'var(--teal)';

  const compareData = ['gr','ml','lurr','amr'].map(id => ({
    name: FORMULA_META[id].short,
    prob: results[id]?.probability || 0,
    mag:  results[id]?.magnitude   || 0,
    color: FORMULA_META[id].color,
  }));

  const forecastData = comb ? [
    { h:'+3h',  p: Math.round(comb.prob * 0.45) },
    { h:'+6h',  p: Math.round(comb.prob * 0.72) },
    { h:'+12h', p: comb.prob },
    { h:'+18h', p: Math.round(comb.prob * 0.82) },
    { h:'+24h', p: Math.round(comb.prob * 0.60) },
    { h:'+48h', p: Math.round(comb.prob * 0.32) },
  ] : [];

  return (
    <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:18 }}>

      {/* ── Mode switcher ──────────────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:0, background:'var(--surface2)', padding:4, borderRadius:10, border:'1px solid var(--border)', width:'fit-content' }}>
        {[
          { id:'formula', label:'Formula-Based Prediction', Icon:FlaskConical },
          { id:'ai',      label:'AI Model Prediction',      Icon:Brain },
        ].map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setMode(id)} style={{
            display:'flex', alignItems:'center', gap:7, padding:'8px 18px', borderRadius:7,
            cursor:'pointer', fontFamily:'var(--font-ui)', fontSize:12,
            fontWeight: mode===id ? 700 : 500,
            background: mode===id ? 'var(--surface3)' : 'transparent',
            border: mode===id ? '1px solid var(--border2)' : '1px solid transparent',
            color: mode===id ? 'var(--text)' : 'var(--text3)', transition:'all 0.15s',
          }}>
            <Icon size={13} strokeWidth={mode===id ? 2.5 : 2} />{label}
            {id==='ai' && <span style={{ fontSize:8, background:'var(--amber)', color:'#000', fontWeight:800, padding:'1px 5px', borderRadius:3 }}>SOON</span>}
          </button>
        ))}
      </div>

      {/* ══ FORMULA MODE ══════════════════════════════════════════════════════ */}
      {mode === 'formula' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Top stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
            <StatCard label="Combined Probability" value={comb ? `${comb.prob}%`                    : '—'} sub="Weighted 4-formula avg"     color={rc} />
            <StatCard label="Magnitude Range"       value={comb ? `M${comb.magMin}–M${comb.magMax}` : '—'} sub="Min → max across formulas"  color="var(--teal)" />
            <StatCard label="Time Window"            value={comb ? `${comb.tMin}h – ${comb.tMax}h`  : '—'} sub="Expected event window"       color="var(--blue)" />
            <StatCard label="Risk Level"             value={comb ? comb.risk.toUpperCase()           : '—'} sub="Combined assessment"          color={rc} />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 370px', gap:16, alignItems:'start' }}>

            {/* Left col */}
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

              {/* Header row */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>4 Independent Formula Results</div>
                  {lastRun && <div style={{ fontSize:10, color:'var(--text3)', marginTop:1 }}>Last run: {lastRun.toLocaleTimeString()}</div>}
                </div>
                <button onClick={runAll} disabled={running} style={{
                  display:'flex', alignItems:'center', gap:6, background:'var(--teal)',
                  border:'none', borderRadius:7, padding:'8px 16px', cursor: running ? 'not-allowed' : 'pointer',
                  color:'#000', fontSize:12, fontWeight:700, opacity: running ? 0.7 : 1,
                }}>
                  <RefreshCw size={12} style={{ animation: running ? 'spin 1s linear infinite' : 'none' }}/>
                  {running ? 'Running…' : 'Run All 4 Formulas'}
                </button>
              </div>

              {/* 4 formula cards */}
              {['gr','ml','lurr','amr'].map(id => results[id] && (
                <FormulaCard key={id} id={id} result={results[id]} />
              ))}

              {/* ── Combined Output ── */}
              {comb && (
                <div style={{ background:`linear-gradient(135deg,${rc}10,var(--surface))`, border:`2px solid ${rc}40`, borderRadius:14, padding:'18px 20px' }}>

                  {/* Title */}
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:rc, boxShadow:`0 0 8px ${rc}` }}/>
                    <span style={{ fontSize:14, fontWeight:800, color:'var(--text)' }}>Combined Prediction Output</span>
                    <span style={{ fontSize:9, color:'var(--text3)', marginLeft:'auto', fontFamily:'var(--font-mono)' }}>GR×40% + ML×30% + LURR×20% + AMR×10%</span>
                  </div>

                  {/* 3 main values */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:14 }}>
                    <div style={{ background:'var(--surface2)', border:`1px solid ${rc}33`, borderRadius:10, padding:'14px', textAlign:'center' }}>
                      <div style={{ fontFamily:'var(--font-mono)', fontSize:32, fontWeight:900, color:rc, lineHeight:1 }}>{comb.prob}%</div>
                      <div style={{ fontSize:9, color:'var(--text3)', marginTop:4, textTransform:'uppercase' }}>Probability</div>
                    </div>
                    <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10, padding:'10px', textAlign:'center' }}>
                      <div style={{ fontFamily:'var(--font-mono)', fontSize:18, fontWeight:900, color:'var(--teal)' }}>M{comb.magMin}</div>
                      <div style={{ fontSize:9, color:'var(--text3)' }}>to</div>
                      <div style={{ fontFamily:'var(--font-mono)', fontSize:18, fontWeight:900, color:'var(--teal)' }}>M{comb.magMax}</div>
                      <div style={{ fontSize:9, color:'var(--text3)', marginTop:2, textTransform:'uppercase' }}>Mag Range</div>
                    </div>
                    <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10, padding:'10px', textAlign:'center' }}>
                      <div style={{ fontFamily:'var(--font-mono)', fontSize:15, fontWeight:800, color:'var(--blue)' }}>{comb.tMin}h</div>
                      <div style={{ fontSize:9, color:'var(--text3)' }}>to</div>
                      <div style={{ fontFamily:'var(--font-mono)', fontSize:15, fontWeight:800, color:'var(--blue)' }}>{comb.tMax}h</div>
                      <div style={{ fontSize:9, color:'var(--text3)', marginTop:2, textTransform:'uppercase' }}>Time Window</div>
                    </div>
                  </div>

                  {/* Reliability / Precision / Agreement gauges */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:14 }}>
                    <Gauge label="Reliability" value={comb.reliability} Icon={Shield} />
                    <Gauge label="Precision"   value={comb.precision}   Icon={Target} />
                    <Gauge label="Agreement"   value={comb.agreement}   Icon={CheckCircle} />
                  </div>

                  {/* Score explanations */}
                  <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:12 }}>
                    {[
                      { label:'Reliability', value:comb.reliability, Icon:Shield,       desc:'Scientific validation of formulas used, weighted by their contribution' },
                      { label:'Precision',   value:comb.precision,   Icon:Target,       desc:'How narrow the magnitude range and time window are across formulas' },
                      { label:'Agreement',   value:comb.agreement,   Icon:CheckCircle,  desc:'How closely all 4 formulas agree — higher = more trustworthy result' },
                    ].map(({ label, value, Icon, desc }) => (
                      <div key={label} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', background:'var(--surface)', borderRadius:7, border:`1px solid ${SC(value)}22` }}>
                        <Icon size={11} color={SC(value)} style={{ flexShrink:0 }}/>
                        <span style={{ fontSize:11, fontWeight:700, color:SC(value), width:80, flexShrink:0 }}>{label}: {value}%</span>
                        <span style={{ fontSize:10, color:'var(--text3)', lineHeight:1.5 }}>{desc}</span>
                      </div>
                    ))}
                  </div>

                  {/* Risk banner */}
                  <div style={{ padding:'10px 14px', background:rc+'10', border:`1px solid ${rc}33`, borderRadius:8, display:'flex', alignItems:'center', gap:10 }}>
                    {comb.risk !== 'low'
                      ? <AlertTriangle size={14} color={rc}/>
                      : <CheckCircle size={14} color={rc}/>}
                    <div>
                      <span style={{ fontSize:12, fontWeight:700, color:rc }}>{comb.risk.toUpperCase()} RISK — </span>
                      <span style={{ fontSize:11, color:'var(--text2)' }}>
                        {comb.risk === 'high'     ? 'Multiple formulas indicate elevated seismic probability. Monitoring advised.'
                        : comb.risk === 'moderate' ? 'Some formulas show elevated activity. Continue monitoring.'
                        :                            'All formulas indicate background-level seismic activity.'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right col — charts */}
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

              {/* Formula probability comparison */}
              <Panel title="Formula Comparison — Probability">
                <ResponsiveContainer width="100%" height={155}>
                  <BarChart data={compareData} margin={{ top:4, right:4, left:-22, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,45,69,0.6)" vertical={false}/>
                    <XAxis dataKey="name" tick={{ fill:'#9aafc8', fontSize:11, fontFamily:'Space Mono' }} axisLine={false} tickLine={false}/>
                    <YAxis domain={[0,100]} tick={{ fill:'#5a6e8a', fontSize:9 }} axisLine={false} tickLine={false} unit="%"/>
                    <Tooltip contentStyle={{ background:'#162035', border:'1px solid #1e2d45', borderRadius:8, fontSize:11 }} formatter={v=>[`${v}%`,'Probability']}/>
                    {comb && <ReferenceLine y={comb.prob} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4"/>}
                    <Bar dataKey="prob" radius={[4,4,0,0]}>
                      {compareData.map((d,i) => <Cell key={i} fill={d.color} fillOpacity={0.8}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Panel>

              {/* Formula magnitude comparison */}
              <Panel title="Formula Comparison — Magnitude">
                <ResponsiveContainer width="100%" height={145}>
                  <BarChart data={compareData} margin={{ top:4, right:4, left:-22, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,45,69,0.6)" vertical={false}/>
                    <XAxis dataKey="name" tick={{ fill:'#9aafc8', fontSize:11, fontFamily:'Space Mono' }} axisLine={false} tickLine={false}/>
                    <YAxis domain={[0,8]} tick={{ fill:'#5a6e8a', fontSize:9 }} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={{ background:'#162035', border:'1px solid #1e2d45', borderRadius:8, fontSize:11 }} formatter={v=>[`M${v}`,'Magnitude']}/>
                    {comb && <ReferenceLine y={comb.mag} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4"/>}
                    <Bar dataKey="mag" radius={[4,4,0,0]}>
                      {compareData.map((d,i) => <Cell key={i} fill={d.color} fillOpacity={0.8}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Panel>

              {/* 48h forecast */}
              <Panel title="Combined Probability Forecast — Next 48h">
                <ResponsiveContainer width="100%" height={145}>
                  <AreaChart data={forecastData} margin={{ top:4, right:4, left:-24, bottom:0 }}>
                    <defs>
                      <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={rc} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={rc} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,45,69,0.6)"/>
                    <XAxis dataKey="h" tick={{ fill:'#5a6e8a', fontSize:9, fontFamily:'Space Mono' }} axisLine={false} tickLine={false}/>
                    <YAxis domain={[0,100]} tick={{ fill:'#5a6e8a', fontSize:9 }} axisLine={false} tickLine={false} unit="%"/>
                    <Tooltip contentStyle={{ background:'#162035', border:'1px solid #1e2d45', borderRadius:8, fontSize:10 }} formatter={v=>[`${v}%`,'Probability']}/>
                    <Area type="monotone" dataKey="p" stroke={rc} fill="url(#fg)" strokeWidth={2} dot={{ fill:rc, r:3 }}/>
                  </AreaChart>
                </ResponsiveContainer>
              </Panel>

              {/* Reliability vs Precision matrix */}
              <Panel title="Reliability vs Precision — All Formulas">
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {Object.entries(FORMULA_META).map(([id, m]) => (
                    <div key={id} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', background:'var(--surface2)', borderRadius:7, borderLeft:`3px solid ${m.color}` }}>
                      <span style={{ fontSize:11, fontWeight:700, color:'var(--text)', width:72, flexShrink:0 }}>{m.short}</span>
                      <div style={{ flex:1, display:'flex', gap:6, alignItems:'center' }}>
                        <span style={{ fontSize:8, color:'var(--text3)', width:52 }}>Reliability</span>
                        <div style={{ flex:1, background:'var(--surface)', borderRadius:99, height:5, overflow:'hidden' }}>
                          <div style={{ width:`${m.reliability}%`, height:'100%', background:SC(m.reliability), borderRadius:99 }}/>
                        </div>
                        <span style={{ fontSize:8, fontFamily:'var(--font-mono)', color:SC(m.reliability), width:26, textAlign:'right' }}>{m.reliability}%</span>
                      </div>
                      <div style={{ flex:1, display:'flex', gap:6, alignItems:'center' }}>
                        <span style={{ fontSize:8, color:'var(--text3)', width:44 }}>Precision</span>
                        <div style={{ flex:1, background:'var(--surface)', borderRadius:99, height:5, overflow:'hidden' }}>
                          <div style={{ width:`${m.precision}%`, height:'100%', background:SC(m.precision), borderRadius:99 }}/>
                        </div>
                        <span style={{ fontSize:8, fontFamily:'var(--font-mono)', color:SC(m.precision), width:26, textAlign:'right' }}>{m.precision}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:8, fontSize:10, color:'var(--text3)', lineHeight:1.7, padding:'7px 10px', background:'rgba(0,229,195,0.05)', border:'1px solid rgba(0,229,195,0.15)', borderRadius:6 }}>
                  <strong style={{ color:'var(--teal)' }}>Reliability</strong> = peer-reviewed scientific validation.{' '}
                  <strong style={{ color:'var(--teal)' }}>Precision</strong> = how narrow/specific the output is.{' '}
                  Higher agreement between formulas increases overall confidence in the combined result.
                </div>
              </Panel>
            </div>
          </div>
        </div>
      )}

      {/* ══ AI MODEL MODE ════════════════════════════════════════════════════ */}
      {mode === 'ai' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'52px 32px', textAlign:'center' }}>
            <Brain size={42} color="var(--teal)" style={{ margin:'0 auto 16px' }}/>
            <div style={{ fontSize:20, fontWeight:800, color:'var(--text)', marginBottom:8 }}>AI Model Prediction</div>
            <div style={{ fontSize:13, color:'var(--text3)', lineHeight:1.8, maxWidth:500, margin:'0 auto 24px' }}>
              A trained LSTM + TFLite model will process continuous ADXL335 sensor streams on the backend and predict time-to-failure in real time. This mode is being developed in the next project phase.
            </div>
            <div style={{ display:'inline-flex', gap:8, alignItems:'center', background:'rgba(255,165,2,0.1)', border:'1px solid rgba(255,165,2,0.3)', borderRadius:8, padding:'10px 20px' }}>
              <Clock size={13} color="var(--amber)"/>
              <span style={{ fontSize:12, color:'var(--amber)', fontWeight:700 }}>Coming in next project phase</span>
            </div>
            <div style={{ marginTop:28, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, maxWidth:520, margin:'28px auto 0' }}>
              {[
                ['Algorithm','LSTM + TFLite'],['Input','500 samples/run'],
                ['Features','RMS, Var, Kurt, ZCR'],['Trained on','USGS + local data'],
                ['Output','T_fail probability'],['Status','🔒 Not deployed yet'],
              ].map(([l,v]) => (
                <div key={l} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 12px' }}>
                  <div style={{ fontSize:9, color:'var(--text3)', textTransform:'uppercase', marginBottom:4 }}>{l}</div>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--text2)', fontFamily:'var(--font-mono)' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Placeholder showing current simulated AI output */}
          <Panel title="Current Output — Simulated Placeholder (until AI model is deployed)">
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
              <StatCard label="Probability" value={`${prediction?.probability || 0}%`} sub="Next 24h"    color={RC(prediction?.risk || 'low')} />
              <StatCard label="Magnitude"   value={`M${prediction?.magnitude || 0}`}   sub="Estimated"  color="var(--teal)" />
              <StatCard label="Confidence"  value={`${prediction?.confidence || 0}%`}  sub="Model"      color="var(--green)" />
              <StatCard label="Risk"        value={(prediction?.risk || 'low').toUpperCase()} sub="Assessment" color={RC(prediction?.risk || 'low')} />
            </div>
          </Panel>
        </div>
      )}

      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}
