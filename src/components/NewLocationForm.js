import React, { useState } from 'react';
import { db } from './firebase-config';
import '../css/NewLocationForm.css';

const NewLocationForm = ({ onClose }) => {
    const [locationName, setLocationName] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!locationName || !description) {
            setError('Please fill in all fields');
            return;
        }

        try {
            await db.collection('locations').add({
                name: locationName,
                description: description,
                createdAt: new Date()
            });
            setSuccessMessage('Location added successfully!');
            setLocationName('');
            setDescription('');
            setError('');
            setTimeout(() => onClose(), 2000);
        } catch (err) {
            console.error('Error adding location:', err);
            setError('Failed to add location. Please try again.');
        }
    };

    return (
        <div className="new-location-form">
            <h2>Add New Location</h2>
            <form onSubmit={handleSubmit}>
                <label>
                    Location Name:
                    <input
                        type="text"
                        value={locationName}
                        onChange={(e) => setLocationName(e.target.value)}
                        required
                    />
                </label>
                <label>
                    Description:
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    ></textarea>
                </label>
                <button type="submit">Add Location</button>
                {error && <p className="error">{error}</p>}
                {successMessage && <p className="success">{successMessage}</p>}
                <button type="button" onClick={onClose} className="close-button">Close</button>
            </form>
        </div>
    );
};

export default NewLocationForm;
