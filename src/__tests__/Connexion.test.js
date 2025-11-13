import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Connexion from '../components/Connexion';
import { MemoryRouter } from 'react-router-dom';

// Mock Firebase Auth
jest.mock('firebase/auth', () => {
  return {
    signInWithEmailAndPassword: jest.fn(),
  };
});

// Mock firebase-config exports used by component
jest.mock('../components/firebase-config', () => {
  return {
    auth: {
      currentUser: null,
      signOut: jest.fn(),
    },
  };
});

// Mock Navbar to simplify render
jest.mock('../components/Navbar', () => () => <div data-testid="navbar">Navbar</div>);

// Mock react-router navigate
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

describe('Connexion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('affiche un message d’erreur si identifiants invalides', async () => {
    const { signInWithEmailAndPassword } = require('firebase/auth');
    signInWithEmailAndPassword.mockRejectedValueOnce(new Error('Invalid'));

    render(
      <MemoryRouter>
        <Connexion />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/mot de passe/i), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /connexion/i }));

    expect(await screen.findByText(/Identifiants incorrects/i)).toBeInTheDocument();
    expect(mockedNavigate).not.toHaveBeenCalled();
  });

  it('redirige vers la page d’accueil après une connexion réussie', async () => {
    const { signInWithEmailAndPassword } = require('firebase/auth');
    signInWithEmailAndPassword.mockResolvedValueOnce({ user: { uid: '123' } });

    render(
      <MemoryRouter>
        <Connexion />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/mot de passe/i), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: /connexion/i }));

    await waitFor(() => expect(mockedNavigate).toHaveBeenCalledWith('/'));
  });
});


