import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('./components/firebase-config', () => ({
  auth: { onAuthStateChanged: jest.fn(() => jest.fn()) },
  db: {},
  storage: {}
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(async () => ({ docs: [] })),
  deleteDoc: jest.fn(),
  doc: jest.fn()
}));

jest.mock('react-leaflet', () => {
  const React = require('react');
  const Stub = ({ children }) => React.createElement('div', null, children);
  return {
    MapContainer: Stub,
    TileLayer: () => null,
    Marker: Stub,
    Popup: Stub,
    useMap: () => ({}),
    useMapEvent: () => {},
    useMapEvents: () => ({})
  };
});

jest.mock('leaflet/dist/leaflet.css', () => ({}));
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn()
}));
jest.mock('./components/Home', () => () => require('react').createElement('div', null, 'Trouvez un logement !'));
import App from './components/App';

test('renders home page title', () => {
  render(<App />);
  const title = screen.getByText(/Trouvez un logement !/i);
  expect(title).toBeInTheDocument();
});
