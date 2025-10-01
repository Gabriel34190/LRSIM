import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix pour les icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const AppartementMap = ({ address, appartementName, user, onAddressUpdate }) => {
    const [position, setPosition] = useState([46.2276, 2.2137]); // Centre de la France par défaut
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [normalizedAddress, setNormalizedAddress] = useState(address || '');
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [tempAddress, setTempAddress] = useState(address || '');

    // Extraction simple des composants: rue + code postal + (ville optionnelle)
    const parseAddressComponents = (rawAddress) => {
        if (!rawAddress || typeof rawAddress !== 'string') return { street: '', postcode: '', city: '' };
        let input = rawAddress.replace(/\s+/g, ' ').trim();
        
        // Supprimer les noms de résidence/immeuble en début d'adresse
        input = input.replace(/^(La|Le|Les|Résidence|Residence|Rés\.|Res\.|Lotissement|Immeuble|Bâtiment|Bat\.|Villa|Château|Domaine|Parc|Les|Aux)\s+[A-Za-zÀ-ÖØ-öø-ÿ'\-\s]+\s+/i, '');
        
        const postcodeMatch = input.match(/\b(\d{5})\b/);
        const postcode = postcodeMatch ? postcodeMatch[1] : '';
        // Retirer le code postal de la chaine pour faciliter l'extraction de la rue
        const withoutPostcode = postcode ? input.replace(postcode, '').replace(/\s{2,}/g, ' ').trim() : input;
        // Essayer de détecter une ville après le code postal si elle existe
        // Cas: "... 34090 Montpellier" ou déjà au début "Montpellier, ..."
        let city = '';
        const cityAfterPostcode = input.match(/\b\d{5}\b\s+([A-Za-zÀ-ÖØ-öø-ÿ'\-\s]+)/);
        if (cityAfterPostcode) {
            city = cityAfterPostcode[1].split(',')[0].trim();
        } else if (input.includes(',')) {
            // S'il y a une virgule, supposer que la partie avant est la ville si courte
            const [maybeCity] = input.split(',');
            if (maybeCity && maybeCity.split(' ').length <= 3) city = maybeCity.trim();
        }
        // Rue = reste sans ville (au pire on garde l'input sans code postal)
        let street = withoutPostcode;
        if (city && street.toLowerCase().startsWith(city.toLowerCase())) {
            street = street.slice(city.length).replace(/^,?\s*/, '');
        }
        return { street: street.replace(/,?\s*France$/i, ''), postcode, city };
    };

    // Note: possibilité de récupérer la ville via le code postal si nécessaire

    // Essaie d'extraire la ville et de construire une adresse "Ville, Rue, Code postal, France"
    const normalizeAddressCityFirst = (rawAddress) => {
        if (!rawAddress || typeof rawAddress !== 'string') return '';
        const input = rawAddress.replace(/\s+/g, ' ').trim();
        const { street, postcode, city } = parseAddressComponents(input);
        const finalCity = city; // peut être vide, sera comblé au besoin par fetchCityByPostcode dans l'effet
        const parts = [];
        if (finalCity) parts.push(finalCity);
        if (street) parts.push(street);
        if (postcode) parts.push(postcode);
        parts.push('France');
        return parts.join(', ');
    };

    // Fonction de géocodage avec Nominatim (OpenStreetMap)
    const geocodeAddress = async (addr) => {
        if (!addr) return;
        
        try {
            setLoading(true);
            const query = encodeURIComponent(addr);
            const base = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&countrycodes=fr`;
            // 1) Essai direct avec l'adresse normalisée
            let response = await fetch(`${base}&q=${query}`, { headers: { 'Accept': 'application/json' } });
            let data = [];
            if (response.ok) {
                data = await response.json();
            }
            // 2) Si échec, réessayer en séparant street/postcode/city si dispo
            if (!Array.isArray(data) || data.length === 0) {
                const { street, postcode, city } = parseAddressComponents(addr);
                const params = new URLSearchParams();
                if (street) params.set('street', street);
                if (city) params.set('city', city);
                if (postcode) params.set('postalcode', postcode);
                response = await fetch(`${base}&${params.toString()}`, { headers: { 'Accept': 'application/json' } });
                if (response.ok) {
                    data = await response.json();
                }
            }
            // 3) Dernier recours: retirer noms de résidence et mots parasites et réessayer
            if (!Array.isArray(data) || data.length === 0) {
                const cleaned = addr.replace(/\b(Résidence|Residence|Rés\.|Res\.|Lotissement|Immeuble|Bâtiment|Bat\.|La|Le|Les)\b\s*/gi, '').trim();
                response = await fetch(`${base}&q=${encodeURIComponent(cleaned)}`, { headers: { 'Accept': 'application/json' } });
                if (response.ok) {
                    data = await response.json();
                }
            }
            
            if (!response.ok) {
                throw new Error('Erreur lors de la recherche d\'adresse');
            }
            
            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                setPosition([parseFloat(lat), parseFloat(lon)]);
                setError(null);
            } else {
                setError('Adresse non trouvée');
            }
        } catch (err) {
            console.error('Erreur de géocodage:', err);
            setError('Impossible de localiser cette adresse');
        } finally {
            setLoading(false);
        }
    };

    // Fonction pour sauvegarder la nouvelle adresse
    const handleSaveAddress = async () => {
        if (!user || !onAddressUpdate) return;
        
        try {
            await onAddressUpdate(tempAddress);
            const norm = normalizeAddressCityFirst(tempAddress);
            setNormalizedAddress(norm);
            setIsEditingAddress(false);
            geocodeAddress(norm);
        } catch (err) {
            console.error('Erreur lors de la mise à jour de l\'adresse:', err);
        }
    };

    // Fonction pour annuler l'édition
    const handleCancelEdit = () => {
        setTempAddress(address);
        setIsEditingAddress(false);
    };

    useEffect(() => {
        if (address) {
            setTempAddress(address);
            const norm = normalizeAddressCityFirst(address);
            setNormalizedAddress(norm);
            geocodeAddress(norm);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [address]);

    if (loading) {
        return (
            <div className="map-container">
                <div className="map-loading">
                    <div className="loading-spinner"></div>
                    <p>Localisation de l'appartement...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="map-container">
                <div className="map-error">
                    <span className="error-icon">⚠️</span>
                    <p>{error}</p>
                    <p className="error-address">Adresse: {address}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="map-container">
            <div className="map-header">
                <div className="map-title-row">
                    <h3 className="map-title">📍 Localisation de l'appartement</h3>
                    {user && (
                        <button 
                            className="edit-address-btn"
                            onClick={() => setIsEditingAddress(true)}
                            title="Modifier l'adresse"
                        >
                            ✏️
                        </button>
                    )}
                </div>
                
                {isEditingAddress ? (
                    <div className="address-edit-form">
                        <input
                            type="text"
                            value={tempAddress}
                            onChange={(e) => setTempAddress(e.target.value)}
                            className="address-edit-input"
                            placeholder="Entrez la nouvelle adresse"
                            autoFocus
                        />
                        <div className="address-edit-actions">
                            <button 
                                className="save-address-btn"
                                onClick={handleSaveAddress}
                            >
                                ✅ Sauvegarder
                            </button>
                            <button 
                                className="cancel-address-btn"
                                onClick={handleCancelEdit}
                            >
                                ❌ Annuler
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="map-address">{normalizedAddress}</p>
                )}
            </div>
            
            <div className="map-wrapper">
                <MapContainer
                    center={position}
                    zoom={15}
                    style={{ height: '400px', width: '100%' }}
                    className="appartement-map"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={position}>
                        <Popup>
                            <div className="map-popup">
                                <h4>{appartementName}</h4>
                                <p>{normalizedAddress}</p>
                                <div className="map-actions">
                                    <a 
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${position[0]},${position[1]}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="directions-link"
                                    >
                                        🧭 Itinéraire
                                    </a>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                </MapContainer>
            </div>
            
            <div className="map-footer">
                <p className="map-info">
                    💡 Cliquez sur le marqueur pour obtenir l'itinéraire
                </p>
            </div>
        </div>
    );
};

export default AppartementMap;
