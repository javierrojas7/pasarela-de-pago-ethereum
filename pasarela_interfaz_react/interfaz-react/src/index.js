import React from 'react';
import { createRoot } from 'react-dom/client';
import PaymentGateway from './pages/PaymentGateway';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PaymentGateway />
  </React.StrictMode>
);