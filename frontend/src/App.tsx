import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { store } from './store/store';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CampaignSetup from './pages/CampaignSetup';
import LivePlay from './pages/LivePlay';
import './App.css';

// Create a client for React Query
const queryClient = new QueryClient();

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="min-h-screen bg-dark-900">
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/campaign/:id/setup" element={<CampaignSetup />} />
                <Route path="/campaign/:id/play" element={<LivePlay />} />
              </Routes>
            </Layout>
          </div>
        </Router>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
