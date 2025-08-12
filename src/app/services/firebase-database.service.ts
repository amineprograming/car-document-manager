import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from '@angular/fire/firestore';
import { Timestamp } from 'firebase/firestore';
import { Car } from '../models/car.model';
import { Document } from '../models/document.model';
import { AppConfig } from './config.service';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  private firestore = inject(Firestore);

  constructor() {
    console.log('DatabaseService initialized with Firebase Firestore');
  }

  // Car operations
  async addCar(car: Omit<Car, 'id'>): Promise<boolean> {
    try {
      const carsCollection = collection(this.firestore, 'cars');
      const carData = {
        ...car,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      await addDoc(carsCollection, carData);
      return true;
    } catch (error) {
      console.error('Error adding car:', error);
      return false;
    }
  }

  async getCars(): Promise<Car[]> {
    try {
      const carsCollection = collection(this.firestore, 'cars');
      const q = query(carsCollection, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()['createdAt']?.toDate() || new Date(),
        updatedAt: doc.data()['updatedAt']?.toDate() || new Date(),
      })) as Car[];
    } catch (error: any) {
      console.error('Error getting cars:', error);

      // Provide more specific error messages
      if (error?.code === 'permission-denied') {
        throw new Error(
          'Permission denied: You need to authenticate or check Firestore security rules'
        );
      } else if (error?.code === 'unavailable') {
        throw new Error(
          'Firestore is currently unavailable. Please try again later.'
        );
      } else {
        throw new Error(
          'Failed to load cars: ' + (error?.message || 'Unknown error')
        );
      }
    }
  }

  async updateCar(car: Car): Promise<boolean> {
    if (!car.id) return false;

    try {
      const carDoc = doc(this.firestore, 'cars', car.id);
      const updateData = {
        matricule: car.matricule,
        marque: car.marque,
        model: car.model,
        chauffeur: car.chauffeur,
        tel: car.tel,
        updatedAt: Timestamp.now(),
      };
      await updateDoc(carDoc, updateData);
      return true;
    } catch (error) {
      console.error('Error updating car:', error);
      return false;
    }
  }

  async deleteCar(id: string): Promise<boolean> {
    try {
      // First delete all documents for this car
      const documentsCollection = collection(this.firestore, 'documents');
      const car = await this.getCarById(id);
      if (car) {
        const q = query(
          documentsCollection,
          where('matriculeCar', '==', car.matricule)
        );
        const documentsSnapshot = await getDocs(q);

        // Delete all documents for this car
        for (const docRef of documentsSnapshot.docs) {
          await deleteDoc(doc(this.firestore, 'documents', docRef.id));
        }
      }

      // Then delete the car
      const carDoc = doc(this.firestore, 'cars', id);
      await deleteDoc(carDoc);
      return true;
    } catch (error) {
      console.error('Error deleting car:', error);
      return false;
    }
  }

  private async getCarById(id: string): Promise<Car | null> {
    try {
      const cars = await this.getCars();
      return cars.find((car) => car.id === id) || null;
    } catch (error) {
      console.error('Error getting car by ID:', error);
      return null;
    }
  }

  // Document operations
  async addDocument(document: Omit<Document, 'id'>): Promise<boolean> {
    try {
      const documentsCollection = collection(this.firestore, 'documents');
      const documentData = {
        ...document,
        dateDebut: Timestamp.fromDate(document.dateDebut),
        dateFin: Timestamp.fromDate(document.dateFin),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      await addDoc(documentsCollection, documentData);
      return true;
    } catch (error) {
      console.error('Error adding document:', error);
      return false;
    }
  }

  async getDocuments(): Promise<Document[]> {
    try {
      const documentsCollection = collection(this.firestore, 'documents');
      const q = query(documentsCollection, orderBy('dateFin', 'asc'));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        dateDebut: doc.data()['dateDebut']?.toDate() || new Date(),
        dateFin: doc.data()['dateFin']?.toDate() || new Date(),
        createdAt: doc.data()['createdAt']?.toDate() || new Date(),
        updatedAt: doc.data()['updatedAt']?.toDate() || new Date(),
      })) as Document[];
    } catch (error: any) {
      console.error('Error getting documents:', error);

      // Provide more specific error messages
      if (error?.code === 'permission-denied') {
        throw new Error(
          'Permission denied: You need to authenticate or check Firestore security rules'
        );
      } else if (error?.code === 'unavailable') {
        throw new Error(
          'Firestore is currently unavailable. Please try again later.'
        );
      } else {
        throw new Error(
          'Failed to load documents: ' + (error?.message || 'Unknown error')
        );
      }
    }
  }

  async updateDocument(document: Document): Promise<boolean> {
    if (!document.id) return false;

    try {
      const documentDoc = doc(this.firestore, 'documents', document.id);
      const updateData = {
        typeDocument: document.typeDocument,
        matriculeCar: document.matriculeCar,
        dateDebut: Timestamp.fromDate(document.dateDebut),
        dateFin: Timestamp.fromDate(document.dateFin),
        documentActive: document.documentActive,
        updatedAt: Timestamp.now(),
      };
      await updateDoc(documentDoc, updateData);
      return true;
    } catch (error) {
      console.error('Error updating document:', error);
      return false;
    }
  }

  async deleteDocument(id: string): Promise<boolean> {
    try {
      const documentDoc = doc(this.firestore, 'documents', id);
      await deleteDoc(documentDoc);
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  }

  async getExpiringDocuments(days: number = 7): Promise<Document[]> {
    try {
      const documentsCollection = collection(this.firestore, 'documents');
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(now.getDate() + days);

      // Simplified query to avoid index requirements
      const q = query(documentsCollection, where('documentActive', '==', true));

      const querySnapshot = await getDocs(q);

      // Filter and sort in memory instead of using complex Firestore queries
      const documents = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        dateDebut: doc.data()['dateDebut']?.toDate() || new Date(),
        dateFin: doc.data()['dateFin']?.toDate() || new Date(),
        createdAt: doc.data()['createdAt']?.toDate() || new Date(),
        updatedAt: doc.data()['updatedAt']?.toDate() || new Date(),
      })) as Document[];

      const expiringDocs = documents
        .filter(
          (doc: Document) => doc.dateFin >= now && doc.dateFin <= futureDate
        ) // Filter documents expiring within the specified days
        .sort(
          (a: Document, b: Document) =>
            a.dateFin.getTime() - b.dateFin.getTime()
        ); // Sort by date ascending

      return expiringDocs;
    } catch (error: any) {
      console.error('Error getting expiring documents:', error);

      // Provide more specific error messages
      if (error?.code === 'permission-denied') {
        throw new Error(
          'Permission denied: You need to authenticate or check Firestore security rules'
        );
      } else if (error?.code === 'unavailable') {
        throw new Error(
          'Firestore is currently unavailable. Please try again later.'
        );
      } else {
        throw new Error(
          'Failed to load expiring documents: ' +
            (error?.message || 'Unknown error')
        );
      }
    }
  }

  async getExpiredDocuments(): Promise<Document[]> {
    try {
      const documentsCollection = collection(this.firestore, 'documents');
      const now = new Date();

      // Simplified query to avoid index requirements
      const q = query(documentsCollection, where('documentActive', '==', true));

      const querySnapshot = await getDocs(q);

      // Filter and sort in memory instead of using Firestore orderBy
      const documents = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        dateDebut: doc.data()['dateDebut']?.toDate() || new Date(),
        dateFin: doc.data()['dateFin']?.toDate() || new Date(),
        createdAt: doc.data()['createdAt']?.toDate() || new Date(),
        updatedAt: doc.data()['updatedAt']?.toDate() || new Date(),
      })) as Document[];

      const expiredDocs = documents
        .filter((doc: Document) => doc.dateFin < now) // Filter expired documents
        .sort(
          (a: Document, b: Document) =>
            b.dateFin.getTime() - a.dateFin.getTime()
        ); // Sort by date descending

      return expiredDocs;
    } catch (error: any) {
      console.error('Error getting expired documents:', error);

      // Provide more specific error messages
      if (error?.code === 'permission-denied') {
        throw new Error(
          'Permission denied: You need to authenticate or check Firestore security rules'
        );
      } else if (error?.code === 'unavailable') {
        throw new Error(
          'Firestore is currently unavailable. Please try again later.'
        );
      } else {
        throw new Error(
          'Failed to load expired documents: ' +
            (error?.message || 'Unknown error')
        );
      }
    }
  }

  // Settings operations (stored in Firestore as well)
  async getUserSettings(): Promise<AppConfig> {
    try {
      const settingsCollection = collection(this.firestore, 'userSettings');
      const querySnapshot = await getDocs(settingsCollection);

      if (!querySnapshot.empty) {
        const settingsDoc = querySnapshot.docs[0];
        const data = settingsDoc.data();
        return {
          notificationDays: data['notificationDays'] || 30,
          notificationHours: data['notificationHours'] || [9, 18],
          notificationIntervals: data['notificationIntervals'] || [7, 3, 1, 0],
          enableNotifications:
            data['enableNotifications'] !== undefined
              ? data['enableNotifications']
              : true,
        };
      }

      // Create default settings if none exist
      const defaultSettings: AppConfig = {
        notificationDays: 30,
        notificationHours: [9, 18],
        notificationIntervals: [7, 3, 1, 0],
        enableNotifications: true,
      };
      await addDoc(settingsCollection, defaultSettings);
      return defaultSettings;
    } catch (error) {
      console.error('Error getting user settings:', error);
      // Return default settings in case of error
      return {
        notificationDays: 30,
        notificationHours: [9, 18],
        notificationIntervals: [7, 3, 1, 0],
        enableNotifications: true,
      };
    }
  }

  async saveUserSettings(settings: AppConfig): Promise<boolean> {
    try {
      const settingsCollection = collection(this.firestore, 'userSettings');
      const querySnapshot = await getDocs(settingsCollection);

      if (!querySnapshot.empty) {
        const settingsDoc = doc(
          this.firestore,
          'userSettings',
          querySnapshot.docs[0].id
        );
        await updateDoc(settingsDoc, {
          notificationDays: settings.notificationDays,
          notificationHours: settings.notificationHours,
          enableNotifications: settings.enableNotifications,
          updatedAt: Timestamp.now(),
        });
      } else {
        await addDoc(settingsCollection, {
          ...settings,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }

      return true;
    } catch (error) {
      console.error('Error saving user settings:', error);
      return false;
    }
  }

  // Legacy settings methods - keeping for backward compatibility
  async getSettings(): Promise<{ notificationDays: number }> {
    const userSettings = await this.getUserSettings();
    return { notificationDays: userSettings.notificationDays };
  }

  async updateSettings(notificationDays: number): Promise<boolean> {
    try {
      const currentSettings = await this.getUserSettings();
      const updatedSettings: AppConfig = {
        ...currentSettings,
        notificationDays: notificationDays,
      };
      return await this.saveUserSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
      return false;
    }
  }
  async searchDocuments(searchTerm: string): Promise<Document[]> {
    try {
      const documentsCollection = collection(this.firestore, 'documents');
      const querySnapshot = await getDocs(documentsCollection);

      const searchTermLower = searchTerm.toLowerCase();

      const documents = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        dateDebut: doc.data()['dateDebut']?.toDate() || new Date(),
        dateFin: doc.data()['dateFin']?.toDate() || new Date(),
        createdAt: doc.data()['createdAt']?.toDate() || new Date(),
        updatedAt: doc.data()['updatedAt']?.toDate() || new Date(),
      })) as Document[];

      return documents
        .filter(
          (doc: Document) =>
            doc.matriculeCar.toLowerCase().includes(searchTermLower) ||
            doc.typeDocument.toLowerCase().includes(searchTermLower)
        )
        .sort(
          (a: Document, b: Document) =>
            a.dateFin.getTime() - b.dateFin.getTime()
        );
    } catch (error) {
      console.error('Error searching documents:', error);
      return [];
    }
  }
}
