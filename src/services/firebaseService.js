import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '../components/firebase-config';

// ===== PROPERTIES =====
export const getProperties = async (ownerId) => {
  try {
    const q = query(collection(db, 'properties'), where('ownerId', '==', ownerId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Erreur getProperties:', error);
    throw error;
  }
};

export const addProperty = async (ownerId, propertyData) => {
  try {
    const docRef = await addDoc(collection(db, 'properties'), {
      ...propertyData,
      ownerId,
      createdAt: Timestamp.now()
    });
    return { id: docRef.id, ...propertyData };
  } catch (error) {
    console.error('Erreur addProperty:', error);
    throw error;
  }
};

export const updateProperty = async (propertyId, propertyData) => {
  try {
    await updateDoc(doc(db, 'properties', propertyId), propertyData);
  } catch (error) {
    console.error('Erreur updateProperty:', error);
    throw error;
  }
};

export const deleteProperty = async (propertyId) => {
  try {
    await deleteDoc(doc(db, 'properties', propertyId));
  } catch (error) {
    console.error('Erreur deleteProperty:', error);
    throw error;
  }
};

// ===== TENANTS =====
export const getTenants = async (ownerId) => {
  try {
    const q = query(collection(db, 'tenants'), where('ownerId', '==', ownerId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Erreur getTenants:', error);
    throw error;
  }
};

export const addTenant = async (ownerId, tenantData) => {
  try {
    // Validation
    if (!tenantData.name || !tenantData.email || !tenantData.phone) {
      throw new Error('Nom, email et téléphone sont obligatoires');
    }
    if (!tenantData.email.includes('@')) {
      throw new Error('Email invalide');
    }
    
    const docRef = await addDoc(collection(db, 'tenants'), {
      ...tenantData,
      ownerId,
      createdAt: Timestamp.now()
    });
    return { id: docRef.id, ...tenantData };
  } catch (error) {
    console.error('Erreur addTenant:', error);
    throw error;
  }
};

export const updateTenant = async (tenantId, tenantData) => {
  try {
    await updateDoc(doc(db, 'tenants', tenantId), tenantData);
  } catch (error) {
    console.error('Erreur updateTenant:', error);
    throw error;
  }
};

export const deleteTenant = async (tenantId) => {
  try {
    await deleteDoc(doc(db, 'tenants', tenantId));
  } catch (error) {
    console.error('Erreur deleteTenant:', error);
    throw error;
  }
};

// ===== PAYMENTS =====
export const getPayments = async (ownerId) => {
  try {
    const q = query(collection(db, 'payments'), where('ownerId', '==', ownerId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Erreur getPayments:', error);
    throw error;
  }
};

export const addPayment = async (ownerId, paymentData) => {
  try {
    const docRef = await addDoc(collection(db, 'payments'), {
      ...paymentData,
      ownerId,
      createdAt: Timestamp.now()
    });
    return { id: docRef.id, ...paymentData };
  } catch (error) {
    console.error('Erreur addPayment:', error);
    throw error;
  }
};

export const updatePayment = async (paymentId, paymentData) => {
  try {
    await updateDoc(doc(db, 'payments', paymentId), paymentData);
  } catch (error) {
    console.error('Erreur updatePayment:', error);
    throw error;
  }
};

// ===== MAINTENANCE =====
export const getMaintenance = async (ownerId) => {
  try {
    const q = query(collection(db, 'maintenance'), where('ownerId', '==', ownerId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Erreur getMaintenance:', error);
    throw error;
  }
};

export const addMaintenance = async (ownerId, maintenanceData) => {
  try {
    const docRef = await addDoc(collection(db, 'maintenance'), {
      ...maintenanceData,
      ownerId,
      createdAt: Timestamp.now()
    });
    return { id: docRef.id, ...maintenanceData };
  } catch (error) {
    console.error('Erreur addMaintenance:', error);
    throw error;
  }
};

export const updateMaintenance = async (maintenanceId, maintenanceData) => {
  try {
    await updateDoc(doc(db, 'maintenance', maintenanceId), maintenanceData);
  } catch (error) {
    console.error('Erreur updateMaintenance:', error);
    throw error;
  }
};

export const deleteMaintenance = async (maintenanceId) => {
  try {
    await deleteDoc(doc(db, 'maintenance', maintenanceId));
  } catch (error) {
    console.error('Erreur deleteMaintenance:', error);
    throw error;
  }
};

// ===== INSPECTIONS =====
export const getInspections = async (ownerId) => {
  try {
    const q = query(collection(db, 'inspections'), where('ownerId', '==', ownerId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Erreur getInspections:', error);
    throw error;
  }
};

export const addInspection = async (ownerId, inspectionData) => {
  try {
    const docRef = await addDoc(collection(db, 'inspections'), {
      ...inspectionData,
      ownerId,
      createdAt: Timestamp.now()
    });
    return { id: docRef.id, ...inspectionData };
  } catch (error) {
    console.error('Erreur addInspection:', error);
    throw error;
  }
};

export const updateInspection = async (inspectionId, inspectionData) => {
  try {
    await updateDoc(doc(db, 'inspections', inspectionId), inspectionData);
  } catch (error) {
    console.error('Erreur updateInspection:', error);
    throw error;
  }
};
