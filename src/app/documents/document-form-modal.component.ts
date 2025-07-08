import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonButtons,
  IonCheckbox,
  ModalController,
} from '@ionic/angular/standalone';
import { Document } from '../models/document.model';

@Component({
  selector: 'app-document-form-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title
          >{{ isEditMode ? 'Modifier' : 'Ajouter' }} un Document</ion-title
        >
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">Annuler</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form #documentForm="ngForm">
        <!-- Reference Field -->
        <ion-item>
          <ion-label position="stacked">Référence (optionnel)</ion-label>
          <ion-input
            [(ngModel)]="formData.reference"
            name="reference"
            placeholder="Entrez la référence du document"
            clearInput="true"
          ></ion-input>
        </ion-item>

        <!-- Document Type Field -->
        <ion-item>
          <ion-label position="stacked">Type de document *</ion-label>
          <ion-select
            [(ngModel)]="formData.typeDocument"
            name="typeDocument"
            placeholder="Sélectionnez le type"
            required
            #typeDocumentField="ngModel"
          >
            <ion-select-option value="Assurance">Assurance</ion-select-option>
            <ion-select-option value="Visite Technique"
              >Visite Technique</ion-select-option
            >
            <ion-select-option value="Carte Grise"
              >Carte Grise</ion-select-option
            >
          </ion-select>
        </ion-item>

        <!-- Start Date Field -->
        <ion-item>
          <ion-label position="stacked">Date de début</ion-label>
          <ion-input
            [(ngModel)]="formData.dateDebut"
            name="dateDebut"
            type="date"
            placeholder="Sélectionnez la date de début"
          ></ion-input>
        </ion-item>

        <!-- End Date Field -->
        <ion-item>
          <ion-label position="stacked">Date de fin *</ion-label>
          <ion-input
            [(ngModel)]="formData.dateFin"
            name="dateFin"
            type="date"
            placeholder="Sélectionnez la date de fin"
            required
            #dateFinField="ngModel"
          ></ion-input>
        </ion-item>

        <!-- Document Active Field -->
        <ion-item>
          <ion-checkbox
            [(ngModel)]="formData.documentActive"
            name="documentActive"
            slot="start"
          ></ion-checkbox>
          <ion-label class="ion-margin-start">Document actif</ion-label>
        </ion-item>

        <!-- Action Buttons -->
        <div class="ion-margin-top">
          <ion-button
            expand="block"
            (click)="save()"
            [disabled]="!isFormValid()"
            color="primary"
          >
            {{ isEditMode ? 'Modifier' : 'Ajouter' }}
          </ion-button>

          <ion-button
            expand="block"
            fill="outline"
            (click)="dismiss()"
            class="ion-margin-top"
          >
            Annuler
          </ion-button>
        </div>
      </form>
    </ion-content>
  `,
  styles: [
    `
      ion-item {
        --border-radius: 8px;
        --background: var(--ion-color-light);
        margin-bottom: 16px;
      }

      ion-datetime {
        --background: transparent;
      }

      .ion-margin-top {
        margin-top: 24px;
      }

      ion-button[disabled] {
        --opacity: 0.6;
      }
    `,
  ],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonButtons,
    IonCheckbox,
  ],
})
export class DocumentFormModalComponent implements OnInit {
  @Input() document?: Document;
  @Input() selectedMatricule!: string;
  @Input() isEditMode: boolean = false;

  formData = {
    reference: '',
    typeDocument: '',
    matriculeCar: '',
    dateDebut: new Date().toISOString().split('T')[0],
    dateFin: '',
    documentActive: true,
  };

  constructor(private modalController: ModalController) {}

  ngOnInit() {
    // Set matricule from input
    this.formData.matriculeCar = this.selectedMatricule;

    // If editing, populate form with existing data
    if (this.isEditMode && this.document) {
      this.formData = {
        reference: this.document.reference || '',
        typeDocument: this.document.typeDocument || '',
        matriculeCar: this.selectedMatricule,
        dateDebut: this.formatDateForInput(this.document.dateDebut),
        dateFin: this.formatDateForInput(this.document.dateFin),
        documentActive: this.document.documentActive !== false,
      };
    }
  }

  isFormValid(): boolean {
    return !!(
      this.formData.typeDocument &&
      this.formData.dateFin &&
      this.formData.matriculeCar
    );
  }

  async save() {
    if (!this.isFormValid()) {
      return;
    }

    const documentData = {
      reference: this.formData.reference || '',
      typeDocument: this.formData.typeDocument,
      matriculeCar: this.formData.matriculeCar,
      dateDebut: new Date(this.formData.dateDebut),
      dateFin: new Date(this.formData.dateFin),
      documentActive: this.formData.documentActive,
      ...(this.isEditMode
        ? {
            id: this.document?.id,
            updatedAt: new Date(),
            createdAt: this.document?.createdAt || new Date(),
          }
        : {
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
    };

    await this.modalController.dismiss(documentData, 'confirm');
  }

  async dismiss() {
    await this.modalController.dismiss();
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
