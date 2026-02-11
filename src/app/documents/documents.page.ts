import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
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
  ModalController,
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
  folderOpen,
  close,
  shieldCheckmark,
} from 'ionicons/icons';
import { Document } from '../models/document.model';
import { Car } from '../models/car.model';
import { DatabaseService } from '../services/firebase-database.service';
import { DocumentModalComponent } from './document-modal.component';

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
export class DocumentsPage implements OnInit, OnDestroy {
  documents: Document[] = [];
  filteredDocuments: Document[] = [];
  cars: Car[] = [];
  searchTerm: string = '';
  activeFilter: 'all' | 'active' | 'expired' | 'expiring' = 'all';
  filterByMatricule: string | null = null;
  private queryParamsSubscription: Subscription | null = null;
  private hasHandledEditParam = false;

  constructor(
    private databaseService: DatabaseService,
    private toastController: ToastController,
    private alertController: AlertController,
    private modalController: ModalController,
    private route: ActivatedRoute,
    private router: Router,
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
      folderOpen,
      close,
      shieldCheckmark,
    });
  }

  async ngOnInit() {
    await this.loadCars();
    await this.loadDocuments();
  }

  async ionViewWillEnter() {
    await this.loadCars();
    await this.loadDocuments();

    // Check for query parameters
    const params = this.route.snapshot.queryParams;

    // Handle filterByMatricule parameter
    if (params['filterByMatricule']) {
      this.filterByMatricule = params['filterByMatricule'];
      this.filterDocuments();
    }

    // Check for editDocumentId query parameter (only once per navigation)
    if (params['editDocumentId'] && !this.hasHandledEditParam) {
      this.hasHandledEditParam = true;
      const documentToEdit = this.documents.find(
        (doc) => doc.id === params['editDocumentId'],
      );
      if (documentToEdit) {
        await this.editDocument(documentToEdit);
        // Clear the query parameter after handling
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true,
        });
      }
    }
  }

  ionViewDidLeave() {
    // Reset the flags when leaving the page
    this.hasHandledEditParam = false;
    this.filterByMatricule = null;
  }

  ngOnDestroy() {
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
    }
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

    // Filter by matricule (from vehicle page click)
    if (this.filterByMatricule) {
      filtered = filtered.filter(
        (doc) => doc.matriculeCar === this.filterByMatricule,
      );
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.typeDocument.toLowerCase().includes(searchLower) ||
          doc.matriculeCar.toLowerCase().includes(searchLower),
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
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(today.getDate() + 30);
          const expiration =
            typeof doc.dateFin === 'string'
              ? new Date(doc.dateFin)
              : doc.dateFin;
          return expiration >= today && expiration <= thirtyDaysFromNow;
        });
        break;
    }

    this.filteredDocuments = filtered;
  }

  setFilter(filter: 'all' | 'active' | 'expired' | 'expiring') {
    this.activeFilter = filter;
    this.filterDocuments();
  }

  clearVehicleFilter() {
    this.filterByMatricule = null;
    // Clear the query parameter from URL
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true,
    });
    this.filterDocuments();
  }

  getExpirationStatus(dateFin: Date | string) {
    const today = new Date();
    const expiration =
      typeof dateFin === 'string' ? new Date(dateFin) : dateFin;
    const diffTime = expiration.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { color: 'danger', message: 'Expiré' };
    } else if (diffDays <= 7) {
      return { color: 'danger', message: `Expire dans ${diffDays} jour(s)` };
    } else if (diffDays <= 30) {
      return { color: 'warning', message: `Expire dans ${diffDays} jour(s)` };
    } else {
      return { color: 'success', message: `Expire dans ${diffDays} jour(s)` };
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
        'warning',
      );
      return;
    }

    const modal = await this.modalController.create({
      component: DocumentModalComponent,
      componentProps: {
        cars: this.cars,
        isEdit: false,
      },
    });

    modal.onDidDismiss().then((result) => {
      if (result.data && result.data.added) {
        this.loadDocuments();
      }
    });

    await modal.present();
  }

  async editDocument(document: Document) {
    const modal = await this.modalController.create({
      component: DocumentModalComponent,
      componentProps: {
        cars: this.cars,
        document: document,
        isEdit: true,
      },
    });

    modal.onDidDismiss().then((result) => {
      if (result.data && result.data.updated) {
        this.loadDocuments();
      }
    });

    await modal.present();
  }

  async deleteDocument(document: Document) {
    const alert = await this.alertController.create({
      header: 'Supprimer le Document',
      message: `Êtes-vous sûr de vouloir supprimer le document "${document.typeDocument}" pour le véhicule ${document.matriculeCar} ?`,
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
              document.id,
            );
            if (success) {
              await this.showToast('Document supprimé avec succès', 'success');
              await this.loadDocuments();
            } else {
              await this.showToast(
                'Erreur lors de la suppression du document',
                'danger',
              );
            }
          },
        },
      ],
    });

    await alert.present();
  }

  getActiveCount(): number {
    return this.documents.filter((doc) => doc.documentActive).length;
  }

  getExpiringCount(): number {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    return this.documents.filter((doc) => {
      const expiration =
        typeof doc.dateFin === 'string' ? new Date(doc.dateFin) : doc.dateFin;
      return expiration >= today && expiration <= thirtyDaysFromNow;
    }).length;
  }

  getDocumentTypeIcon(typeDocument: string): string {
    const type = typeDocument.toLowerCase();
    if (type.includes('assurance')) return 'shield-checkmark';
    if (type.includes('visite') || type.includes('technique'))
      return 'checkmark-circle';
    if (type.includes('carte') || type.includes('grise')) return 'car';
    return 'document-text';
  }

  getStatusGradientClass(dateFin: Date | string): string {
    const today = new Date();
    const expiration =
      typeof dateFin === 'string' ? new Date(dateFin) : dateFin;
    const diffTime = expiration.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'danger';
    if (diffDays <= 30) return 'warning';
    return 'success';
  }

  private async showToast(
    message: string,
    color: 'success' | 'danger' | 'warning' = 'success',
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
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
