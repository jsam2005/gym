import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Filter out browser extension errors
const originalError = console.error;
console.error = (...args) => {
  if (args[0]?.includes?.("Could not establish connection")) {
    return; // Ignore extension errors
  }
  originalError.apply(console, args);
};

createRoot(document.getElementById("root")!).render(<App />);
