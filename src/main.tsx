import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '@/App';
import { Web3Provider } from '@/context/Web3Context';
import { AppProvider } from '@/context/AppContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Web3Provider>
      <AppProvider>
        <App />
      </AppProvider>
    </Web3Provider>
  </StrictMode>,
);
