import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonRadio,
  IonRadioGroup,
  IonButton,
  IonButtons,
  IonLabel,
  ModalController,
} from '@ionic/angular/standalone';
import { Car } from '../models/car.model';

@Component({
  selector: 'app-car-selection-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Sélectionner un véhicule</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">Annuler</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list>
        <ion-radio-group [(ngModel)]="selectedMatricule">
          <ion-item *ngFor="let car of cars">
            <ion-radio [value]="car.matricule" slot="start"></ion-radio>
            <ion-label>
              <h2>{{ car.matricule }}</h2>
              <p>{{ car.marque }} {{ car.model }}</p>
              <p>Chauffeur: {{ car.chauffeur }}</p>
            </ion-label>
          </ion-item>
        </ion-radio-group>
      </ion-list>

      <div style="padding: 16px;">
        <ion-button
          expand="block"
          (click)="confirm()"
          [disabled]="!selectedMatricule"
        >
          Confirmer
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
    IonList,
    IonItem,
    IonRadio,
    IonRadioGroup,
    IonButton,
    IonButtons,
    IonLabel,
  ],
})
export class CarSelectionModalComponent {
  @Input() cars: Car[] = [];
  @Input() selectedMatricule?: string;

  constructor(private modalController: ModalController) {}

  dismiss() {
    this.modalController.dismiss();
  }

  confirm() {
    this.modalController.dismiss(this.selectedMatricule, 'confirm');
  }
}
