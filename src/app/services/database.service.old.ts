import { Injectable } from '@angular/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { Car } from '../models/car.model';
import { Document } from '../models/document.model';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  private sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
  private db: SQLiteDBConnection | null = null;
  private readonly DB_NAME = 'car_documents_db';
  private readonly DB_VERSION = 1;
  private isWebPlatform = false;
  constructor() {
    this.isWebPlatform = Capacitor.getPlatform() === 'web';
    console.log(
      `DatabaseService initialized for platform: ${Capacitor.getPlatform()}`
    );
  }
  async initializeDatabase(): Promise<void> {
    try {
      // For web platform, wait for jeep-sqlite to be ready
      if (this.isWebPlatform) {
        try {
          await this.waitForJeepSqlite();
        } catch (error) {
          console.warn(
            'jeep-sqlite not available, running in mock mode:',
            error
          );
          return; // Exit early, use mock data
        }
      }

      // Check if connection already exists
      const isConnectionExist = await this.sqlite.isConnection(
        this.DB_NAME,
        false
      );

      if (!isConnectionExist.result) {
        await this.sqlite.createConnection(
          this.DB_NAME,
          false,
          'no-encryption',
          this.DB_VERSION,
          false
        );
      }

      this.db = await this.sqlite.retrieveConnection(this.DB_NAME, false);
      await this.db.open();
      await this.createTables();

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      // For development, we can continue without database
      if (this.isWebPlatform) {
        console.warn('Running without database for web development');
      }
      this.db = null; // Ensure db is null so mock data is used
    }
  }
  private async waitForJeepSqlite(): Promise<void> {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds timeout

      const checkElement = () => {
        attempts++;
        const jeepSqliteEl = document.querySelector('jeep-sqlite');

        if (jeepSqliteEl && (jeepSqliteEl as any).isConnected) {
          console.log('jeep-sqlite element found and connected');
          resolve();
        } else if (attempts >= maxAttempts) {
          console.warn('jeep-sqlite element not found after timeout');
          reject(new Error('jeep-sqlite element not available'));
        } else {
          setTimeout(checkElement, 100);
        }
      };
      checkElement();
    });
  }

  private async createTables(): Promise<void> {
    if (!this.db) return;

    const carTableSQL = `
      CREATE TABLE IF NOT EXISTS cars (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        matricule TEXT NOT NULL UNIQUE,
        marque TEXT NOT NULL,
        model TEXT NOT NULL,
        chauffeur TEXT NOT NULL,
        tel TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const documentTableSQL = `
      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reference TEXT NOT NULL UNIQUE,
        typeDocument TEXT NOT NULL,
        matriculeCar TEXT NOT NULL,
        dateDebut TEXT NOT NULL,
        dateFin TEXT NOT NULL,
        documentActive INTEGER DEFAULT 1,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (matriculeCar) REFERENCES cars (matricule)
      );
    `;

    const settingsTableSQL = `
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        notificationDays INTEGER DEFAULT 7
      );
    `;

    try {
      await this.db.execute(carTableSQL);
      await this.db.execute(documentTableSQL);
      await this.db.execute(settingsTableSQL);

      // Insert default settings if not exists
      const result = await this.db.query(
        'SELECT COUNT(*) as count FROM settings'
      );
      if (result.values && result.values[0].count === 0) {
        await this.db.run('INSERT INTO settings (notificationDays) VALUES (7)');
      }
    } catch (error) {
      console.error('Error creating tables:', error);
    }
  }
  // Car operations
  async addCar(car: Omit<Car, 'id'>): Promise<boolean> {
    if (!this.db) {
      console.warn('Database not available, returning mock success');
      return true;
    }

    try {
      const query = `
        INSERT INTO cars (matricule, marque, model, chauffeur, tel, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `;
      await this.db.run(query, [
        car.matricule,
        car.marque,
        car.model,
        car.chauffeur,
        car.tel,
      ]);
      return true;
    } catch (error) {
      console.error('Error adding car:', error);
      return false;
    }
  }

  async getCars(): Promise<Car[]> {
    if (!this.db) {
      // Return mock data for development
      return [
        {
          id: '1',
          matricule: '123-ABC-456',
          marque: 'Toyota',
          model: 'Corolla',
          chauffeur: 'Ahmed Benali',
          tel: '+212 6 12 34 56 78',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          matricule: '789-DEF-012',
          marque: 'Renault',
          model: 'Clio',
          chauffeur: 'Sara Alami',
          tel: '+212 6 87 65 43 21',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
    }

    try {
      const result = await this.db.query(
        'SELECT * FROM cars ORDER BY createdAt DESC'
      );
      return result.values || [];
    } catch (error) {
      console.error('Error getting cars:', error);
      return [];
    }
  }

  async updateCar(car: Car): Promise<boolean> {
    if (!this.db || !car.id) return false;

    try {
      const query = `
        UPDATE cars 
        SET matricule = ?, marque = ?, model = ?, chauffeur = ?, tel = ?, updatedAt = datetime('now')
        WHERE id = ?
      `;
      await this.db.run(query, [
        car.matricule,
        car.marque,
        car.model,
        car.chauffeur,
        car.tel,
        car.id,
      ]);
      return true;
    } catch (error) {
      console.error('Error updating car:', error);
      return false;
    }
  }
  async deleteCar(id: string): Promise<boolean> {
    if (!this.db) {
      console.warn('Database not available, returning mock success');
      return true;
    }

    try {
      // First delete all documents for this car
      await this.db.run(
        'DELETE FROM documents WHERE matriculeCar = (SELECT matricule FROM cars WHERE id = ?)',
        [id]
      );
      // Then delete the car
      await this.db.run('DELETE FROM cars WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Error deleting car:', error);
      return false;
    }
  }

  // Document operations
  async addDocument(document: Omit<Document, 'id'>): Promise<boolean> {
    if (!this.db) {
      console.warn('Database not available, returning mock success');
      return true;
    }

    try {
      const query = `
        INSERT INTO documents (reference, typeDocument, matriculeCar, dateDebut, dateFin, documentActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `;
      await this.db.run(query, [
        document.reference,
        document.typeDocument,
        document.matriculeCar,
        document.dateDebut.toISOString(),
        document.dateFin.toISOString(),
        document.documentActive ? 1 : 0,
      ]);
      return true;
    } catch (error) {
      console.error('Error adding document:', error);
      return false;
    }
  }
  async getDocuments(): Promise<Document[]> {
    if (!this.db) {
      // Return mock data for development
      const today = new Date();
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 6);

      const expiredDate = new Date();
      expiredDate.setMonth(expiredDate.getMonth() - 1);

      const soonExpiring = new Date();
      soonExpiring.setDate(soonExpiring.getDate() + 15);

      return [
        {
          id: '1',
          reference: 'ASS-001-2024',
          typeDocument: 'Assurance',
          matriculeCar: '123-ABC-456',
          dateDebut: today,
          dateFin: futureDate,
          documentActive: true,
          createdAt: today,
          updatedAt: today,
        },
        {
          id: '2',
          reference: 'CT-002-2024',
          typeDocument: 'Contrôle Technique',
          matriculeCar: '123-ABC-456',
          dateDebut: today,
          dateFin: soonExpiring,
          documentActive: true,
          createdAt: today,
          updatedAt: today,
        },
        {
          id: '3',
          reference: 'VIG-003-2023',
          typeDocument: 'Vignette',
          matriculeCar: '789-DEF-012',
          dateDebut: expiredDate,
          dateFin: expiredDate,
          documentActive: false,
          createdAt: today,
          updatedAt: today,
        },
      ];
    }

    try {
      const result = await this.db.query(
        'SELECT * FROM documents ORDER BY dateFin ASC'
      );
      return (result.values || []).map((doc) => ({
        ...doc,
        dateDebut: new Date(doc.dateDebut),
        dateFin: new Date(doc.dateFin),
        documentActive: doc.documentActive === 1,
      }));
    } catch (error) {
      console.error('Error getting documents:', error);
      return [];
    }
  }

  async updateDocument(document: Document): Promise<boolean> {
    if (!this.db || !document.id) return false;

    try {
      const query = `
        UPDATE documents 
        SET reference = ?, typeDocument = ?, matriculeCar = ?, dateDebut = ?, dateFin = ?, documentActive = ?, updatedAt = datetime('now')
        WHERE id = ?
      `;
      await this.db.run(query, [
        document.reference,
        document.typeDocument,
        document.matriculeCar,
        document.dateDebut.toISOString(),
        document.dateFin.toISOString(),
        document.documentActive ? 1 : 0,
        document.id,
      ]);
      return true;
    } catch (error) {
      console.error('Error updating document:', error);
      return false;
    }
  }

  async deleteDocument(id: string): Promise<boolean> {
    if (!this.db) return false;

    try {
      await this.db.run('DELETE FROM documents WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  }

  async getExpiringDocuments(days: number = 7): Promise<Document[]> {
    if (!this.db) return [];

    try {
      const query = `
        SELECT * FROM documents 
        WHERE documentActive = 1 
        AND julianday(dateFin) - julianday('now') <= ? 
        AND julianday(dateFin) - julianday('now') >= 0
        ORDER BY dateFin ASC
      `;
      const result = await this.db.query(query, [days]);
      return (result.values || []).map((doc) => ({
        ...doc,
        dateDebut: new Date(doc.dateDebut),
        dateFin: new Date(doc.dateFin),
        documentActive: doc.documentActive === 1,
      }));
    } catch (error) {
      console.error('Error getting expiring documents:', error);
      return [];
    }
  }

  async getExpiredDocuments(): Promise<Document[]> {
    if (!this.db) return [];

    try {
      const query = `
        SELECT * FROM documents 
        WHERE documentActive = 1 
        AND julianday(dateFin) < julianday('now')
        ORDER BY dateFin DESC
      `;
      const result = await this.db.query(query);
      return (result.values || []).map((doc) => ({
        ...doc,
        dateDebut: new Date(doc.dateDebut),
        dateFin: new Date(doc.dateFin),
        documentActive: doc.documentActive === 1,
      }));
    } catch (error) {
      console.error('Error getting expired documents:', error);
      return [];
    }
  }

  // Settings operations
  async getSettings(): Promise<{ notificationDays: number }> {
    if (!this.db) return { notificationDays: 7 };

    try {
      const result = await this.db.query('SELECT * FROM settings LIMIT 1');
      if (result.values && result.values.length > 0) {
        return { notificationDays: result.values[0].notificationDays };
      }
      return { notificationDays: 7 };
    } catch (error) {
      console.error('Error getting settings:', error);
      return { notificationDays: 7 };
    }
  }

  async updateSettings(notificationDays: number): Promise<boolean> {
    if (!this.db) return false;

    try {
      await this.db.run('UPDATE settings SET notificationDays = ?', [
        notificationDays,
      ]);
      return true;
    } catch (error) {
      console.error('Error updating settings:', error);
      return false;
    }
  }

  async searchDocuments(searchTerm: string): Promise<Document[]> {
    if (!this.db) return [];

    try {
      const query = `
        SELECT d.*, c.chauffeur 
        FROM documents d
        LEFT JOIN cars c ON d.matriculeCar = c.matricule
        WHERE d.matriculeCar LIKE ? 
        OR d.typeDocument LIKE ? 
        OR c.chauffeur LIKE ?
        ORDER BY d.dateFin ASC
      `;
      const searchPattern = `%${searchTerm}%`;
      const result = await this.db.query(query, [
        searchPattern,
        searchPattern,
        searchPattern,
      ]);
      return (result.values || []).map((doc) => ({
        id: doc.id,
        reference: doc.reference,
        typeDocument: doc.typeDocument,
        matriculeCar: doc.matriculeCar,
        dateDebut: new Date(doc.dateDebut),
        dateFin: new Date(doc.dateFin),
        documentActive: doc.documentActive === 1,
        createdAt: doc.createdAt ? new Date(doc.createdAt) : undefined,
        updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : undefined,
      }));
    } catch (error) {
      console.error('Error searching documents:', error);
      return [];
    }
  }
}
