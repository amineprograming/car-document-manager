import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonSearchbar,
  IonChip,
  IonLabel,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonFab,
  IonFabButton,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  add,
  create,
  trash,
  car,
  calendar,
  documentText,
  checkmarkCircle,
  warningOutline,
  closeCircle,
} from 'ionicons/icons';
import { Document } from '../models/document.model';
import { DatabaseService } from '../services/firebase-database.service';

@Component({
  selector: 'app-documents',
  templateUrl: './documents.page.html',
  styleUrls: ['./documents.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonSearchbar,
    IonChip,
    IonLabel,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonFab,
    IonFabButton,
    CommonModule,
    FormsModule,
  ],
})
export class DocumentsPage implements OnInit {
  documents: Document[] = [];
  filteredDocuments: Document[] = [];
  searchTerm: string = '';
  activeFilter: string = 'all';

  constructor(
    private databaseService: DatabaseService,
    private toastController: ToastController
  ) {
    addIcons({
      add,
      create,
      trash,
      car,
      calendar,
      documentText,
      checkmarkCircle,
      warningOutline,
      closeCircle,
    });
  }

  async ngOnInit() {
    await this.loadDocuments();
  }

  async loadDocuments() {
    try {
      this.documents = await this.databaseService.getDocuments();
      this.filterDocuments();
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
    }
  }

  filterDocuments() {
    let filtered = this.documents;

    // Filter by search term
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.typeDocument.toLowerCase().includes(searchLower) ||
          doc.reference.toLowerCase().includes(searchLower)
      );
    }

    // Filter by status
    switch (this.activeFilter) {
      case 'active':
        filtered = filtered.filter((doc) => doc.documentActive);
        break;
      case 'expired':
        filtered = filtered.filter((doc) => {
          const today = new Date();
          const expiration =
            typeof doc.dateFin === 'string'
              ? new Date(doc.dateFin)
              : doc.dateFin;
          return expiration < today;
        });
        break;
      case 'expiring':
        filtered = filtered.filter((doc) => {
          const today = new Date();
          const expiration =
            typeof doc.dateFin === 'string'
              ? new Date(doc.dateFin)
              : doc.dateFin;
          const diffTime = expiration.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= 30 && diffDays > 0;
        });
        break;
    }

    this.filteredDocuments = filtered;
  }

  setFilter(filter: string) {
    this.activeFilter = filter;
    this.filterDocuments();
  }
  getExpirationStatus(dateFin: Date | string) {
    const today = new Date();
    const expiration =
      typeof dateFin === 'string' ? new Date(dateFin) : dateFin;
    const diffTime = expiration.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { message: 'Expiré', color: 'danger' };
    } else if (diffDays <= 30) {
      return { message: `Expire dans ${diffDays} jour(s)`, color: 'warning' };
    } else {
      return { message: 'Actif', color: 'success' };
    }
  }

  getStatusIcon(dateFin: Date | string): string {
    const today = new Date();
    const expiration =
      typeof dateFin === 'string' ? new Date(dateFin) : dateFin;
    const diffTime = expiration.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'close-circle';
    } else if (diffDays <= 30) {
      return 'warning-outline';
    } else {
      return 'checkmark-circle';
    }
  }

  async addDocument() {
    // TODO: Navigate to add document page
    const toast = await this.toastController.create({
      message: 'Fonctionnalité à implémenter',
      duration: 2000,
      position: 'bottom',
    });
    await toast.present();
  }

  async editDocument(document: Document) {
    // TODO: Navigate to edit document page
    const toast = await this.toastController.create({
      message: 'Fonctionnalité à implémenter',
      duration: 2000,
      position: 'bottom',
    });
    await toast.present();
  }

  async deleteDocument(document: Document) {
    // TODO: Implement delete confirmation and action
    const toast = await this.toastController.create({
      message: 'Fonctionnalité à implémenter',
      duration: 2000,
      position: 'bottom',
    });
    await toast.present();
  }
}
