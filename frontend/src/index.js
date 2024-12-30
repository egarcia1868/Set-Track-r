import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ShowsContextProvider } from './context/ShowsContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ShowsContextProvider>
      <App />
    </ShowsContextProvider>
  </React.StrictMode>
)