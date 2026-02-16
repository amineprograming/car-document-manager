import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonSearchbar,
  IonCard,
  IonCardContent,
  IonFab,
  IonFabButton,
  IonItem,
  IonInput,
  IonChip,
  IonLabel,
  ModalController,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  add,
  create,
  trash,
  person,
  call,
  documentText,
  carSport,
  close,
  chevronForward,
  bicycle,
  logOutOutline,
} from 'ionicons/icons';
import { DatabaseService } from '../services/firebase-database.service';
import { AuthService } from '../services/auth.service';
import { Car } from '../models/car.model';
import { Document } from '../models/document.model';
import { CarModalComponent } from './car-modal.component';

@Component({
  selector: 'app-cars',
  templateUrl: './cars.page.html',
  styleUrls: ['./cars.page.scss'],
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
    IonCard,
    IonCardContent,
    IonFab,
    IonFabButton,
    IonChip,
    IonLabel,
    CommonModule,
    FormsModule,
  ],
})
export class CarsPage implements OnInit {
  cars: Car[] = [];
  filteredCars: Car[] = [];
  documents: Document[] = [];
  searchTerm: string = '';
  typeFilter: 'all' | 'voiture' | 'moto' = 'all';

  constructor(
    private databaseService: DatabaseService,
    private modalController: ModalController,
    private alertController: AlertController,
    private toastController: ToastController,
    private authService: AuthService,
    private router: Router,
  ) {
    addIcons({
      carSport,
      add,
      logOutOutline,
      bicycle,
      documentText,
      create,
      trash,
      person,
      call,
      chevronForward,
      close,
    });
  }

  ngOnInit() {
    this.loadCars();
    this.loadDocuments();
  }

  ionViewWillEnter() {
    this.loadCars();
    this.loadDocuments();
  }

  async loadCars() {
    try {
      // Wait for auth initialization and check if user is authenticated
      await this.authService.waitForAuthInitialization();
      const currentUser = this.authService.getCurrentUser();

      if (!currentUser) {
        console.log('User not authenticated, redirecting to auth page');
        await this.showToast(
          'Vous devez vous connecter pour accéder aux véhicules',
          'warning',
        );
        this.router.navigate(['/auth']);
        return;
      }

      this.cars = await this.databaseService.getCars();

      // Run migration for vehicles without typeVehicule
      const needsMigration = this.cars.some((car) => !car.typeVehicule);
      if (needsMigration) {
        const updated = await this.databaseService.migrateVehicleTypes();
        if (updated > 0) {
          console.log(`Migrated ${updated} vehicles to have typeVehicule`);
          this.cars = await this.databaseService.getCars();
        }
      }

      this.filteredCars = [...this.cars];
    } catch (error) {
      console.error('Error loading cars:', error);
      await this.showToast(
        'Erreur lors du chargement des véhicules. Vérifiez votre connexion.',
        'danger',
      );
    }
  }

  async loadDocuments() {
    try {
      this.documents = await this.databaseService.getDocuments();
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  }

  filterCars() {
    let filtered = [...this.cars];

    // Filter by type
    if (this.typeFilter !== 'all') {
      filtered = filtered.filter((car) => car.typeVehicule === this.typeFilter);
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (car) =>
          car.matricule.toLowerCase().includes(term) ||
          car.marque.toLowerCase().includes(term) ||
          car.model.toLowerCase().includes(term) ||
          car.chauffeur.toLowerCase().includes(term),
      );
    }

    this.filteredCars = filtered;
  }

  setTypeFilter(type: 'all' | 'voiture' | 'moto') {
    this.typeFilter = type;
    this.filterCars();
  }

  getCarCount(): number {
    return this.cars.filter((c) => c.typeVehicule === 'voiture').length;
  }

  getMotoCount(): number {
    return this.cars.filter((c) => c.typeVehicule === 'moto').length;
  }

  async addCar() {
    const modal = await this.modalController.create({
      component: CarModalComponent,
      componentProps: {
        isEdit: false,
      },
    });

    modal.onDidDismiss().then((result) => {
      if (result.data && result.data.added) {
        this.loadCars();
      }
    });

    await modal.present();
  }

  async editCar(car: Car) {
    const modal = await this.modalController.create({
      component: CarModalComponent,
      componentProps: {
        car: car,
        isEdit: true,
      },
    });

    modal.onDidDismiss().then((result) => {
      if (result.data && result.data.updated) {
        this.loadCars();
      }
    });

    await modal.present();
  }

  async deleteCar(car: Car) {
    const documentsCount = this.getCarDocumentsCount(car.matricule);

    let message = `Êtes-vous sûr de vouloir supprimer le véhicule ${car.matricule}?`;
    if (documentsCount > 0) {
      message += ` Cette action supprimera également ${documentsCount} document(s) associé(s).`;
    }

    const alert = await this.alertController.create({
      header: 'Confirmer la suppression',
      message: message,
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel',
        },
        {
          text: 'Supprimer',
          role: 'destructive',
          handler: async () => {
            if (car.id) {
              const success = await this.databaseService.deleteCar(car.id);
              if (success) {
                await this.showToast(
                  'Véhicule supprimé avec succès',
                  'success',
                );
                this.loadCars();
                this.loadDocuments();
              } else {
                await this.showToast('Erreur lors de la suppression', 'danger');
              }
            }
          },
        },
      ],
    });

    await alert.present();
  }

  getCarDocumentsCount(matricule: string): number {
    return this.documents.filter((doc) => doc.matriculeCar === matricule)
      .length;
  }

  viewCarDocuments(car: Car) {
    // Navigate to documents page filtered by this car's matricule
    this.router.navigate(['/tabs/documents'], {
      queryParams: { filterByMatricule: car.matricule },
    });
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'top',
    });
    await toast.present();
  }

  async logout() {
    await this.authService.signOut();
    this.router.navigate(['/auth']);
    App.exitApp();
  }
}
