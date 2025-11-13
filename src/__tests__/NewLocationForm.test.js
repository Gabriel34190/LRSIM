import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import NewLocationForm from '../components/NewLocationForm';

// Mock firebase config to avoid initializing real SDK
jest.mock('../components/firebase-config', () => ({
  db: {},
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => {
  return {
    collection: jest.fn(() => ({})),
    addDoc: jest.fn(async () => ({ id: 'mockDocId' })),
  };
});

// Create a File mock helper
function createImageFile(name = 'photo.jpg', size = 1024, type = 'image/jpeg') {
  const blob = new Blob(['x'.repeat(size)], { type });
  return new File([blob], name, { type });
}

describe('NewLocationForm', () => {
  const onClose = jest.fn();
  const onLocationAdded = jest.fn();

  beforeEach(() => {
    onClose.mockReset();
    onLocationAdded.mockReset();
    const firestore = require('firebase/firestore');
    firestore.collection.mockReset();
    firestore.collection.mockReturnValue({});
    firestore.addDoc.mockReset();
    firestore.addDoc.mockResolvedValue({ id: 'mockDocId' });
    // Mock fetch for Cloudinary upload
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ secure_url: 'https://cloudinary.com/mock-image.jpg' }),
    });
    // Silence URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:preview');
  });

let consoleErrorSpy;

beforeEach(() => {
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleErrorSpy?.mockRestore();
});

  it('affiche des erreurs de validation si champs manquants', async () => {
    render(<NewLocationForm onClose={onClose} onLocationAdded={onLocationAdded} />);
    fireEvent.submit(screen.getByRole('button', { name: /ajouter le lieu/i }));
    expect(await screen.findByText(/Veuillez renseigner le nom du lieu/i)).toBeInTheDocument();
  });

  const getFileInput = () => {
    const label = screen.getByText(/image du lieu/i);
    const group = label.parentElement;
    if (!group) {
      throw new Error('Form group introuvable pour le champ image');
    }
    const input = group.querySelector('input[type="file"]');
    if (!input) {
      throw new Error("Input file non trouvé dans le groupe d'image");
    }
    return input;
  };

  it("affiche une erreur si le fichier n'est pas une image", async () => {
    render(<NewLocationForm onClose={onClose} onLocationAdded={onLocationAdded} />);
    fireEvent.change(screen.getByLabelText(/nom du lieu/i), { target: { value: 'Lyon' } });
    const fileInput = getFileInput();
    const fakePdf = createImageFile('doc.pdf', 1000, 'application/pdf');
    fireEvent.change(fileInput, { target: { files: [fakePdf] } });
    expect(screen.getByText(/Veuillez sélectionner un fichier image valide/i)).toBeInTheDocument();
  });

  it('soumet le formulaire avec succès et appelle onLocationAdded puis onClose', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ secure_url: 'https://cloudinary.com/mock-image.jpg' }),
    });
    const firestore = require('firebase/firestore');
    const { container } = render(<NewLocationForm onClose={onClose} onLocationAdded={onLocationAdded} />);

    // Remplir le nom
    fireEvent.change(screen.getByLabelText(/nom du lieu/i), { target: { value: 'Montpellier' } });

    // Ajouter une image valide
    const fileInput = getFileInput();
    const image = createImageFile();
    fireEvent.change(fileInput, { target: { files: [image] } });

    // Soumettre
    fireEvent.submit(screen.getByRole('button', { name: /ajouter le lieu/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
      expect(firestore.addDoc).toHaveBeenCalled();
      expect(onLocationAdded).toHaveBeenCalledWith({
        id: 'mockDocId',
        name: 'Montpellier',
        imageURL: 'https://cloudinary.com/mock-image.jpg',
      });
      expect(onClose).toHaveBeenCalled();
    });

    // Spinner visible pendant l'upload
    await waitFor(() => {
      expect(container.querySelector('.spinner')).not.toBeInTheDocument();
    });
  });

  it("affiche un message d'erreur si l'upload échoue", async () => {
    global.fetch.mockResolvedValueOnce({ ok: false });
    render(<NewLocationForm onClose={onClose} onLocationAdded={onLocationAdded} />);

    fireEvent.change(screen.getByLabelText(/nom du lieu/i), { target: { value: 'Lyon' } });
    const fileInput = getFileInput();
    const image = createImageFile();
    fireEvent.change(fileInput, { target: { files: [image] } });

    fireEvent.submit(screen.getByRole('button', { name: /ajouter le lieu/i }));

    expect(await screen.findByText(/Une erreur s'est produite lors de l'ajout du lieu/i)).toBeInTheDocument();
  });
});


