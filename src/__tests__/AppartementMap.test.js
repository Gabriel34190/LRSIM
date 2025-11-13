import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AppartementMap from '../components/AppartementMap';

// Mock react-leaflet heavy components
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map">{children}</div>,
  TileLayer: () => <div data-testid="tile" />,
  Marker: ({ children }) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }) => <div data-testid="popup">{children}</div>,
}));

// Silence leaflet CSS import
jest.mock('leaflet/dist/leaflet.css', () => ({}));

describe('AppartementMap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => [{ lat: '43.611', lon: '3.877' }],
    }));
  });

  it('affiche la carte et le popup après géocodage', async () => {
    render(
      <AppartementMap
        address="Montpellier, 34000, France"
        appartementName="Bel appart"
        user={null}
        onAddressUpdate={null}
      />
    );

    // Loading first then final UI
    await waitFor(() => {
      expect(screen.getByTestId('map')).toBeInTheDocument();
    });

    // Title in popup
    expect(screen.getByText(/Bel appart/i)).toBeInTheDocument();
    // Normalized address appears in header or popup
    expect(screen.getAllByText(/France/)[0]).toBeInTheDocument();
  });
});


