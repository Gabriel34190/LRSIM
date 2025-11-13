import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';

// Mock Navbar and Map to simplify DOM
jest.mock('../components/Navbar', () => () => <div data-testid="navbar">Navbar</div>);
jest.mock('../components/AppartementMap', () => () => <div data-testid="map">Map</div>);

// Mock router params
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ locationId: 'loc1', appartementId: 'apt1' }),
  };
});

// Mock firebase-config with an authenticated user
jest.mock('../components/firebase-config', () => {
  return {
    auth: {
      onAuthStateChanged: (cb) => {
        cb({ uid: 'user1' });
        return () => {};
      },
      signOut: jest.fn(),
    },
    db: {},
  };
});

// Mock Firestore doc/getDoc/updateDoc
jest.mock('firebase/firestore', () => {
  const doc = jest.fn();
  const getDoc = jest.fn(async () => ({
    exists: () => true,
    data: () => ({
      name: 'Appartement Demo',
      price: 1200,
      Adress: '34000 Montpellier, France',
      description: 'Bel appartement lumineux',
      imageURLs: [],
      status: 'Disponible',
    }),
  }));
  const updateDoc = jest.fn(async () => {});
  return { doc, getDoc, updateDoc };
});

describe('AppartementDetailsPage editing integration', () => {
  it('permet de modifier le titre (name) et sauvegarder en Firestore', async () => {
    const { default: AppartementDetailsPage } = require('../components/AppartementDetailsPage');
    const firestore = require('firebase/firestore');
    firestore.doc.mockReturnValue({});

    render(
      <MemoryRouter>
        <AppartementDetailsPage />
      </MemoryRouter>
    );

    // attend que les données soient chargées
    await waitFor(() => {
      expect(screen.getByText(/Appartement Demo/i)).toBeInTheDocument();
    });

    // cliquer pour éditer le champ "name"
    fireEvent.click(screen.getByText(/Appartement Demo/i));
    const input = screen.getByDisplayValue('Appartement Demo');
    fireEvent.change(input, { target: { value: 'Appartement Edité' } });

    // blur pour déclencher saveField
    fireEvent.blur(input);

    await waitFor(() => {
      expect(firestore.updateDoc).toHaveBeenCalled();
      expect(screen.getByText(/Appartement Edité/i)).toBeInTheDocument();
    });
  });
});


