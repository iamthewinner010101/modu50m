import { useState } from 'react';
import { getPrecinct } from '../data/daejeonPrecincts.js';
import HanbitPrecinct from './HanbitPrecinct.jsx';

export default function DaejeonPrecinctExplorer() {
  const [placeId, setPlaceId] = useState(() => getPrecinct(new URLSearchParams(location.search).get('place')).id);
  function changePlace(id) {
    const next = getPrecinct(id);
    const url = new URL(location.href); url.searchParams.set('place', next.id);
    history.replaceState(null, '', url);
    setPlaceId(next.id);
  }
  return <HanbitPrecinct key={placeId} site={getPrecinct(placeId)} onPlaceChange={changePlace} />;
}
