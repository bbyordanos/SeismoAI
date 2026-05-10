import { useState, useEffect, useRef, useCallback } from 'react';

const API  = process.env.REACT_APP_API_URL  || 'http://localhost:5000';
const WS   = process.env.REACT_APP_WS_URL   || 'ws://localhost:5000/ws';
// Set REACT_APP_DEMO_MODE=false in .env when backend is running
const DEMO = process.env.REACT_APP_DEMO_MODE !== 'false';

export function useSensorData() {
  const [readings,    setReadings]    = useState({ x:0.02, y:0.01, z:0.98, magnitude:0.02, pga:0.02, timestamp:Date.now() });
  const [waveHistory, setWaveHistory] = useState(() => Array(200).fill(0));
  const [alertLevel,  setAlertLevel]  = useState('none');
  const [events,      setEvents]      = useState(INITIAL_EVENTS);
  const [wsStatus,    setWsStatus]    = useState('connecting');

  const wsRef    = useRef(null);
  const tRef     = useRef(0);
  const quakeRef = useRef({ active:false, dur:0, mag:0 });

  useEffect(() => {
    if (DEMO) {
      setWsStatus('open');
      const id = setInterval(() => {
        tRef.current += 0.05;
        const q = quakeRef.current;
        if (Math.random() < 0.003 && !q.active) {
          q.active = true; q.dur = 60 + Math.floor(Math.random()*100); q.mag = Math.random()*3+0.5;
        }
        let val = 0;
        if (q.active) {
          val = (Math.sin(tRef.current*8)*0.4 + Math.random()*0.6) * (q.mag/4);
          q.dur--;
          if (q.dur <= 0) {
            q.active = false;
            const mag = parseFloat((q.mag*1.2).toFixed(1));
            const lv  = mag >= 3.5 ? 'moderate' : 'mild';
            if (mag >= 1.5) {
              setEvents(prev => [{
                id: Date.now(), time: new Date().toISOString(),
                magnitude: mag, level: lv,
                location: LOCATIONS[Math.floor(Math.random()*LOCATIONS.length)],
                depth: (5+Math.random()*20).toFixed(1),
                lat: (8.5+Math.random()*2).toFixed(3), lon: (39.5+Math.random()*2).toFixed(3),
              }, ...prev].slice(0,50));
            }
          }
        } else {
          val = Math.sin(tRef.current*1.5)*0.015 + (Math.random()-0.5)*0.03;
        }
        const pga = Math.abs(val);
        setReadings({ x:parseFloat((pga).toFixed(4)), y:parseFloat((pga*0.7).toFixed(4)), z:parseFloat((0.98+pga*0.1).toFixed(4)), magnitude:pga, pga, timestamp:Date.now() });
        setWaveHistory(prev => { const n=[...prev, val]; n.shift(); return n; });
        setAlertLevel(pga > 0.8 ? 'strong' : pga > 0.3 ? 'moderate' : pga > 0.08 ? 'mild' : 'none');
      }, 50);
      return () => clearInterval(id);
    }

    let reconnectTimer = null;
    const connect = () => {
      const ws = new WebSocket(WS);
      wsRef.current = ws;
      ws.onopen    = () => setWsStatus('open');
      ws.onclose   = () => { setWsStatus('closed'); reconnectTimer = setTimeout(connect, 3000); };
      ws.onerror   = () => ws.close();
      ws.onmessage = (e) => {
        try {
          const { type, data } = JSON.parse(e.data);
          if (type === 'sensor') {
            const pga = data.pga || data.magnitude || 0;
            setReadings({ x:data.x, y:data.y, z:data.z, magnitude:data.magnitude, pga, timestamp:Date.now() });
            setWaveHistory(prev => { const n=[...prev, pga - 0.98]; n.shift(); return n; });
            setAlertLevel(data.level || 'none');
          }
          if (type === 'alert') {
            setEvents(prev => [{ ...data, id:data._id||Date.now() }, ...prev].slice(0,50));
          }
        } catch (_) {}
      };
    };
    connect();
    fetch(`${API}/api/events/recent?n=20`).then(r=>r.json()).then(({data})=>{ if(data?.length) setEvents(data.map(e=>({...e,id:e._id||e.id}))); }).catch(()=>{});
    return () => { wsRef.current?.close(); clearTimeout(reconnectTimer); };
  }, []);

  return { readings, waveHistory, alertLevel, events, wsStatus };
}

export function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(id); }, []);
  return time;
}

export function usePrediction() {
  const [prediction, setPrediction] = useState(INITIAL_PREDICTION);
  const [loading,    setLoading]    = useState(false);
  const [history,    setHistory]    = useState(PREDICTION_HISTORY);

  const runPrediction = useCallback(async () => {
    setLoading(true);
    if (DEMO) {
      setTimeout(() => {
        const p = PREDICTIONS[Math.floor(Math.random()*PREDICTIONS.length)];
        const newPred = { ...p, timestamp: new Date().toISOString(), id: Date.now() };
        setPrediction(newPred);
        setHistory(prev => [newPred, ...prev].slice(0,20));
        setLoading(false);
      }, 2000);
      return;
    }
    try {
      const res  = await fetch(`${API}/api/predict`, { method:'POST' });
      const json = await res.json();
      if (json.ok && json.data) {
        const newPred = { ...json.data, id: json.data._id || Date.now() };
        setPrediction(newPred);
        setHistory(prev => [newPred, ...prev].slice(0,20));
      }
    } catch (err) { console.error('Prediction error:', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (DEMO) return;
    fetch(`${API}/api/predict/history?limit=10`).then(r=>r.json()).then(({data})=>{ if(data?.length) setHistory(data); }).catch(()=>{});
  }, []);

  return { prediction, loading, runPrediction, history };
}

export function useDataCollection() {
  const [collected, setCollected] = useState(HISTORICAL_DATA);
  const [recording, setRecording] = useState(false);
  const startRecording = useCallback(() => setRecording(true), []);
  const stopRecording  = useCallback(() => setRecording(false), []);
  const addSample = useCallback((sample) => { setCollected(prev => [...prev, sample].slice(-500)); }, []);
  return { collected, recording, startRecording, stopRecording, addSample };
}

export async function sendTelegramTest() {
  if (DEMO) return { ok:true, demo:true };
  const res = await fetch(`${API}/api/alerts/test`, { method:'POST' });
  return res.json();
}

export async function updateAlertConfig(config) {
  if (DEMO) return { ok:true };
  const res = await fetch(`${API}/api/alerts/config`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(config) });
  return res.json();
}

const LOCATIONS = ['Central Rift Valley','Awash Valley Basin','Lake Turkana Rift','Addis Ababa Basin','Blue Nile Gorge','Koka Reservoir Zone','Ziway-Shala Lakes','Afar Triangle','Bale Mountains Region'];

const INITIAL_EVENTS = [
  { id:1, time:'2025-01-15T04:12:33Z', magnitude:2.1, level:'mild',     location:'Awash Valley',        depth:'8.2',  lat:'8.921', lon:'40.102' },
  { id:2, time:'2025-01-15T01:55:08Z', magnitude:3.6, level:'moderate', location:'Lake Turkana Rift',   depth:'12.5', lat:'9.115', lon:'40.533' },
  { id:3, time:'2025-01-14T22:41:00Z', magnitude:1.8, level:'mild',     location:'Addis Ababa Basin',   depth:'5.1',  lat:'9.022', lon:'38.747' },
  { id:4, time:'2025-01-14T18:22:15Z', magnitude:2.9, level:'mild',     location:'Blue Nile Gorge',     depth:'9.8',  lat:'10.21', lon:'38.742' },
  { id:5, time:'2025-01-14T14:07:44Z', magnitude:4.1, level:'moderate', location:'Central Rift Valley', depth:'15.3', lat:'8.450', lon:'39.510' },
];

const INITIAL_PREDICTION = { probability:34, magnitude:3.8, confidence:81, region:'Central Rift Valley', coords:'9.1°N, 40.5°E ± 25km', risk:'moderate', timestamp:new Date().toISOString(), features:{ stalta:1.42, pWave:0.31, energy:0.87, freqPeak:4.2 } };

const PREDICTIONS = [
  { probability:34, magnitude:3.8, confidence:81, region:'Central Rift Valley',  coords:'9.1°N, 40.5°E ± 25km', risk:'moderate', features:{stalta:1.42,pWave:0.31,energy:0.87,freqPeak:4.2} },
  { probability:18, magnitude:2.9, confidence:75, region:'Awash Valley Basin',   coords:'8.9°N, 40.1°E ± 18km', risk:'low',      features:{stalta:0.91,pWave:0.18,energy:0.54,freqPeak:3.1} },
  { probability:52, magnitude:4.2, confidence:68, region:'Koka Reservoir Zone',  coords:'8.4°N, 39.5°E ± 30km', risk:'high',     features:{stalta:2.11,pWave:0.55,energy:1.24,freqPeak:5.8} },
  { probability:27, magnitude:3.3, confidence:79, region:'Blue Nile Gorge',      coords:'10.2°N, 38.7°E ± 22km',risk:'low',      features:{stalta:1.08,pWave:0.22,energy:0.71,freqPeak:3.9} },
  { probability:61, magnitude:4.7, confidence:73, region:'Afar Triangle',        coords:'11.5°N, 41.8°E ± 35km',risk:'high',     features:{stalta:2.54,pWave:0.68,energy:1.61,freqPeak:6.4} },
];

const PREDICTION_HISTORY = [
  { id:101, timestamp:'2025-01-15T03:00:00Z', magnitude:3.8, probability:34, region:'Central Rift Valley',  risk:'moderate', confidence:81 },
  { id:102, timestamp:'2025-01-14T21:00:00Z', magnitude:2.9, probability:18, region:'Awash Valley Basin',   risk:'low',      confidence:75 },
  { id:103, timestamp:'2025-01-14T15:00:00Z', magnitude:4.2, probability:52, region:'Koka Reservoir Zone',  risk:'high',     confidence:68 },
  { id:104, timestamp:'2025-01-14T09:00:00Z', magnitude:3.3, probability:27, region:'Blue Nile Gorge',      risk:'low',      confidence:79 },
];

export const HISTORICAL_DATA = Array.from({ length:120 }, (_, i) => ({
  id: i+1, timestamp: new Date(Date.now()-(120-i)*30000).toISOString(),
  x: parseFloat((Math.random()*0.15).toFixed(4)), y: parseFloat((Math.random()*0.12).toFixed(4)),
  z: parseFloat((0.95+Math.random()*0.1).toFixed(4)), magnitude: parseFloat((Math.random()*0.1).toFixed(4)),
  label: Math.random() < 0.08 ? 1 : 0,
}));
