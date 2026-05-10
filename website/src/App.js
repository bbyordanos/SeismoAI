import React, { useState } from 'react';
import './styles.css';
import Navbar from './components/Navbar';
import DashboardPage    from './pages/Dashboard';
import DataPage         from './pages/DataCollection';
import PredictionPage   from './pages/Prediction';
import AlertsPage       from './pages/Alerts';
import SeismicMapPage   from './pages/SeismicMap';
import { useSensorData, usePrediction } from './hooks/useSeismo';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const { readings, waveHistory, alertLevel, events, wsStatus } = useSensorData();
  const { prediction, loading, runPrediction, history } = usePrediction();

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column' }}>
      <Navbar page={page} setPage={setPage} alertLevel={alertLevel} wsStatus={wsStatus} />
      <main style={{ flex:1, overflowY:'auto' }} className="fade-in" key={page}>
        {page === 'dashboard'  && <DashboardPage  readings={readings} waveHistory={waveHistory} alertLevel={alertLevel} events={events} />}
        {page === 'data'       && <DataPage        readings={readings} waveHistory={waveHistory} />}
        {page === 'prediction' && <PredictionPage  prediction={prediction} loading={loading} runPrediction={runPrediction} history={history} />}
        {page === 'alerts'     && <AlertsPage      events={events} />}
        {page === 'map'        && <SeismicMapPage />}
      </main>
      <div style={{ background:'var(--surface)', borderTop:'1px solid var(--border)', padding:'8px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--font-mono)' }}>SeismoAI v1.0 · ESP32+ADXL335 · Ethiopia Earthquake Early Warning</span>
        <span style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--font-mono)' }}>Final Year Project · ECE · 2025</span>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
