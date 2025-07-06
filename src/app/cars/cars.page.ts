import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonChip,
  IonLabel,
  IonFab,
  IonFabButton,
  IonItem,
  IonInput,
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
} from 'ionicons/icons';
import { DatabaseService } from '../services/firebase-database.service';
import { AuthService } from '../services/auth.service';
import { Car } from '../models/car.model';
import { Document } from '../models/document.model';

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
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonChip,
    IonLabel,
    IonFab,
    IonFabButton,
    CommonModule,
    FormsModule,
  ],
})
export class CarsPage implements OnInit {
  cars: Car[] = [];
  filteredCars: Car[] = [];
  documents: Document[] = [];
  searchTerm: string = '';

  constructor(
    private databaseService: DatabaseService,
    private modalController: ModalController,
    private alertController: AlertController,
    private toastController: ToastController,
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({
      add,
      create,
      trash,
      person,
      call,
      documentText,
      carSport,
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
          'warning'
        );
        this.router.navigate(['/auth']);
        return;
      }

      this.cars = await this.databaseService.getCars();
      this.filteredCars = [...this.cars];
    } catch (error) {
      console.error('Error loading cars:', error);
      await this.showToast(
        'Erreur lors du chargement des véhicules. Vérifiez votre connexion.',
        'danger'
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
    if (!this.searchTerm.trim()) {
      this.filteredCars = [...this.cars];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredCars = this.cars.filter(
      (car) =>
        car.matricule.toLowerCase().includes(term) ||
        car.marque.toLowerCase().includes(term) ||
        car.model.toLowerCase().includes(term) ||
        car.chauffeur.toLowerCase().includes(term)
    );
  }

  async addCar() {
    const alert = await this.alertController.create({
      header: 'Ajouter un Véhicule',
      inputs: [
        {
          name: 'matricule',
          type: 'text',
          placeholder: 'Matricule *',
        },
        {
          name: 'marque',
          type: 'text',
          placeholder: 'Marque *',
        },
        {
          name: 'model',
          type: 'text',
          placeholder: 'Modèle *',
        },
        {
          name: 'chauffeur',
          type: 'text',
          placeholder: 'Nom du chauffeur *',
        },
        {
          name: 'tel',
          type: 'tel',
          placeholder: 'Téléphone *',
        },
      ],
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel',
        },
        {
          text: 'Ajouter',
          handler: async (data) => {
            if (
              data.matricule &&
              data.marque &&
              data.model &&
              data.chauffeur &&
              data.tel
            ) {
              const success = await this.databaseService.addCar(data);
              if (success) {
                await this.showToast('Véhicule ajouté avec succès', 'success');
                this.loadCars();
                return true;
              } else {
                await this.showToast("Erreur lors de l'ajout", 'danger');
                return false;
              }
            } else {
              await this.showToast(
                'Veuillez remplir tous les champs',
                'warning'
              );
              return false;
            }
          },
        },
      ],
    });

    await alert.present();
  }

  async editCar(car: Car) {
    const alert = await this.alertController.create({
      header: 'Modifier le Véhicule',
      inputs: [
        {
          name: 'matricule',
          type: 'text',
          value: car.matricule,
          disabled: true,
        },
        {
          name: 'marque',
          type: 'text',
          value: car.marque,
          placeholder: 'Marque *',
        },
        {
          name: 'model',
          type: 'text',
          value: car.model,
          placeholder: 'Modèle *',
        },
        {
          name: 'chauffeur',
          type: 'text',
          value: car.chauffeur,
          placeholder: 'Nom du chauffeur *',
        },
        {
          name: 'tel',
          type: 'tel',
          value: car.tel,
          placeholder: 'Téléphone *',
        },
      ],
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel',
        },
        {
          text: 'Modifier',
          handler: async (data) => {
            if (data.marque && data.model && data.chauffeur && data.tel) {
              const updatedCar: Car = {
                ...car,
                marque: data.marque,
                model: data.model,
                chauffeur: data.chauffeur,
                tel: data.tel,
              };

              const success = await this.databaseService.updateCar(updatedCar);
              if (success) {
                await this.showToast('Véhicule modifié avec succès', 'success');
                this.loadCars();
                return true;
              } else {
                await this.showToast(
                  'Erreur lors de la modification',
                  'danger'
                );
                return false;
              }
            } else {
              await this.showToast(
                'Veuillez remplir tous les champs',
                'warning'
              );
              return false;
            }
          },
        },
      ],
    });

    await alert.present();
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
                  'success'
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

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'top',
    });
    await toast.present();
  }
}
