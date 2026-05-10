import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import {
  MapPin, Wifi, WifiOff, Shield, Zap, TrendingUp,
  Activity, ChevronRight, RefreshCw,
} from 'lucide-react';
import {
  ETHIOPIA_SENSORS, HISTORICAL_QUAKES, ZONE_DANGER,
} from '../data/africaSeismic';
import { Panel, StatCard, SectionLabel } from '../components/UI';

const ZONE_COLOR = { critical:'#ff0033', high:'#ff4757', moderate:'#ffa502', low:'#2ed573', offline:'#5a6e8a' };
const ZONE_BG    = { critical:'rgba(255,0,51,0.15)', high:'rgba(255,71,87,0.12)', moderate:'rgba(255,165,2,0.1)', low:'rgba(46,213,115,0.08)', offline:'rgba(90,110,138,0.08)' };

const MAP_W = 660, MAP_H = 480;
const B = { lonMin:33, lonMax:48, latMin:3, latMax:16 };
function proj(lat, lon) {
  return { x:((lon-B.lonMin)/(B.lonMax-B.lonMin))*MAP_W, y:((B.latMax-lat)/(B.latMax-B.latMin))*MAP_H };
}

function genWave(pga, n=80) {
  return Array.from({length:n},()=>parseFloat((pga*0.5+(Math.random()-0.5)*0.015+(Math.random()<0.05?Math.random()*pga*4:0)).toFixed(4)));
}
function genEvents(s, n=8) {
  const max={critical:4,high:3,moderate:2,low:1.2}[s.zone]||1.2;
  return Array.from({length:n},(_,i)=>{
    const mag=parseFloat((0.5+Math.random()*max).toFixed(1));
    return { id:i, time:new Date(Date.now()-i*36e5*(2+Math.random()*10)).toISOString(),
      magnitude:mag, depth:parseFloat((5+Math.random()*20).toFixed(1)),
      level:mag>=4?'strong':mag>=3?'moderate':'mild' };
  }).sort((a,b)=>b.magnitude-a.magnitude);
}
function genPred(s) {
  const base={critical:70,high:50,moderate:30,low:12,offline:5}[s.zone]||15;
  const prob=Math.min(95,Math.max(5,base+Math.floor(Math.random()*20)-10));
  const mag=parseFloat((1.5+(prob/100)*3.5+(Math.random()-0.5)*0.8).toFixed(1));
  const conf=Math.max(55,Math.min(94,95-Math.abs(50-prob)));
  const risk=prob>55?'high':prob>30?'moderate':'low';
  return { probability:prob,magnitude:mag,confidence:conf,risk,window:'24 hours',
    features:{ stalta:parseFloat((0.5+(prob/100)*2.5).toFixed(2)), pWave:parseFloat((0.1+(prob/100)*0.7).toFixed(2)),
      energy:parseFloat((0.2+(prob/100)*1.5).toFixed(2)), freqPeak:parseFloat((2+(prob/100)*5).toFixed(1)) }};
}

const ETH_OUTLINE=[[14.9,36.6],[14.5,37.1],[13.9,38.0],[13.5,38.5],[12.7,40.3],[11.8,41.8],[11.5,42.0],[11.0,42.5],[10.5,42.8],[9.5,44.0],[8.0,46.9],[6.5,45.5],[5.5,44.0],[4.2,41.9],[3.5,40.3],[3.8,39.5],[4.2,38.5],[4.7,37.5],[5.0,36.5],[5.5,35.5],[6.5,35.0],[7.0,34.7],[7.5,34.7],[8.5,35.5],[9.5,35.2],[10.5,35.0],[11.5,35.0],[12.5,35.0],[13.5,35.5],[14.0,36.0]];
const HALOS=[{lat:11.5,lon:41.5,r:52,zone:'critical',label:'Afar Triangle'},{lat:8.5,lon:39.0,r:42,zone:'high',label:'Main Rift'},{lat:9.0,lon:40.3,r:35,zone:'high',label:'Awash Valley'}];

export default function SeismicMapPage() {
  const [sel,      setSel]      = useState(null);
  const [live,     setLive]     = useState({});
  const [waves,    setWaves]    = useState({});
  const [evts,     setEvts]     = useState({});
  const [preds,    setPreds]    = useState({});
  const [tab,      setTab]      = useState('live');
  const [filter,   setFilter]   = useState('all');
  const [predLoad, setPredLoad] = useState(false);

  useEffect(()=>{
    const w={},e={},p={};
    ETHIOPIA_SENSORS.forEach(s=>{ w[s.id]=genWave(s.pga); e[s.id]=genEvents(s); p[s.id]=genPred(s); });
    setWaves(w); setEvts(e); setPreds(p);
  },[]);

  useEffect(()=>{
    const id=setInterval(()=>{
      setLive(prev=>{ const n={...prev}; ETHIOPIA_SENSORS.forEach(s=>{ if(s.status==='online') n[s.id]=Math.max(0,parseFloat((s.pga+(Math.random()-0.5)*0.015).toFixed(4))); }); return n; });
      setWaves(prev=>{ const n={...prev}; ETHIOPIA_SENSORS.forEach(s=>{ if(!n[s.id]) return; const spike=Math.random()<0.04?Math.random()*s.pga*5:0; const v=parseFloat((s.pga*0.5+(Math.random()-0.5)*0.012+spike).toFixed(4)); const a=[...n[s.id],v]; a.shift(); n[s.id]=a; }); return n; });
    },600);
    return ()=>clearInterval(id);
  },[]);

  const filtered   = filter==='all' ? ETHIOPIA_SENSORS : ETHIOPIA_SENSORS.filter(s=>s.zone===filter);
  const onlineCnt  = ETHIOPIA_SENSORS.filter(s=>s.status==='online').length;
  const maxPGA     = Math.max(...ETHIOPIA_SENSORS.map(s=>live[s.id]||s.pga));
  const totalAlerts= ETHIOPIA_SENSORS.reduce((a,s)=>a+s.alerts,0);
  const critCnt    = ETHIOPIA_SENSORS.filter(s=>s.zone==='critical').length;

  const sc   = sel ? (ZONE_COLOR[sel.zone]||'var(--teal)') : 'var(--teal)';
  const sPga = sel ? (live[sel.id]||sel.pga) : 0;
  const sPred= sel ? (preds[sel.id]||{}) : {};
  const sWave= sel ? (waves[sel.id]||[]) : [];
  const sEvts= sel ? (evts[sel.id]||[]) : [];
  const wData= sWave.map((v,i)=>({i,v}));
  const radarData= sel ? [
    {subject:'STA/LTA', A:Math.min((sPred.features?.stalta||0)/3*100,100)},
    {subject:'P-Wave',  A:Math.min((sPred.features?.pWave||0)/0.8*100,100)},
    {subject:'Energy',  A:Math.min((sPred.features?.energy||0)/2*100,100)},
    {subject:'Freq',    A:Math.min((sPred.features?.freqPeak||0)/8*100,100)},
    {subject:'Conf',    A:sPred.confidence||0},
    {subject:'Prob',    A:sPred.probability||0},
  ] : [];
  const hourly=Array.from({length:24},(_,i)=>({ hour:`${String(i).padStart(2,'0')}h`, pga:parseFloat((Math.random()*(sel?sel.pga*4:0.1)+0.005).toFixed(4)) }));

  function refreshPred(){ if(!sel)return; setPredLoad(true); setTimeout(()=>{ setPreds(p=>({...p,[sel.id]:genPred(sel)})); setPredLoad(false); },1600); }

  return (
    <div style={{padding:'20px 24px',display:'flex',flexDirection:'column',gap:18}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
        <StatCard label="Active Sensors"   value={onlineCnt}               sub={`of ${ETHIOPIA_SENSORS.length} installed`} color="var(--teal)" />
        <StatCard label="Critical Zones"   value={critCnt}                 sub="Afar Triangle area"                        color="#ff0033" />
        <StatCard label="Alerts (30 days)" value={totalAlerts}             sub="All stations"                              color="var(--amber)" />
        <StatCard label="Peak PGA Live"    value={`${maxPGA.toFixed(3)}g`} sub="Highest reading now"                       color="var(--red)" />
      </div>

      {!sel && (
        <div style={{background:'rgba(0,229,195,0.07)',border:'1px solid rgba(0,229,195,0.25)',borderRadius:10,padding:'12px 18px',display:'flex',alignItems:'center',gap:12}}>
          <MapPin size={15} color="var(--teal)" />
          <span style={{fontSize:12,color:'var(--text2)'}}>
            <strong style={{color:'var(--teal)'}}>Select a sensor area</strong> on the map or list below → view live data, analysis, and AI earthquake prediction for that location.
          </span>
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'1fr 400px',gap:16,alignItems:'start'}}>
        {/* ── MAP ── */}
        <Panel title="Ethiopia Sensor Network — Click an Area to Inspect"
          action={
            <div style={{display:'flex',gap:4}}>
              {['all','critical','high','moderate','low'].map(f=>(
                <button key={f} onClick={()=>setFilter(f)} style={{fontSize:9,fontWeight:700,textTransform:'uppercase',padding:'3px 8px',borderRadius:4,cursor:'pointer',fontFamily:'var(--font-ui)',background:filter===f?(ZONE_COLOR[f]||'var(--teal)'):'var(--surface2)',color:filter===f?(f==='all'?'#000':'#fff'):'var(--text3)',border:`1px solid ${filter===f?(ZONE_COLOR[f]||'var(--teal)'):'var(--border)'}`}}>{f}</button>
              ))}
            </div>
          }>
          <div style={{background:'#0a1628',borderRadius:10,border:'1px solid var(--border)',overflow:'hidden'}}>
            <svg width="100%" viewBox={`0 0 ${MAP_W} ${MAP_H}`} style={{display:'block'}}>
              <rect width={MAP_W} height={MAP_H} fill="#0a1628"/>
              {Array.from({length:8},(_,i)=>(
                <g key={i}>
                  <line x1={0} y1={(MAP_H/7)*i} x2={MAP_W} y2={(MAP_H/7)*i} stroke="rgba(30,45,69,0.4)" strokeWidth={0.5} strokeDasharray="4 4"/>
                  <line x1={(MAP_W/7)*i} y1={0} x2={(MAP_W/7)*i} y2={MAP_H} stroke="rgba(30,45,69,0.4)" strokeWidth={0.5} strokeDasharray="4 4"/>
                </g>
              ))}
              {HALOS.map((z,i)=>{ const p=proj(z.lat,z.lon); return (<g key={i}><circle cx={p.x} cy={p.y} r={z.r+14} fill={ZONE_BG[z.zone]} stroke={ZONE_COLOR[z.zone]} strokeWidth={0.5} strokeDasharray="6 4" opacity={0.5}/><circle cx={p.x} cy={p.y} r={z.r} fill={ZONE_BG[z.zone]} stroke={ZONE_COLOR[z.zone]} strokeWidth={1} opacity={0.7}/><text x={p.x} y={p.y-z.r-6} textAnchor="middle" fontSize={9} fill={ZONE_COLOR[z.zone]} fontFamily="Space Mono,monospace" opacity={0.85}>{z.label}</text></g>); })}
              {(()=>{ const pts=ETH_OUTLINE.map(([lat,lon])=>{ const p=proj(lat,lon); return `${p.x},${p.y}`; }).join(' L '); return <path d={`M ${pts} Z`} fill="rgba(0,229,195,0.03)" stroke="rgba(0,229,195,0.25)" strokeWidth={1.5}/>; })()}
              {HISTORICAL_QUAKES.filter(q=>q.country==='Ethiopia').map((q,i)=>{ const p=proj(q.lat,q.lon); if(p.x<0||p.x>MAP_W||p.y<0||p.y>MAP_H) return null; return <circle key={i} cx={p.x} cy={p.y} r={Math.max(2,(q.mag-4)*1.8)} fill="rgba(255,165,2,0.18)" stroke="rgba(255,165,2,0.4)" strokeWidth={0.5}/>; })}
              {filtered.map(s=>{ const p=proj(s.lat,s.lon); if(p.x<0||p.x>MAP_W||p.y<0||p.y>MAP_H) return null; const color=s.status==='offline'?'#5a6e8a':ZONE_COLOR[s.zone]; const pga=live[s.id]||s.pga; const pulse=s.status==='online'&&pga>0.04; const isSel=sel?.id===s.id;
                return (<g key={s.id} style={{cursor:'pointer'}} onClick={()=>{ setSel(isSel?null:s); setTab('live'); }}>
                  {pulse&&(<circle cx={p.x} cy={p.y} r={14} fill="none" stroke={color} strokeWidth={1} opacity={0.3}><animate attributeName="r" from="7" to="18" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" from="0.35" to="0" dur="2s" repeatCount="indefinite"/></circle>)}
                  {isSel&&<circle cx={p.x} cy={p.y} r={13} fill="none" stroke="#fff" strokeWidth={2} opacity={0.9}/>}
                  <circle cx={p.x} cy={p.y} r={isSel?8:6} fill={color} opacity={0.95}/>
                  <circle cx={p.x} cy={p.y} r={isSel?3.5:2.5} fill="#fff" opacity={0.9}/>
                  <text x={p.x+10} y={p.y+4} fontSize={8} fill={color} fontFamily="Space Mono,monospace" opacity={0.85}>{s.id}</text>
                </g>);
              })}
              <g transform={`translate(10,${MAP_H-95})`}>
                <rect width={125} height={87} rx={4} fill="rgba(10,22,40,0.9)" stroke="rgba(30,45,69,0.8)" strokeWidth={0.5}/>
                {[['critical','#ff0033'],['high','#ff4757'],['moderate','#ffa502'],['low','#2ed573'],['offline','#5a6e8a']].map(([z,c],i)=>(<g key={z} transform={`translate(10,${14+i*14})`}><circle cx={5} cy={0} r={4} fill={c} opacity={0.85}/><text x={14} y={4} fontSize={9} fill={c} fontFamily="Space Mono,monospace">{z.toUpperCase()}</text></g>))}
              </g>
              {!sel&&<text x={MAP_W/2} y={MAP_H-16} textAnchor="middle" fontSize={10} fill="rgba(0,229,195,0.4)" fontFamily="Space Mono,monospace">Click any sensor dot to inspect that area</text>}
            </svg>
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            <SectionLabel>Installed Sensor Stations</SectionLabel>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5}}>
              {ETHIOPIA_SENSORS.map(s=>{ const pga=live[s.id]||s.pga; const color=s.status==='offline'?'#5a6e8a':ZONE_COLOR[s.zone]; const isSel=sel?.id===s.id;
                return (<div key={s.id} onClick={()=>{ setSel(isSel?null:s); setTab('live'); }} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 10px',borderRadius:'var(--radius-sm)',cursor:'pointer',background:isSel?`${color}18`:'var(--surface2)',border:`1px solid ${isSel?color:'var(--border)'}`,borderLeft:`3px solid ${color}`}}>
                  <div style={{display:'flex',alignItems:'center',gap:5}}>
                    {s.status==='online'?<Wifi size={9} color="var(--green)"/>:<WifiOff size={9} color="var(--text3)"/>}
                    <div><div style={{fontFamily:'var(--font-mono)',fontSize:9,color:'var(--text3)'}}>{s.id}</div><div style={{fontSize:10,color:'var(--text2)',fontWeight:600}}>{s.city}</div></div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontFamily:'var(--font-mono)',fontSize:10,color:pga>0.1?'var(--red)':'var(--teal)'}}>{s.status==='offline'?'—':`${pga.toFixed(3)}g`}</div>
                    <div style={{fontSize:8,fontWeight:700,color,textTransform:'uppercase'}}>{s.zone}</div>
                  </div>
                </div>);
              })}
            </div>
          </div>
        </Panel>

        {/* ── DETAIL PANEL ── */}
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {!sel ? (
            <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'32px 20px',textAlign:'center'}}>
              <MapPin size={28} color="var(--text3)" style={{margin:'0 auto 10px'}}/>
              <div style={{fontSize:14,fontWeight:700,color:'var(--text2)',marginBottom:6}}>No Area Selected</div>
              <div style={{fontSize:11,color:'var(--text3)',lineHeight:1.8}}>Click a sensor dot on the map or a row in the list to view live data, analysis and prediction for that area.</div>
              <div style={{marginTop:16,display:'flex',flexDirection:'column',gap:5,textAlign:'left'}}>
                <SectionLabel>Top Areas by Risk</SectionLabel>
                {ETHIOPIA_SENSORS.sort((a,b)=>(ZONE_DANGER[b.zone]?.score||0)-(ZONE_DANGER[a.zone]?.score||0)).slice(0,5).map(s=>{ const pga=live[s.id]||s.pga; const color=s.status==='offline'?'#5a6e8a':ZONE_COLOR[s.zone];
                  return (<div key={s.id} onClick={()=>{ setSel(s); setTab('live'); }} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 10px',background:'var(--surface2)',border:`1px solid var(--border)`,borderLeft:`3px solid ${color}`,borderRadius:'var(--radius-sm)',cursor:'pointer'}}>
                    <div><span style={{fontSize:11,fontWeight:700,color:'var(--text)'}}>{s.name}</span><div style={{fontSize:9,color:'var(--text3)'}}>{s.region}</div></div>
                    <div style={{display:'flex',alignItems:'center',gap:6}}><span style={{fontFamily:'var(--font-mono)',fontSize:10,color}}>{pga.toFixed(3)}g</span><ChevronRight size={11} color="var(--text3)"/></div>
                  </div>);
                })}
              </div>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {/* Header */}
              <div style={{background:'var(--surface)',border:`1px solid ${sc}44`,borderRadius:'var(--radius-lg)',padding:'14px 16px'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:4}}>
                      <div style={{width:7,height:7,borderRadius:'50%',background:sel.status==='online'?'var(--green)':'var(--text3)',boxShadow:sel.status==='online'?'0 0 6px var(--green)':'none'}}/>
                      <span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--text3)'}}>{sel.id}</span>
                      <span style={{fontSize:9,fontWeight:700,color:sc,background:ZONE_BG[sel.zone],padding:'2px 7px',borderRadius:4,border:`1px solid ${sc}44`,textTransform:'uppercase'}}>{sel.zone}</span>
                    </div>
                    <div style={{fontSize:15,fontWeight:800,color:'var(--text)'}}>{sel.name}</div>
                    <div style={{fontSize:11,color:'var(--text3)'}}>{sel.region} · {sel.city}</div>
                  </div>
                  <button onClick={()=>setSel(null)} style={{background:'none',border:'none',color:'var(--text3)',cursor:'pointer',fontSize:16}}>✕</button>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
                  {[{l:'LIVE PGA',v:`${sPga.toFixed(4)}g`,c:sc},{l:'ALERTS/30d',v:sel.alerts,c:'var(--amber)'},{l:'STATUS',v:sel.status.toUpperCase(),c:sel.status==='online'?'var(--green)':'var(--text3)'}].map(({l,v,c})=>(
                    <div key={l} style={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:8,padding:'8px 10px',textAlign:'center'}}>
                      <div style={{fontFamily:'var(--font-mono)',fontSize:15,fontWeight:800,color:c}}>{v}</div>
                      <div style={{fontSize:9,color:'var(--text3)',marginTop:2}}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabs */}
              <div style={{display:'flex',gap:4,background:'var(--surface2)',padding:4,borderRadius:8,border:'1px solid var(--border)'}}>
                {[{id:'live',label:'Live Data',Icon:Activity},{id:'analysis',label:'Analysis',Icon:TrendingUp},{id:'prediction',label:'Prediction',Icon:Zap}].map(({id,label,Icon})=>(
                  <button key={id} onClick={()=>setTab(id)} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:5,padding:'7px 0',borderRadius:6,cursor:'pointer',fontFamily:'var(--font-ui)',fontSize:11,fontWeight:tab===id?700:500,background:tab===id?'var(--surface3)':'transparent',border:tab===id?'1px solid var(--border2)':'1px solid transparent',color:tab===id?'var(--text)':'var(--text3)'}}>
                    <Icon size={12} strokeWidth={tab===id?2.5:2}/>{label}
                  </button>
                ))}
              </div>

              {/* ── LIVE TAB ── */}
              {tab==='live' && (
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  <Panel title="Live Waveform">
                    <ResponsiveContainer width="100%" height={110}>
                      <AreaChart data={wData} margin={{top:4,right:4,left:-28,bottom:0}}>
                        <defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={sc} stopOpacity={0.3}/><stop offset="95%" stopColor={sc} stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,45,69,0.6)"/>
                        <XAxis dataKey="i" tick={false} axisLine={false}/><YAxis tick={{fill:'#5a6e8a',fontSize:9}} axisLine={false} tickLine={false}/>
                        <Tooltip contentStyle={{background:'#162035',border:'1px solid #1e2d45',borderRadius:8,fontSize:10}} formatter={v=>[`${v.toFixed(4)}g`,'PGA']} labelFormatter={()=>''}/>
                        <Area type="monotone" dataKey="v" stroke={sc} fill="url(#wg)" strokeWidth={1.5} dot={false} isAnimationActive={false}/>
                      </AreaChart>
                    </ResponsiveContainer>
                  </Panel>
                  <Panel title="Hourly PGA — Last 24h">
                    <ResponsiveContainer width="100%" height={110}>
                      <BarChart data={hourly} margin={{top:4,right:4,left:-24,bottom:0}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,45,69,0.6)" vertical={false}/>
                        <XAxis dataKey="hour" tick={{fill:'#5a6e8a',fontSize:8,fontFamily:'Space Mono'}} axisLine={false} tickLine={false} interval={5}/>
                        <YAxis tick={{fill:'#5a6e8a',fontSize:9}} axisLine={false} tickLine={false}/>
                        <Tooltip contentStyle={{background:'#162035',border:'1px solid #1e2d45',borderRadius:8,fontSize:10}} formatter={v=>[`${v.toFixed(4)}g`,'PGA']}/>
                        <Bar dataKey="pga" radius={[2,2,0,0]}>{hourly.map((d,i)=><Cell key={i} fill={d.pga>sel.pga*3?'#ff4757':sc} fillOpacity={0.75}/>)}</Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Panel>
                  <Panel title="Recent Events — This Area">
                    <div style={{display:'flex',flexDirection:'column',gap:5}}>
                      {sEvts.slice(0,6).map(ev=>(
                        <div key={ev.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 10px',background:'var(--surface2)',border:'1px solid var(--border)',borderLeft:`3px solid ${ZONE_COLOR[ev.level]||'var(--teal)'}`,borderRadius:'var(--radius-sm)'}}>
                          <div><div style={{fontSize:11,fontWeight:700,color:'var(--text)'}}>M {ev.magnitude}</div><div style={{fontSize:9,color:'var(--text3)',fontFamily:'var(--font-mono)'}}>{new Date(ev.time).toLocaleString()}</div></div>
                          <div style={{textAlign:'right'}}><div style={{fontSize:10,color:'var(--text2)',fontFamily:'var(--font-mono)'}}>depth {ev.depth} km</div><span style={{fontSize:9,fontWeight:700,color:ZONE_COLOR[ev.level],background:ZONE_BG[ev.level],padding:'1px 6px',borderRadius:3}}>{ev.level.toUpperCase()}</span></div>
                        </div>
                      ))}
                    </div>
                  </Panel>
                </div>
              )}

              {/* ── ANALYSIS TAB ── */}
              {tab==='analysis' && (
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  <Panel title="Zone Risk Scores">
                    {[{label:'Seismic Danger',v:ZONE_DANGER[sel.zone]?.score||15,color:sc},{label:'Alert Rate (30d)',v:Math.min(100,sel.alerts*3),color:'var(--amber)'},{label:'Avg PGA Level',v:Math.min(100,(sel.pga/0.2)*100),color:'var(--teal)'},{label:'Historical Activity',v:{critical:88,high:62,moderate:38,low:18}[sel.zone]||18,color:'var(--green)'}].map(({label,v,color})=>(
                      <div key={label} style={{marginBottom:10}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{fontSize:11,color:'var(--text2)'}}>{label}</span><span style={{fontFamily:'var(--font-mono)',fontSize:11,color}}>{Math.round(v)}%</span></div>
                        <div style={{background:'var(--surface2)',borderRadius:99,height:5,overflow:'hidden'}}><div style={{width:`${Math.round(v)}%`,height:'100%',background:color,borderRadius:99}}/></div>
                      </div>
                    ))}
                  </Panel>
                  <Panel title="Signal Feature Radar">
                    <ResponsiveContainer width="100%" height={180}>
                      <RadarChart data={radarData} cx="50%" cy="50%">
                        <PolarGrid stroke="var(--border)"/><PolarAngleAxis dataKey="subject" tick={{fill:'#9aafc8',fontSize:9,fontFamily:'Space Mono'}}/><PolarRadiusAxis angle={30} domain={[0,100]} tick={{fill:'#5a6e8a',fontSize:8}}/>
                        <Radar dataKey="A" stroke={sc} fill={sc} fillOpacity={0.2} strokeWidth={1.5}/>
                      </RadarChart>
                    </ResponsiveContainer>
                  </Panel>
                  <Panel title="Sensor Info">
                    {[['Coordinates',`${sel.lat.toFixed(4)}°N, ${sel.lon.toFixed(4)}°E`],['Region',sel.region],['City',sel.city||'—'],['Zone',sel.zone?.toUpperCase()],['Device ID',sel.id],['Backend','HTTP POST /api/ingest/batch']].map(([k,v])=>(
                      <div key={k} style={{display:'flex',justifyContent:'space-between',fontSize:11,borderBottom:'1px solid var(--border)',paddingBottom:5,marginBottom:4}}><span style={{color:'var(--text3)'}}>{k}</span><span style={{fontFamily:'var(--font-mono)',color:'var(--text2)'}}>{v}</span></div>
                    ))}
                  </Panel>
                </div>
              )}

              {/* ── PREDICTION TAB ── */}
              {tab==='prediction' && (
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  <div style={{background:ZONE_BG[sPred.risk]||ZONE_BG.low,border:`1px solid ${ZONE_COLOR[sPred.risk]||ZONE_COLOR.low}44`,borderRadius:10,padding:'14px 16px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                      <div style={{fontSize:11,color:'var(--text3)'}}>Probability — next {sPred.window}</div>
                      <button onClick={refreshPred} style={{display:'flex',alignItems:'center',gap:5,background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:6,padding:'4px 10px',cursor:'pointer',color:'var(--text3)',fontSize:10}}>
                        <RefreshCw size={10} style={{animation:predLoad?'spin 1s linear infinite':'none'}}/>{predLoad?'Running…':'Re-run AI'}
                      </button>
                    </div>
                    <div style={{display:'flex',alignItems:'baseline',gap:10}}>
                      <span style={{fontSize:40,fontWeight:900,color:ZONE_COLOR[sPred.risk]||'var(--teal)',fontFamily:'var(--font-mono)'}}>{sPred.probability}%</span>
                      <div>
                        <div style={{fontSize:14,fontWeight:700,color:'var(--text)'}}>Est. M{sPred.magnitude}</div>
                        <div style={{fontSize:11,color:'var(--text3)'}}>Confidence: {sPred.confidence}% · <span style={{color:ZONE_COLOR[sPred.risk],fontWeight:700}}>{(sPred.risk||'').toUpperCase()} RISK</span></div>
                      </div>
                    </div>
                  </div>
                  <Panel title="AI Model Features">
                    {[{l:'STA/LTA Ratio',v:sPred.features?.stalta,max:3,u:''},{l:'P-wave',v:sPred.features?.pWave,max:0.8,u:'g'},{l:'Energy Flux',v:sPred.features?.energy,max:2,u:''},{l:'Dominant Freq',v:sPred.features?.freqPeak,max:8,u:'Hz'}].map(({l,v,max,u})=>{ const pct=Math.min(100,((v||0)/max)*100); const c=pct>70?'var(--red)':pct>40?'var(--amber)':'var(--teal)'; return (<div key={l} style={{marginBottom:8}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}><span style={{fontSize:11,color:'var(--text2)'}}>{l}</span><span style={{fontFamily:'var(--font-mono)',fontSize:11,color:c}}>{(v||0).toFixed(2)}{u}</span></div><div style={{background:'var(--surface2)',borderRadius:99,height:4,overflow:'hidden'}}><div style={{width:`${pct}%`,height:'100%',background:c,borderRadius:99}}/></div></div>); })}
                  </Panel>
                  <div style={{background:'rgba(0,229,195,0.06)',border:'1px solid rgba(0,229,195,0.2)',borderRadius:8,padding:'10px 14px'}}>
                    <div style={{fontSize:10,color:'var(--teal)',fontWeight:700,marginBottom:4}}><Shield size={10} style={{marginRight:4,verticalAlign:'middle'}}/>HOW THIS WORKS</div>
                    <p style={{fontSize:10,color:'var(--text3)',lineHeight:1.8,margin:0}}>The AI model analyzes STA/LTA ratios, P-wave amplitudes, and energy flux from sensor <strong style={{color:'var(--text)'}}>{sel.id}</strong>. Your ESP32+ADXL335 sends data every 200ms via HTTP POST → backend → this view updates in real-time.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
