import { lazy } from 'react';

// Do not fetch citywide datasets or account modules for the local precinct.
// Keep each import in its own loader: Vite 8 can otherwise merge conditional
// preload helpers and attach the last branch's CSS to every route.
const VisualPreview = lazy(() => import('./components/DaejeonVisualPreview.jsx'));
const PrecinctExplorer = lazy(() => import('./components/DaejeonPrecinctExplorer.jsx'));
const MainApp = lazy(() => import('./App.jsx'));

export default function EntryApp() {
  const mode = new URLSearchParams(window.location.search).get('mode') || 'visual-preview';
  const RouteApp = mode === 'visual-preview' ? VisualPreview : mode === 'hanbit' ? PrecinctExplorer : MainApp;
  return <RouteApp />;
}
