/**
 * African Seismic Zones & Sensor Network Data
 * Real geographic data for Ethiopia, East Africa, and the continent
 */

// ── Ethiopia sensor stations ───────────────────────────────────────────────────
export const ETHIOPIA_SENSORS = [
  { id:'ETH-001', name:'Addis Ababa Central',  lat:9.0254,  lon:38.7469, region:'Central Highlands',   zone:'moderate', status:'online',  pga:0.02, lastSeen: Date.now()-2000,  mag:0,   alerts:12, city:'Addis Ababa'  },
  { id:'ETH-002', name:'Awash Valley Station', lat:8.9806,  lon:40.1686, region:'Afar Rift',            zone:'high',     status:'online',  pga:0.08, lastSeen: Date.now()-1500,  mag:1.2, alerts:34, city:'Awash'        },
  { id:'ETH-003', name:'Dire Dawa Monitor',    lat:9.5931,  lon:41.8661, region:'Eastern Escarpment',  zone:'moderate', status:'online',  pga:0.03, lastSeen: Date.now()-3000,  mag:0,   alerts:8,  city:'Dire Dawa'    },
  { id:'ETH-004', name:'Mekelle Array',        lat:13.4966, lon:39.4766, region:'Tigray',               zone:'moderate', status:'online',  pga:0.01, lastSeen: Date.now()-4000,  mag:0,   alerts:5,  city:'Mekelle'      },
  { id:'ETH-005', name:'Harar Sensor',         lat:9.3119,  lon:42.1183, region:'Eastern Ethiopia',    zone:'low',      status:'online',  pga:0.01, lastSeen: Date.now()-5000,  mag:0,   alerts:2,  city:'Harar'        },
  { id:'ETH-006', name:'Bahir Dar Monitor',    lat:11.5936, lon:37.3906, region:'Lake Tana',           zone:'low',      status:'online',  pga:0.01, lastSeen: Date.now()-6000,  mag:0,   alerts:3,  city:'Bahir Dar'    },
  { id:'ETH-007', name:'Afar Triangle Node',   lat:11.8251, lon:41.0186, region:'Afar Depression',     zone:'critical', status:'online',  pga:0.14, lastSeen: Date.now()-1000,  mag:2.1, alerts:67, city:'Logia'        },
  { id:'ETH-008', name:'Ziway Lake Array',     lat:7.9368,  lon:38.7063, region:'Main Ethiopian Rift', zone:'high',     status:'online',  pga:0.06, lastSeen: Date.now()-2500,  mag:0.8, alerts:21, city:'Ziway'        },
  { id:'ETH-009', name:'Hawassa Station',      lat:7.0504,  lon:38.4955, region:'Main Ethiopian Rift', zone:'high',     status:'online',  pga:0.05, lastSeen: Date.now()-3500,  mag:0.5, alerts:18, city:'Hawassa'      },
  { id:'ETH-010', name:'Jijiga Outpost',       lat:9.3496,  lon:42.7958, region:'Ogaden Basin',        zone:'low',      status:'offline', pga:0,    lastSeen: Date.now()-900000, mag:0,  alerts:1,  city:'Jijiga'       },
  { id:'ETH-011', name:'Koka Reservoir',       lat:8.4108,  lon:39.4837, region:'Main Ethiopian Rift', zone:'high',     status:'online',  pga:0.07, lastSeen: Date.now()-1800,  mag:1.0, alerts:29, city:'Koka'         },
  { id:'ETH-012', name:'Gondar Node',          lat:12.6030, lon:37.4521, region:'Northwestern Highlands',zone:'low',    status:'online',  pga:0.01, lastSeen: Date.now()-7000,  mag:0,   alerts:2,  city:'Gondar'       },
];

// ── Broader African sensor network ────────────────────────────────────────────
export const AFRICA_SENSORS = [
  // East Africa Rift
  { id:'KEN-001', name:'Nairobi Station',      lat:-1.2921, lon:36.8219, country:'Kenya',   zone:'moderate', status:'online',  pga:0.03 },
  { id:'KEN-002', name:'Naivasha Rift',        lat:-0.7167, lon:36.4300, country:'Kenya',   zone:'high',     status:'online',  pga:0.06 },
  { id:'TZA-001', name:'Dar es Salaam',        lat:-6.7924, lon:39.2083, country:'Tanzania',zone:'low',      status:'online',  pga:0.01 },
  { id:'TZA-002', name:'Lake Tanganyika',      lat:-5.4000, lon:29.5000, country:'Tanzania',zone:'high',     status:'online',  pga:0.05 },
  { id:'UGA-001', name:'Kampala Monitor',      lat:0.3476,  lon:32.5825, country:'Uganda',  zone:'moderate', status:'online',  pga:0.02 },
  { id:'DJI-001', name:'Djibouti Afar',        lat:11.8251, lon:42.5903, country:'Djibouti',zone:'critical', status:'online',  pga:0.12 },
  { id:'ERI-001', name:'Asmara Array',         lat:15.3229, lon:38.9251, country:'Eritrea', zone:'moderate', status:'online',  pga:0.03 },
  { id:'RWA-001', name:'Kigali Node',          lat:-1.9441, lon:30.0619, country:'Rwanda',  zone:'high',     status:'online',  pga:0.04 },
  // North Africa
  { id:'EGY-001', name:'Cairo Monitor',        lat:30.0444, lon:31.2357, country:'Egypt',   zone:'moderate', status:'online',  pga:0.03 },
  { id:'MAR-001', name:'Atlas Mountains',      lat:31.7917, lon:-7.0926, country:'Morocco', zone:'high',     status:'online',  pga:0.06 },
  { id:'ALG-001', name:'Algiers Station',      lat:36.7372, lon:3.0865,  country:'Algeria', zone:'high',     status:'online',  pga:0.05 },
  // Southern Africa
  { id:'ZAF-001', name:'Johannesburg',         lat:-26.2041,lon:28.0473, country:'S.Africa',zone:'low',      status:'online',  pga:0.01 },
  { id:'MOZ-001', name:'Mozambique Channel',   lat:-18.6657,lon:35.5296, country:'Mozambique',zone:'moderate',status:'online', pga:0.04 },
  // West Africa
  { id:'NGA-001', name:'Lagos Coastal',        lat:6.5244,  lon:3.3792,  country:'Nigeria', zone:'low',      status:'online',  pga:0.01 },
  { id:'CMR-001', name:'Mt Cameroon Zone',     lat:4.2035,  lon:9.2263,  country:'Cameroon',zone:'moderate', status:'online',  pga:0.03 },
];

// ── African seismic fault lines (simplified polylines) ─────────────────────
export const FAULT_LINES = [
  {
    id:'EAR', name:'East African Rift System', risk:'critical',
    color:'#ff0033',
    coords:[
      [15.0, 40.0],[13.0, 40.5],[11.5, 41.5],[9.5, 40.5],[8.5, 39.5],
      [7.5, 38.5],[5.0, 37.5],[2.0, 36.5],[-1.0, 36.0],[-3.0, 35.5],
      [-5.0, 34.5],[-8.0, 32.0],[-10.0, 34.0],[-13.0, 34.5],
    ],
  },
  {
    id:'MER', name:'Main Ethiopian Rift', risk:'high',
    color:'#ff4757',
    coords:[
      [11.5, 37.5],[11.0, 38.0],[10.0, 38.5],[9.0, 38.7],[8.0, 38.5],
      [7.0, 38.3],[6.0, 38.0],[5.0, 37.5],[4.0, 37.0],
    ],
  },
  {
    id:'ATL', name:'Atlas-Mediterranean Belt', risk:'high',
    color:'#ffa502',
    coords:[[36.0,4.0],[35.5,3.0],[35.0,1.0],[34.5,-2.0],[34.0,-5.0],[33.5,-8.0]],
  },
  {
    id:'CAR', name:'Cameroon Volcanic Line', risk:'moderate',
    color:'#ffa502',
    coords:[[4.5,8.5],[4.2,9.2],[3.8,10.0],[3.5,11.0],[3.0,12.0]],
  },
];

// ── Risk zone polygon definitions (approximate bounding) ──────────────────
export const RISK_ZONES = [
  { id:'AFAR',  name:'Afar Triangle',         risk:'critical', color:'rgba(255,0,51,0.15)',  lat:12.0, lon:41.5, radius:300 },
  { id:'MER',   name:'Main Ethiopian Rift',   risk:'high',     color:'rgba(255,71,87,0.12)', lat:8.0,  lon:38.5, radius:250 },
  { id:'ATKEA', name:'Kenya Rift Valley',     risk:'high',     color:'rgba(255,71,87,0.12)', lat:0.0,  lon:36.0, radius:200 },
  { id:'ATLAS', name:'Atlas Mountains',       risk:'high',     color:'rgba(255,165,2,0.12)', lat:32.0, lon:2.0,  radius:400 },
  { id:'NE',    name:'NE Ethiopia Escarpment',risk:'moderate', color:'rgba(255,165,2,0.10)', lat:10.0, lon:42.0, radius:150 },
];

// ── Historical major earthquakes (Ethiopia + East Africa) ──────────────────
export const HISTORICAL_QUAKES = [
  { year:1906, mag:7.4, lat:9.5,   lon:40.5,  location:'Afar Region',          country:'Ethiopia'  },
  { year:1960, mag:5.6, lat:8.5,   lon:39.2,  location:'Ethiopian Rift',       country:'Ethiopia'  },
  { year:1969, mag:6.2, lat:11.8,  lon:41.3,  location:'Afar Depression',      country:'Ethiopia'  },
  { year:1978, mag:5.4, lat:8.1,   lon:38.6,  location:'Koka Reservoir',       country:'Ethiopia'  },
  { year:2002, mag:5.5, lat:11.2,  lon:40.8,  location:'Northern Afar',        country:'Ethiopia'  },
  { year:2004, mag:5.2, lat:9.0,   lon:40.0,  location:'Awash Valley',         country:'Ethiopia'  },
  { year:2005, mag:6.8, lat:11.5,  lon:41.0,  location:'Dabbahu Volcano',      country:'Ethiopia'  },
  { year:2008, mag:5.3, lat:8.8,   lon:40.5,  location:'Awash-Tendaho Graben', country:'Ethiopia'  },
  { year:2016, mag:5.9, lat:9.2,   lon:40.1,  location:'Awash Valley',         country:'Ethiopia'  },
  { year:2020, mag:4.7, lat:8.4,   lon:39.5,  location:'Koka Area',            country:'Ethiopia'  },
  { year:2021, mag:5.1, lat:13.2,  lon:40.6,  location:'Afar Region',          country:'Ethiopia'  },
  { year:1917, mag:7.4, lat:-4.0,  lon:29.5,  location:'Lake Tanganyika',      country:'DRC/Tanzania'},
  { year:2005, mag:6.8, lat:-8.7,  lon:32.3,  location:'Lake Malawi',          country:'Malawi'    },
  { year:1990, mag:6.1, lat:36.8,  lon:2.8,   location:'El Asnam',             country:'Algeria'   },
  { year:2003, mag:6.8, lat:36.9,  lon:3.7,   location:'Boumerdes',            country:'Algeria'   },
  { year:1960, mag:5.7, lat:30.1,  lon:31.3,  location:'Cairo Region',         country:'Egypt'     },
];

// ── Zone danger score (0–100) ─────────────────────────────────────────────
export const ZONE_DANGER = {
  critical: { score:90, label:'Critical', color:'#ff0033', bg:'rgba(255,0,51,0.15)'  },
  high:     { score:65, label:'High',     color:'#ff4757', bg:'rgba(255,71,87,0.12)' },
  moderate: { score:40, label:'Moderate', color:'#ffa502', bg:'rgba(255,165,2,0.12)' },
  low:      { score:15, label:'Low',      color:'#2ed573', bg:'rgba(46,213,115,0.1)' },
};

// ── Ethiopia regional statistics ──────────────────────────────────────────
export const REGIONAL_STATS = [
  { region:'Afar Triangle',          sensors:3, events30d:47, maxMag:5.1, zone:'critical', lat:11.8, lon:41.5 },
  { region:'Main Ethiopian Rift',    sensors:4, events30d:31, maxMag:4.2, zone:'high',     lat:8.0,  lon:38.5 },
  { region:'Awash Valley',           sensors:2, events30d:19, maxMag:3.6, zone:'high',     lat:9.0,  lon:40.2 },
  { region:'Central Highlands',      sensors:1, events30d:8,  maxMag:2.9, zone:'moderate', lat:9.0,  lon:38.7 },
  { region:'Eastern Escarpment',     sensors:1, events30d:5,  maxMag:2.4, zone:'moderate', lat:9.5,  lon:41.8 },
  { region:'Northwestern Highlands', sensors:1, events30d:3,  maxMag:1.8, zone:'low',      lat:12.0, lon:37.5 },
];
