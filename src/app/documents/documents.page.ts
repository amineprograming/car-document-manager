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
  AlertController,
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
import { Car } from '../models/car.model';
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
  cars: Car[] = [];
  searchTerm: string = '';
  activeFilter: string = 'all';

  constructor(
    private databaseService: DatabaseService,
    private toastController: ToastController,
    private alertController: AlertController
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
    await this.loadCars();
  }

  async loadDocuments() {
    try {
      this.documents = await this.databaseService.getDocuments();
      this.filterDocuments();
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
    }
  }

  async loadCars() {
    try {
      this.cars = await this.databaseService.getCars();
    } catch (error) {
      console.error('Erreur lors du chargement des véhicules:', error);
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
          doc.reference.toLowerCase().includes(searchLower) ||
          doc.matriculeCar.toLowerCase().includes(searchLower)
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
    if (this.cars.length === 0) {
      await this.showToast(
        "Aucun véhicule disponible. Veuillez d'abord ajouter un véhicule.",
        'warning'
      );
      return;
    }

    // First step: Get document details including matricule selection
    const matriculeInputs: any[] = [
      {
        name: 'reference',
        type: 'text',
        placeholder: 'Référence du document (optionnel)',
      },
      {
        name: 'typeDocument',
        type: 'text',
        placeholder: 'Type de document *',
      },
      {
        name: 'dateDebut',
        type: 'date',
        placeholder: 'Date de début',
        value: new Date().toISOString().split('T')[0],
      },
      {
        name: 'dateFin',
        type: 'date',
        placeholder: 'Date de fin *',
      },
    ];

    // Add radio buttons for each car matricule
    this.cars.forEach((car, index) => {
      matriculeInputs.push({
        name: 'matricule',
        type: 'radio',
        label: car.matricule,
        value: car.matricule,
        checked: index === 0, // Select first car by default
      });
    });

    const alert = await this.alertController.create({
      header: 'Ajouter un Document',
      inputs: matriculeInputs,
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel',
        },
        {
          text: 'Ajouter',
          handler: async (data) => {
            if (!data.typeDocument || !data.dateFin || !data.matricule) {
              await this.showToast(
                'Veuillez remplir tous les champs obligatoires',
                'danger'
              );
              return false;
            }

            const document: Omit<Document, 'id'> = {
              reference: data.reference || '',
              typeDocument: data.typeDocument,
              matriculeCar: data.matricule,
              dateDebut: data.dateDebut ? new Date(data.dateDebut) : new Date(),
              dateFin: new Date(data.dateFin),
              documentActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            const success = await this.databaseService.addDocument(document);
            if (success) {
              await this.showToast('Document ajouté avec succès', 'success');
              await this.loadDocuments();
            } else {
              await this.showToast(
                "Erreur lors de l'ajout du document",
                'danger'
              );
            }
            return true;
          },
        },
      ],
    });

    await alert.present();
  }

  async editDocument(document: Document) {
    const editInputs: any[] = [
      {
        name: 'reference',
        type: 'text',
        placeholder: 'Référence du document (optionnel)',
        value: document.reference,
      },
      {
        name: 'typeDocument',
        type: 'text',
        placeholder: 'Type de document *',
        value: document.typeDocument,
      },
      {
        name: 'dateDebut',
        type: 'date',
        placeholder: 'Date de début',
        value: this.formatDateForInput(document.dateDebut),
      },
      {
        name: 'dateFin',
        type: 'date',
        placeholder: 'Date de fin *',
        value: this.formatDateForInput(document.dateFin),
      },
    ];

    // Add radio buttons for each car matricule
    this.cars.forEach((car) => {
      editInputs.push({
        name: 'matricule',
        type: 'radio',
        label: car.matricule,
        value: car.matricule,
        checked: car.matricule === document.matriculeCar, // Select current car by default
      });
    });

    const alert = await this.alertController.create({
      header: 'Modifier le Document',
      inputs: editInputs,
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel',
        },
        {
          text: 'Modifier',
          handler: async (data) => {
            if (!data.typeDocument || !data.dateFin || !data.matricule) {
              await this.showToast(
                'Veuillez remplir tous les champs obligatoires',
                'danger'
              );
              return false;
            }

            const updatedDocument: Document = {
              ...document,
              reference: data.reference || '',
              typeDocument: data.typeDocument,
              matriculeCar: data.matricule,
              dateDebut: new Date(data.dateDebut),
              dateFin: new Date(data.dateFin),
              updatedAt: new Date(),
            };

            const success = await this.databaseService.updateDocument(
              updatedDocument
            );
            if (success) {
              await this.showToast('Document modifié avec succès', 'success');
              await this.loadDocuments();
            } else {
              await this.showToast(
                'Erreur lors de la modification du document',
                'danger'
              );
            }
            return true;
          },
        },
      ],
    });

    await alert.present();
  }

  async deleteDocument(document: Document) {
    const alert = await this.alertController.create({
      header: 'Supprimer le Document',
      message: `Êtes-vous sûr de vouloir supprimer le document "${document.reference}" ?`,
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel',
        },
        {
          text: 'Supprimer',
          role: 'destructive',
          handler: async () => {
            if (!document.id) {
              await this.showToast('Erreur: ID du document manquant', 'danger');
              return;
            }

            const success = await this.databaseService.deleteDocument(
              document.id
            );
            if (success) {
              await this.showToast('Document supprimé avec succès', 'success');
              await this.loadDocuments();
            } else {
              await this.showToast(
                'Erreur lors de la suppression du document',
                'danger'
              );
            }
          },
        },
      ],
    });

    await alert.present();
  }

  private async showToast(
    message: string,
    color: 'success' | 'danger' | 'warning' = 'success'
  ) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color,
    });
    await toast.present();
  }

  private formatDateForInput(date: Date | string): string {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date:', error);
      return new Date().toISOString().split('T')[0];
    }
  }
}
