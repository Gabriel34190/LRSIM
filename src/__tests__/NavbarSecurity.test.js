import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../components/Navbar';

describe('Navbar security basics', () => {
  it('affiche le bouton Connexion pour un visiteur', () => {
    render(
      <MemoryRouter>
        <Navbar isAuthenticated={false} onLogout={undefined} />
      </MemoryRouter>
    );
    expect(screen.getByText(/Connexion/i)).toBeInTheDocument();
    expect(screen.queryByText(/Déconnexion/i)).not.toBeInTheDocument();
  });

  it('affiche le bouton Déconnexion pour un utilisateur connecté', () => {
    render(
      <MemoryRouter>
        <Navbar isAuthenticated={true} onLogout={() => {}} />
      </MemoryRouter>
    );
    expect(screen.getByText(/Déconnexion/i)).toBeInTheDocument();
    expect(screen.queryByText(/^Connexion$/i)).not.toBeInTheDocument();
  });
});



