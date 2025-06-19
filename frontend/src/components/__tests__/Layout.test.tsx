import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import authSlice from '../../store/slices/authSlice';
import campaignSlice from '../../store/slices/campaignSlice';
import gameSlice from '../../store/slices/gameSlice';
import Layout from '../Layout';

// Create a test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      auth: authSlice,
      campaign: campaignSlice,
      game: gameSlice,
    },
  });
};

const renderWithProviders = (ui: React.ReactElement) => {
  const store = createTestStore();
  return render(
    <Provider store={store}>
      <BrowserRouter>{ui}</BrowserRouter>
    </Provider>
  );
};

describe('Layout Component', () => {
  test('renders navigation links', () => {
    renderWithProviders(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );

    // Check for main navigation elements
    expect(screen.getByText('Dundra')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Campaigns')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  test('renders sidebar navigation', () => {
    renderWithProviders(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );

    // Check for sidebar elements
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});
