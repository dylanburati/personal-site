import React from "react";
import { createRoot } from 'react-dom/client';
import './css/styles.css';
import { App } from './App';

if ((window as any).IS_DEV) {
  new EventSource('/esbuild').addEventListener('change', () => location.reload());
}

const el = document.getElementById('root')!;
const root = createRoot(el);
root.render(<App />);