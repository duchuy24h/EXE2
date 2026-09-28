import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, useRoutes } from 'react-router-dom';
import { publicRoutes } from './routes/index.jsx';
import GoogleAnalytics from './analytics/GoogleAnalytics.jsx';

import { Provider } from './store/Provider';

const AppRoutes = () => {
    return useRoutes(publicRoutes);
};

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <Router>
            <Provider>
                <GoogleAnalytics />
                <AppRoutes />
            </Provider>
        </Router>
    </StrictMode>,
);
