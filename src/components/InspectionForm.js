import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { createEmptyInspectionData, createEmptyRoom, createEmptyEquipment, ROOM_TYPES } from '../services/inspectionDataModel';

const Button = ({ children, variant = 'primary', className = '', ...rest }) => (
  <button className={`ui-button ui-button-${variant} ${className}`} {...rest}>
    {children}
  </button>
);

const Input = ({ className = '', ...rest }) => (
  <input className={`ui-input ${className}`} {...rest} />
);

const Label = ({ children, className = '' }) => (
  <label className={`ui-label ${className}`}>{children}</label>
);

const Select = ({ className = '', ...rest }) => (
  <select className={`ui-select ${className}`} {...rest} />
);

const Card = ({ className = '', children }) => (
  <div className={`ui-card ${className}`}>{children}</div>
);

const CardTitle = ({ children }) => (
  <div className="ui-card-title">{children}</div>
);

const CardContent = ({ children }) => (
  <div className="ui-card-content">{children}</div>
);

const InspectionForm = ({ inspection, property, tenant, onSave, onCancel }) => {
  const [formData, setFormData] = useState(createEmptyInspectionData());

  useEffect(() => {
    if (inspection?.sections) {
      setFormData({ ...createEmptyInspectionData(), ...inspection.sections });
    } else {
      // Préremplir avec les données du bien et locataire
      const newData = createEmptyInspectionData();
      if (property) {
        newData.general.adresse = property.address || '';
        newData.general.typeLogement = property.type || '';
        newData.general.reference = property.id || '';
      }
      if (tenant) {
        newData.general.locataire = tenant.name || '';
      }
      setFormData(newData);
    }
  }, [inspection, property, tenant]);

  const updateGeneral = (field, value) => {
    setFormData(prev => ({
      ...prev,
      general: { ...prev.general, [field]: value }
    }));
  };

  const updateCompteur = (index, field, value) => {
    const compteurs = [...formData.compteurs.compteurs];
    compteurs[index] = { ...compteurs[index], [field]: value };
    setFormData(prev => ({
      ...prev,
      compteurs: { ...prev.compteurs, compteurs }
    }));
  };

  const addCompteur = () => {
    setFormData(prev => ({
      ...prev,
      compteurs: {
        ...prev.compteurs,
        compteurs: [...prev.compteurs.compteurs, { designation: '', releve: '', numeroCompteur: '', notes: '' }]
      }
    }));
  };

  const removeCompteur = (index) => {
    const compteurs = formData.compteurs.compteurs.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      compteurs: { ...prev.compteurs, compteurs }
    }));
  };

  const updateFournisseur = (field, value) => {
    setFormData(prev => ({
      ...prev,
      fournisseurs: { ...prev.fournisseurs, [field]: value }
    }));
  };

  const updateRemiseClef = (index, field, value) => {
    const items = [...formData.remiseClefs.items];
    items[index] = { ...items[index], [field]: value };
    setFormData(prev => ({
      ...prev,
      remiseClefs: { ...prev.remiseClefs, items }
    }));
  };

  const addRemiseClef = () => {
    setFormData(prev => ({
      ...prev,
      remiseClefs: {
        ...prev.remiseClefs,
        items: [...prev.remiseClefs.items, { designation: '', qte: '', dateRemise: '', notes: '' }]
      }
    }));
  };

  const removeRemiseClef = (index) => {
    const items = formData.remiseClefs.items.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      remiseClefs: { ...prev.remiseClefs, items }
    }));
  };

  const addRoom = (type) => {
    const bedroomCount = formData.pieces.filter(p => p.type === ROOM_TYPES.BEDROOM).length + 1;
    const newRoom = createEmptyRoom(type, bedroomCount);
    setFormData(prev => ({
      ...prev,
      pieces: [...prev.pieces, newRoom]
    }));
  };

  const removeRoom = (roomId) => {
    setFormData(prev => ({
      ...prev,
      pieces: prev.pieces.filter(r => r.id !== roomId)
    }));
  };

  const updateRoomDetail = (roomId, detailIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      pieces: prev.pieces.map(room => {
        if (room.id !== roomId) return room;
        const details = [...room.details];
        details[detailIndex] = { ...details[detailIndex], [field]: value };
        return { ...room, details };
      })
    }));
  };

  const addRoomDetail = (roomId) => {
    setFormData(prev => ({
      ...prev,
      pieces: prev.pieces.map(room => {
        if (room.id !== roomId) return room;
        return {
          ...room,
          details: [...room.details, { designation: '', nature: '', etatGeneral: '', couleur: '', constat: '', notes: '' }]
        };
      })
    }));
  };

  const removeRoomDetail = (roomId, detailIndex) => {
    setFormData(prev => ({
      ...prev,
      pieces: prev.pieces.map(room => {
        if (room.id !== roomId) return room;
        return {
          ...room,
          details: room.details.filter((_, i) => i !== detailIndex)
        };
      })
    }));
  };

  const addEquipment = (roomId) => {
    const newEq = createEmptyEquipment();
    setFormData(prev => ({
      ...prev,
      pieces: prev.pieces.map(room => {
        if (room.id !== roomId) return room;
        return {
          ...room,
          equipements: [...room.equipements, newEq]
        };
      })
    }));
  };

  const updateEquipment = (roomId, eqId, field, value) => {
    setFormData(prev => ({
      ...prev,
      pieces: prev.pieces.map(room => {
        if (room.id !== roomId) return room;
        return {
          ...room,
          equipements: room.equipements.map(eq => {
            if (eq.id !== eqId) return eq;
            return { ...eq, [field]: value };
          })
        };
      })
    }));
  };

  const removeEquipment = (roomId, eqId) => {
    setFormData(prev => ({
      ...prev,
      pieces: prev.pieces.map(room => {
        if (room.id !== roomId) return room;
        return {
          ...room,
          equipements: room.equipements.filter(eq => eq.id !== eqId)
        };
      })
    }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div style={{ padding: '1.5rem', maxHeight: '80vh', overflowY: 'auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>État des lieux - {inspection?.type || 'Entrée'}</h2>
      </div>

      {/* Informations générales */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <CardTitle>Informations générales</CardTitle>
        <CardContent>
          <div className="grid grid-2" style={{ gap: '1rem' }}>
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={formData.general.date}
                onChange={(e) => updateGeneral('date', e.target.value)}
              />
            </div>
            <div>
              <Label>Heure</Label>
              <Input
                type="time"
                value={formData.general.heure}
                onChange={(e) => updateGeneral('heure', e.target.value)}
              />
            </div>
            <div>
              <Label>Établi par</Label>
              <Input
                value={formData.general.etabliPar}
                onChange={(e) => updateGeneral('etabliPar', e.target.value)}
                placeholder="ADMIN"
              />
            </div>
            <div>
              <Label>Adresse</Label>
              <Input
                value={formData.general.adresse}
                onChange={(e) => updateGeneral('adresse', e.target.value)}
              />
            </div>
            <div>
              <Label>Étage</Label>
              <Input
                value={formData.general.etage}
                onChange={(e) => updateGeneral('etage', e.target.value)}
              />
            </div>
            <div>
              <Label>Type de logement</Label>
              <Input
                value={formData.general.typeLogement}
                onChange={(e) => updateGeneral('typeLogement', e.target.value)}
                placeholder="Appartement - 2 Pièces (Meublé)"
              />
            </div>
            <div>
              <Label>Propriétaire</Label>
              <Input
                value={formData.general.proprietaire}
                onChange={(e) => updateGeneral('proprietaire', e.target.value)}
              />
            </div>
            <div>
              <Label>Locataire</Label>
              <Input
                value={formData.general.locataire}
                onChange={(e) => updateGeneral('locataire', e.target.value)}
              />
            </div>
            <div>
              <Label>Mandataire</Label>
              <Input
                value={formData.general.mandataire}
                onChange={(e) => updateGeneral('mandataire', e.target.value)}
              />
            </div>
            <div>
              <Label>Adresse mandataire</Label>
              <Input
                value={formData.general.mandataireAdresse}
                onChange={(e) => updateGeneral('mandataireAdresse', e.target.value)}
              />
            </div>
            <div>
              <Label>Email mandataire</Label>
              <Input
                type="email"
                value={formData.general.mandataireEmail}
                onChange={(e) => updateGeneral('mandataireEmail', e.target.value)}
              />
            </div>
            <div>
              <Label>Téléphone mandataire</Label>
              <Input
                value={formData.general.mandataireTel}
                onChange={(e) => updateGeneral('mandataireTel', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Relevé des compteurs */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <CardTitle>Relevé des compteurs</CardTitle>
        <CardContent>
          <div style={{ marginBottom: '1rem' }}>
            <Label>Date de relevé</Label>
            <Input
              type="date"
              value={formData.compteurs.dateReleve}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                compteurs: { ...prev.compteurs, dateReleve: e.target.value }
              }))}
            />
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Désignation</th>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Relevé</th>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>N° Compteur</th>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Notes</th>
                <th style={{ padding: '0.5rem' }}></th>
              </tr>
            </thead>
            <tbody>
              {formData.compteurs.compteurs.map((cpt, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.5rem' }}>
                    <Input
                      value={cpt.designation}
                      onChange={(e) => updateCompteur(idx, 'designation', e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <Input
                      value={cpt.releve}
                      onChange={(e) => updateCompteur(idx, 'releve', e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <Input
                      value={cpt.numeroCompteur}
                      onChange={(e) => updateCompteur(idx, 'numeroCompteur', e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <Input
                      value={cpt.notes}
                      onChange={(e) => updateCompteur(idx, 'notes', e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <Button variant="ghost" onClick={() => removeCompteur(idx)}>
                      <Trash2 size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button variant="ghost" onClick={addCompteur}><Plus size={14} /> Ajouter un compteur</Button>
        </CardContent>
      </Card>

      {/* Fournisseurs */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <CardTitle>Fournisseurs</CardTitle>
        <CardContent>
          <div className="grid grid-4" style={{ gap: '1rem' }}>
            <div>
              <Label>Eau</Label>
              <Input
                value={formData.fournisseurs.eau}
                onChange={(e) => updateFournisseur('eau', e.target.value)}
              />
            </div>
            <div>
              <Label>Électricité</Label>
              <Input
                value={formData.fournisseurs.electricite}
                onChange={(e) => updateFournisseur('electricite', e.target.value)}
              />
            </div>
            <div>
              <Label>Gaz</Label>
              <Input
                value={formData.fournisseurs.gaz}
                onChange={(e) => updateFournisseur('gaz', e.target.value)}
              />
            </div>
            <div>
              <Label>Téléphonie</Label>
              <Input
                value={formData.fournisseurs.telephonie}
                onChange={(e) => updateFournisseur('telephonie', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Remise des clefs */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <CardTitle>Remise des clefs</CardTitle>
        <CardContent>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Désignation</th>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Qté</th>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Date Remise</th>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Notes</th>
                <th style={{ padding: '0.5rem' }}></th>
              </tr>
            </thead>
            <tbody>
              {formData.remiseClefs.items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.5rem' }}>
                    <Input
                      value={item.designation}
                      onChange={(e) => updateRemiseClef(idx, 'designation', e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <Input
                      type="number"
                      value={item.qte}
                      onChange={(e) => updateRemiseClef(idx, 'qte', e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <Input
                      type="date"
                      value={item.dateRemise}
                      onChange={(e) => updateRemiseClef(idx, 'dateRemise', e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <Input
                      value={item.notes}
                      onChange={(e) => updateRemiseClef(idx, 'notes', e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <Button variant="ghost" onClick={() => removeRemiseClef(idx)}>
                      <Trash2 size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button variant="ghost" onClick={addRemiseClef}><Plus size={14} /> Ajouter un élément</Button>
        </CardContent>
      </Card>

      {/* Pièces */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <CardTitle>Pièces</CardTitle>
        <CardContent>
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {Object.values(ROOM_TYPES).map(type => (
              <Button key={type} variant="ghost" onClick={() => addRoom(type)}>
                <Plus size={14} /> {type}
              </Button>
            ))}
          </div>

          {formData.pieces.map(room => (
            <Card key={room.id} style={{ marginBottom: '1.5rem', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                <CardTitle>{room.label}</CardTitle>
                <Button variant="ghost" onClick={() => removeRoom(room.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
              <CardContent style={{ padding: '1rem' }}>
                {/* Détails de la pièce */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Détail de la pièce</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Désignation</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Nature</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Etat général</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Couleur</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Constat</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Notes</th>
                        <th style={{ padding: '0.5rem' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {room.details.map((detail, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '0.5rem' }}>
                            <Input
                              value={detail.designation}
                              onChange={(e) => updateRoomDetail(room.id, idx, 'designation', e.target.value)}
                              style={{ width: '100%', fontSize: '0.875rem' }}
                            />
                          </td>
                          <td style={{ padding: '0.5rem' }}>
                            <Input
                              value={detail.nature}
                              onChange={(e) => updateRoomDetail(room.id, idx, 'nature', e.target.value)}
                              style={{ width: '100%', fontSize: '0.875rem' }}
                            />
                          </td>
                          <td style={{ padding: '0.5rem' }}>
                            <Select
                              value={detail.etatGeneral}
                              onChange={(e) => updateRoomDetail(room.id, idx, 'etatGeneral', e.target.value)}
                              style={{ width: '100%', fontSize: '0.875rem' }}
                            >
                              <option value="">-</option>
                              <option value="Bon">Bon</option>
                              <option value="Moyen">Moyen</option>
                              <option value="Mauvais">Mauvais</option>
                              <option value="Neuf">Neuf</option>
                              <option value="Bon état">Bon état</option>
                            </Select>
                          </td>
                          <td style={{ padding: '0.5rem' }}>
                            <Input
                              value={detail.couleur}
                              onChange={(e) => updateRoomDetail(room.id, idx, 'couleur', e.target.value)}
                              style={{ width: '100%', fontSize: '0.875rem' }}
                            />
                          </td>
                          <td style={{ padding: '0.5rem' }}>
                            <Input
                              value={detail.constat}
                              onChange={(e) => updateRoomDetail(room.id, idx, 'constat', e.target.value)}
                              style={{ width: '100%', fontSize: '0.875rem' }}
                            />
                          </td>
                          <td style={{ padding: '0.5rem' }}>
                            <Input
                              value={detail.notes}
                              onChange={(e) => updateRoomDetail(room.id, idx, 'notes', e.target.value)}
                              style={{ width: '100%', fontSize: '0.875rem' }}
                            />
                          </td>
                          <td style={{ padding: '0.5rem' }}>
                            <Button variant="ghost" onClick={() => removeRoomDetail(room.id, idx)}>
                              <Trash2 size={12} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Button variant="ghost" onClick={() => addRoomDetail(room.id)} style={{ marginTop: '0.5rem' }}>
                    <Plus size={12} /> Ajouter une ligne
                  </Button>
                </div>

                {/* Équipements */}
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Équipement</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Désignation</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Etat Usure</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Fonctionnement</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Constat</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Marque</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Couleur</th>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Notes</th>
                        <th style={{ padding: '0.5rem' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {room.equipements.map((eq) => (
                        <tr key={eq.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '0.5rem' }}>
                            <Input
                              value={eq.designation}
                              onChange={(e) => updateEquipment(room.id, eq.id, 'designation', e.target.value)}
                              style={{ width: '100%', fontSize: '0.875rem' }}
                            />
                          </td>
                          <td style={{ padding: '0.5rem' }}>
                            <Select
                              value={eq.etatUsure}
                              onChange={(e) => updateEquipment(room.id, eq.id, 'etatUsure', e.target.value)}
                              style={{ width: '100%', fontSize: '0.875rem' }}
                            >
                              <option value="">-</option>
                              <option value="Neuf">Neuf</option>
                              <option value="Bon état">Bon état</option>
                              <option value="Moyen">Moyen</option>
                              <option value="Usé">Usé</option>
                            </Select>
                          </td>
                          <td style={{ padding: '0.5rem' }}>
                            <Input
                              value={eq.fonctionnement}
                              onChange={(e) => updateEquipment(room.id, eq.id, 'fonctionnement', e.target.value)}
                              style={{ width: '100%', fontSize: '0.875rem' }}
                            />
                          </td>
                          <td style={{ padding: '0.5rem' }}>
                            <Input
                              value={eq.constat}
                              onChange={(e) => updateEquipment(room.id, eq.id, 'constat', e.target.value)}
                              style={{ width: '100%', fontSize: '0.875rem' }}
                            />
                          </td>
                          <td style={{ padding: '0.5rem' }}>
                            <Input
                              value={eq.marque}
                              onChange={(e) => updateEquipment(room.id, eq.id, 'marque', e.target.value)}
                              style={{ width: '100%', fontSize: '0.875rem' }}
                            />
                          </td>
                          <td style={{ padding: '0.5rem' }}>
                            <Input
                              value={eq.couleur}
                              onChange={(e) => updateEquipment(room.id, eq.id, 'couleur', e.target.value)}
                              style={{ width: '100%', fontSize: '0.875rem' }}
                            />
                          </td>
                          <td style={{ padding: '0.5rem' }}>
                            <Input
                              value={eq.notes}
                              onChange={(e) => updateEquipment(room.id, eq.id, 'notes', e.target.value)}
                              style={{ width: '100%', fontSize: '0.875rem' }}
                            />
                          </td>
                          <td style={{ padding: '0.5rem' }}>
                            <Button variant="ghost" onClick={() => removeEquipment(room.id, eq.id)}>
                              <Trash2 size={12} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Button variant="ghost" onClick={() => addEquipment(room.id)} style={{ marginTop: '0.5rem' }}>
                    <Plus size={12} /> Ajouter un équipement
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Commentaires */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <CardTitle>Commentaires</CardTitle>
        <CardContent>
          <textarea
            className="ui-input"
            rows={4}
            value={formData.commentaires}
            onChange={(e) => setFormData(prev => ({ ...prev, commentaires: e.target.value }))}
            placeholder="Les co-signataires reconnaissent comme exactes les informations mentionnées..."
            style={{ width: '100%', resize: 'vertical' }}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
        <Button variant="ghost" onClick={onCancel}>Annuler</Button>
        <Button onClick={handleSave}>Enregistrer</Button>
      </div>
    </div>
  );
};

export default InspectionForm;

