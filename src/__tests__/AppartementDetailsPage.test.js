import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';

// Mock Navbar and Map to simplify
jest.mock('../components/Navbar', () => () => <div data-testid="navbar">Navbar</div>);
jest.mock('../components/AppartementMap', () => () => <div data-testid="map">Map</div>);

// Mock firebase-config auth
jest.mock('../components/firebase-config', () => {
  return {
    auth: {
      onAuthStateChanged: (cb) => {
        cb(null); // not logged in
        return () => {};
      },
      signOut: jest.fn(),
    },
    db: {},
  };
});

jest.mock('firebase/firestore', () => {
  const doc = jest.fn();
  const getDoc = jest.fn();
  const updateDoc = jest.fn();
  return { doc, getDoc, updateDoc };
});

// Mock router params
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ locationId: 'loc1', appartementId: 'apt1' }),
  };
});

const firestore = require('firebase/firestore');

beforeEach(() => {
  jest.clearAllMocks();
  firestore.doc.mockReturnValue({});
});

describe('AppartementDetailsPage', () => {
  it('charge et affiche les détails de base', async () => {
    firestore.getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        name: 'Appartement Demo',
        price: 1200,
        Adress: '34000 Montpellier, France',
        description: 'Bel appartement lumineux',
        imageURLs: [],
        status: 'Disponible',
      }),
    });

    const { default: AppartementDetailsPage } = require('../components/AppartementDetailsPage');

    render(
      <MemoryRouter>
        <AppartementDetailsPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Chargement/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Appartement Demo/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Loyer/i)).toBeInTheDocument();
    expect(screen.getByText(/Bel appartement lumineux/i)).toBeInTheDocument();
    expect(screen.getByTestId('map')).toBeInTheDocument();
  });

  it('affiche un message d’erreur quand la récupération échoue', async () => {
    firestore.getDoc.mockRejectedValueOnce(new Error('Firestore KO'));
    const { default: AppartementDetailsPage } = require('../components/AppartementDetailsPage');

    render(
      <MemoryRouter>
        <AppartementDetailsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Une erreur est survenue/i)).toBeInTheDocument();
    });
  });
});


