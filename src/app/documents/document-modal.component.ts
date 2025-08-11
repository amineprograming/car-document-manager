import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonInput,
  ModalController,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, checkmark } from 'ionicons/icons';
import { Document } from '../models/document.model';
import { Car } from '../models/car.model';
import { DatabaseService } from '../services/firebase-database.service';

@Component({
  selector: 'app-document-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ isEdit ? 'Modifier' : 'Ajouter' }} un Document</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list>
        <ion-item>
          <ion-label position="stacked">Type de Document *</ion-label>
          <ion-select
            [(ngModel)]="documentData.typeDocument"
            placeholder="Sélectionner le type de document"
            interface="popover"
          >
            <ion-select-option value="Assurance">Assurance</ion-select-option>
            <ion-select-option value="Vignette">Vignette</ion-select-option>
            <ion-select-option value="Carte Grise"
              >Carte Grise</ion-select-option
            >
          </ion-select>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Véhicule *</ion-label>
          <ion-select
            [(ngModel)]="documentData.matricule"
            placeholder="Sélectionner le véhicule"
            interface="popover"
          >
            <ion-select-option *ngFor="let car of cars" [value]="car.matricule">
              {{ car.matricule }} ({{ car.marque }} {{ car.model }})
            </ion-select-option>
          </ion-select>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Date de début</ion-label>
          <ion-input
            type="date"
            [(ngModel)]="documentData.dateDebut"
            placeholder="Date de début"
          >
          </ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Date de fin *</ion-label>
          <ion-input
            type="date"
            [(ngModel)]="documentData.dateFin"
            placeholder="Date de fin"
          >
          </ion-input>
        </ion-item>
      </ion-list>

      <div style="padding: 20px;">
        <ion-button expand="block" (click)="save()" [disabled]="!isFormValid()">
          <ion-icon name="checkmark" slot="start"></ion-icon>
          {{ isEdit ? 'Modifier' : 'Ajouter' }}
        </ion-button>
      </div>
    </ion-content>
  `,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonInput,
  ],
})
export class DocumentModalComponent implements OnInit {
  @Input() cars: Car[] = [];
  @Input() document?: Document;
  @Input() isEdit: boolean = false;

  documentData = {
    typeDocument: '',
    matricule: '',
    dateDebut: '',
    dateFin: '',
  };

  constructor(
    private modalController: ModalController,
    private databaseService: DatabaseService,
    private toastController: ToastController
  ) {
    addIcons({ close, checkmark });
  }

  ngOnInit() {
    if (this.isEdit && this.document) {
      this.documentData = {
        typeDocument: this.document.typeDocument,
        matricule: this.document.matriculeCar,
        dateDebut: this.formatDateForInput(this.document.dateDebut),
        dateFin: this.formatDateForInput(this.document.dateFin),
      };
    } else {
      // Set default start date to today
      this.documentData.dateDebut = new Date().toISOString().split('T')[0];
    }
  }

  isFormValid(): boolean {
    return !!(
      this.documentData.typeDocument &&
      this.documentData.matricule &&
      this.documentData.dateFin
    );
  }

  async save() {
    if (!this.isFormValid()) {
      await this.showToast(
        'Veuillez remplir tous les champs obligatoires',
        'danger'
      );
      return;
    }

    try {
      if (this.isEdit && this.document) {
        // Update existing document
        const updatedDocument: Document = {
          ...this.document,
          typeDocument: this.documentData.typeDocument,
          matriculeCar: this.documentData.matricule,
          dateDebut: new Date(this.documentData.dateDebut),
          dateFin: new Date(this.documentData.dateFin),
          updatedAt: new Date(),
        };

        const success = await this.databaseService.updateDocument(
          updatedDocument
        );
        if (success) {
          await this.showToast('Document modifié avec succès', 'success');
          this.modalController.dismiss({ updated: true });
        } else {
          await this.showToast('Erreur lors de la modification', 'danger');
        }
      } else {
        // Create new document
        const newDocument: Omit<Document, 'id'> = {
          typeDocument: this.documentData.typeDocument,
          matriculeCar: this.documentData.matricule,
          dateDebut: this.documentData.dateDebut
            ? new Date(this.documentData.dateDebut)
            : new Date(),
          dateFin: new Date(this.documentData.dateFin),
          documentActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const success = await this.databaseService.addDocument(newDocument);
        if (success) {
          await this.showToast('Document ajouté avec succès', 'success');
          this.modalController.dismiss({ added: true });
        } else {
          await this.showToast("Erreur lors de l'ajout", 'danger');
        }
      }
    } catch (error) {
      console.error('Error saving document:', error);
      await this.showToast('Une erreur est survenue', 'danger');
    }
  }

  dismiss() {
    this.modalController.dismiss();
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
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
