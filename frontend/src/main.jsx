/*! Pother Bondhu. Copyright 2026 Faiaz Abrar Zaman Pronoy and Sinthia Khandoker. All rights reserved. See LICENSE. */
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { AppContextProvider } from './context/AppContext.jsx';
import { DarkmodeProvider } from './context/DarkmodeContext.jsx';
import { LangProvider } from './context/LangContext.jsx';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <LangProvider>
      <AppContextProvider>
        <DarkmodeProvider>
          <App />
        </DarkmodeProvider>
      </AppContextProvider>
    </LangProvider>
  </BrowserRouter>
);
