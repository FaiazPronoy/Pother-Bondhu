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
