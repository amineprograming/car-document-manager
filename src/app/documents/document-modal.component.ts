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
  IonToggle,
  ModalController,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  close,
  checkmark,
  documentText,
  car,
  calendar,
  shieldCheckmark,
  search,
  chevronDown,
  closeCircle,
  checkmarkCircle,
  carOutline,
} from 'ionicons/icons';
import { Document } from '../models/document.model';
import { Car } from '../models/car.model';
import { DatabaseService } from '../services/firebase-database.service';

@Component({
  selector: 'app-document-modal',
  template: `
    <ion-header>
      <ion-toolbar class="modal-toolbar">
        <ion-buttons slot="start">
          <ion-button class="close-btn" (click)="dismiss()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title class="modal-title">
          {{ isEdit ? 'Modifier' : 'Nouveau' }} Document
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="modal-content">
      <div class="modal-container">
        <!-- Header Icon -->
        <div class="modal-header-icon">
          <div class="icon-wrapper" [class.edit-mode]="isEdit">
            <ion-icon name="document-text"></ion-icon>
          </div>
          <h2 class="modal-subtitle">
            {{
              isEdit
                ? 'Modifier les informations'
                : 'Ajouter un nouveau document'
            }}
          </h2>
        </div>

        <!-- Form Fields -->
        <div class="form-section">
          <!-- Document Type -->
          <div class="form-group">
            <div class="form-label">
              <ion-icon name="document-text"></ion-icon>
              <span>Type de Document <span class="required">*</span></span>
            </div>
            <div class="input-wrapper">
              <ion-select
                [(ngModel)]="documentData.typeDocument"
                placeholder="Sélectionner le type"
                interface="action-sheet"
                class="elegant-select"
              >
                <ion-select-option value="Assurance"
                  >🛡️ Assurance</ion-select-option
                >
                <ion-select-option value="Vignette"
                  >📋 Vignette</ion-select-option
                >
                <ion-select-option value="Carte Grise"
                  >🚗 Carte Grise</ion-select-option
                >
                <ion-select-option value="Visite Technique"
                  >✅ Visite Technique</ion-select-option
                >
              </ion-select>
            </div>
          </div>

          <!-- Vehicle Selection with Search -->
          <div class="form-group">
            <div class="form-label">
              <ion-icon name="car"></ion-icon>
              <span>Véhicule <span class="required">*</span></span>
            </div>
            <div class="vehicle-selector" (click)="openCarSelector()">
              <div class="selected-vehicle" *ngIf="documentData.matricule">
                <ion-icon name="car"></ion-icon>
                <span
                  >{{ documentData.matricule }} •
                  {{ getSelectedCarInfo() }}</span
                >
              </div>
              <div class="placeholder" *ngIf="!documentData.matricule">
                <ion-icon name="search"></ion-icon>
                <span>Rechercher un véhicule...</span>
              </div>
              <ion-icon name="chevron-down" class="chevron"></ion-icon>
            </div>
          </div>

          <!-- Vehicle Search Modal -->
          <div class="vehicle-search-modal" *ngIf="showCarSelector">
            <div
              class="search-modal-backdrop"
              (click)="closeCarSelector()"
            ></div>
            <div class="search-modal-content">
              <div class="search-modal-header">
                <h3>Sélectionner un véhicule</h3>
                <ion-button fill="clear" (click)="closeCarSelector()">
                  <ion-icon name="close"></ion-icon>
                </ion-button>
              </div>
              <div class="search-input-wrapper">
                <ion-icon name="search"></ion-icon>
                <input
                  type="text"
                  [(ngModel)]="carSearchTerm"
                  placeholder="Rechercher par matricule, marque..."
                  class="search-input"
                  (input)="filterCars()"
                />
                <ion-icon
                  name="close-circle"
                  *ngIf="carSearchTerm"
                  (click)="clearCarSearch()"
                  class="clear-icon"
                ></ion-icon>
              </div>
              <div class="car-list">
                <div
                  class="car-item"
                  *ngFor="let car of filteredCars"
                  (click)="selectCar(car)"
                  [class.selected]="documentData.matricule === car.matricule"
                >
                  <div class="car-icon">
                    <ion-icon name="car"></ion-icon>
                  </div>
                  <div class="car-info">
                    <span class="car-matricule">{{ car.matricule }}</span>
                    <span class="car-details"
                      >{{ car.marque }} {{ car.model }}</span
                    >
                  </div>
                  <ion-icon
                    name="checkmark-circle"
                    class="check-icon"
                    *ngIf="documentData.matricule === car.matricule"
                  ></ion-icon>
                </div>
                <div class="no-results" *ngIf="filteredCars.length === 0">
                  <ion-icon name="car-outline"></ion-icon>
                  <span>Aucun véhicule trouvé</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Date Fields Row -->
          <div class="date-row">
            <div class="form-group half">
              <div class="form-label">
                <ion-icon name="calendar"></ion-icon>
                <span>Date début</span>
              </div>
              <div class="input-wrapper">
                <ion-input
                  type="date"
                  [(ngModel)]="documentData.dateDebut"
                  class="elegant-input"
                ></ion-input>
              </div>
            </div>

            <div class="form-group half">
              <div class="form-label">
                <ion-icon name="calendar"></ion-icon>
                <span>Date fin <span class="required">*</span></span>
              </div>
              <div class="input-wrapper">
                <ion-input
                  type="date"
                  [(ngModel)]="documentData.dateFin"
                  class="elegant-input"
                ></ion-input>
              </div>
            </div>
          </div>

          <!-- Document Active Toggle -->
          <div class="toggle-section">
            <div class="toggle-content">
              <div
                class="toggle-icon"
                [class.active]="documentData.documentActive"
              >
                <ion-icon name="shield-checkmark"></ion-icon>
              </div>
              <div class="toggle-info">
                <h3>Document actif</h3>
                <p>Les notifications seront envoyées pour ce document</p>
              </div>
            </div>
            <ion-toggle
              [(ngModel)]="documentData.documentActive"
              class="elegant-toggle"
            ></ion-toggle>
          </div>
        </div>

        <!-- Action Button -->
        <div class="action-section">
          <ion-button
            class="save-button"
            expand="block"
            (click)="save()"
            [disabled]="!isFormValid()"
          >
            <ion-icon name="checkmark" slot="start"></ion-icon>
            {{
              isEdit ? 'Enregistrer les modifications' : 'Ajouter le document'
            }}
          </ion-button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .modal-toolbar {
        --background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        --color: #fff;

        .close-btn {
          --color: rgba(255, 255, 255, 0.9);
          margin-left: 8px;

          ion-icon {
            font-size: 1.5rem;
          }
        }

        .modal-title {
          font-weight: 700;
          letter-spacing: 0.3px;
        }
      }

      .modal-content {
        --background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
      }

      .modal-container {
        padding: 24px 20px;
        max-width: 500px;
        margin: 0 auto;
      }

      .modal-header-icon {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 28px;

        .icon-wrapper {
          width: 80px;
          height: 80px;
          border-radius: 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 12px 32px rgba(102, 126, 234, 0.4);
          margin-bottom: 16px;

          ion-icon {
            font-size: 2.5rem;
            color: #fff;
          }

          &.edit-mode {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            box-shadow: 0 12px 32px rgba(245, 158, 11, 0.4);
          }
        }

        .modal-subtitle {
          font-size: 1rem;
          font-weight: 500;
          color: #64748b;
          margin: 0;
        }
      }

      .form-section {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .form-group {
        .form-label {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          font-size: 0.9rem;
          font-weight: 600;
          color: #334155;

          ion-icon {
            color: #667eea;
            font-size: 1.1rem;
          }

          .required {
            color: #ef4444;
          }
        }

        .input-wrapper {
          .elegant-select,
          .elegant-input {
            --background: #fff;
            --color: #1e293b;
            --placeholder-color: #94a3b8;
            --padding-start: 16px;
            --padding-end: 16px;
            --padding-top: 14px;
            --padding-bottom: 14px;
            border-radius: 14px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
            border: 2px solid transparent;
            transition: all 0.3s ease;
            color: #1e293b;

            &:focus-within {
              border-color: #667eea;
              box-shadow: 0 4px 20px rgba(102, 126, 234, 0.2);
            }
          }
        }

        &.half {
          flex: 1;
        }
      }

      .date-row {
        display: flex;
        gap: 16px;
      }

      .toggle-section {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 18px 20px;
        background: #fff;
        border-radius: 16px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);

        .toggle-content {
          display: flex;
          align-items: center;
          gap: 14px;

          .toggle-icon {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            background: rgba(100, 116, 139, 0.15);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;

            ion-icon {
              font-size: 1.3rem;
              color: #64748b;
              transition: all 0.3s ease;
            }

            &.active {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);

              ion-icon {
                color: #fff;
              }
            }
          }

          .toggle-info {
            h3 {
              font-size: 0.95rem;
              font-weight: 700;
              color: #1e293b;
              margin: 0 0 2px 0;
            }

            p {
              font-size: 0.8rem;
              color: #64748b;
              margin: 0;
            }
          }
        }

        .elegant-toggle {
          --background: #e2e8f0;
          --background-checked: linear-gradient(
            135deg,
            #10b981 0%,
            #059669 100%
          );
          --handle-background: #fff;
          --handle-background-checked: #fff;
        }
      }

      .action-section {
        margin-top: 32px;

        .save-button {
          --background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          --border-radius: 16px;
          --box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
          --padding-top: 18px;
          --padding-bottom: 18px;
          font-weight: 700;
          font-size: 1rem;
          letter-spacing: 0.3px;
          text-transform: none;
          transition: all 0.3s ease;

          &:hover:not([disabled]) {
            --box-shadow: 0 12px 32px rgba(102, 126, 234, 0.5);
            transform: translateY(-2px);
          }

          &[disabled] {
            opacity: 0.5;
            --box-shadow: none;
          }
        }
      }

      // Vehicle Selector Styles
      .vehicle-selector {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
        background: #fff;
        border-radius: 14px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        cursor: pointer;
        transition: all 0.3s ease;
        border: 2px solid transparent;

        &:hover {
          border-color: #667eea;
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.2);
        }

        .selected-vehicle,
        .placeholder {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;

          ion-icon {
            font-size: 1.2rem;
            color: #667eea;
          }

          span {
            font-size: 0.95rem;
            font-weight: 500;
            color: #1e293b;
          }
        }

        .placeholder span {
          color: #94a3b8;
        }

        .chevron {
          font-size: 1.2rem;
          color: #64748b;
          transition: transform 0.3s ease;
        }
      }

      .vehicle-search-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 9999;
        display: flex;
        align-items: flex-end;
        justify-content: center;

        .search-modal-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
        }

        .search-modal-content {
          position: relative;
          width: 100%;
          max-width: 500px;
          max-height: 70vh;
          background: #fff;
          border-radius: 24px 24px 0 0;
          display: flex;
          flex-direction: column;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .search-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 20px 12px;
          border-bottom: 1px solid #e2e8f0;

          h3 {
            font-size: 1.1rem;
            font-weight: 700;
            color: #1e293b;
            margin: 0;
          }

          ion-button {
            --color: #64748b;
            margin: 0;
          }
        }

        .search-input-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          background: #f8fafc;
          margin: 12px 16px;
          border-radius: 12px;
          border: 2px solid transparent;
          transition: all 0.3s ease;

          &:focus-within {
            background: #fff;
            border-color: #667eea;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
          }

          ion-icon {
            font-size: 1.2rem;
            color: #667eea;
          }

          .search-input {
            flex: 1;
            border: none;
            background: transparent;
            font-size: 0.95rem;
            color: #1e293b;
            outline: none;

            &::placeholder {
              color: #94a3b8;
            }
          }

          .clear-icon {
            cursor: pointer;
            color: #94a3b8;

            &:hover {
              color: #64748b;
            }
          }
        }

        .car-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px 16px 24px;

          .car-item {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 14px 16px;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
            margin-bottom: 8px;

            &:hover {
              background: #f8fafc;
            }

            &.selected {
              background: linear-gradient(
                135deg,
                rgba(102, 126, 234, 0.1) 0%,
                rgba(118, 75, 162, 0.1) 100%
              );
              border: 2px solid #667eea;
            }

            .car-icon {
              width: 44px;
              height: 44px;
              border-radius: 12px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              display: flex;
              align-items: center;
              justify-content: center;

              ion-icon {
                font-size: 1.3rem;
                color: #fff;
              }
            }

            .car-info {
              flex: 1;
              display: flex;
              flex-direction: column;
              gap: 2px;

              .car-matricule {
                font-size: 0.95rem;
                font-weight: 700;
                color: #1e293b;
              }

              .car-details {
                font-size: 0.85rem;
                color: #64748b;
              }
            }

            .check-icon {
              font-size: 1.4rem;
              color: #667eea;
            }
          }

          .no-results {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            color: #64748b;

            ion-icon {
              font-size: 3rem;
              margin-bottom: 12px;
              opacity: 0.5;
            }

            span {
              font-size: 0.95rem;
            }
          }
        }
      }

      @media (max-width: 380px) {
        .date-row {
          flex-direction: column;
          gap: 20px;
        }

        .toggle-section {
          flex-direction: column;
          gap: 16px;

          .toggle-content {
            width: 100%;
          }
        }
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
    IonButton,
    IonButtons,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonInput,
    IonToggle,
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
    documentActive: true,
  };

  // Car search properties
  showCarSelector = false;
  carSearchTerm = '';
  filteredCars: Car[] = [];

  constructor(
    private modalController: ModalController,
    private databaseService: DatabaseService,
    private toastController: ToastController,
  ) {
    addIcons({
      close,
      checkmark,
      documentText,
      car,
      calendar,
      shieldCheckmark,
      search,
      chevronDown,
      closeCircle,
      checkmarkCircle,
      carOutline,
    });
  }

  ngOnInit() {
    // Initialize filtered cars
    this.filteredCars = [...this.cars];

    if (this.isEdit && this.document) {
      this.documentData = {
        typeDocument: this.document.typeDocument,
        matricule: this.document.matriculeCar,
        dateDebut: this.formatDateForInput(this.document.dateDebut),
        dateFin: this.formatDateForInput(this.document.dateFin),
        documentActive: this.document.documentActive,
      };
    } else {
      // Set default start date to today
      this.documentData.dateDebut = new Date().toISOString().split('T')[0];
    }
  }

  // Car selector methods
  openCarSelector() {
    this.showCarSelector = true;
    this.carSearchTerm = '';
    this.filteredCars = [...this.cars];
  }

  closeCarSelector() {
    this.showCarSelector = false;
  }

  filterCars() {
    const search = this.carSearchTerm.toLowerCase().trim();
    if (!search) {
      this.filteredCars = [...this.cars];
    } else {
      this.filteredCars = this.cars.filter(
        (car) =>
          car.matricule.toLowerCase().includes(search) ||
          car.marque.toLowerCase().includes(search) ||
          car.model.toLowerCase().includes(search),
      );
    }
  }

  clearCarSearch() {
    this.carSearchTerm = '';
    this.filteredCars = [...this.cars];
  }

  selectCar(car: Car) {
    this.documentData.matricule = car.matricule;
    this.closeCarSelector();
  }

  getSelectedCarInfo(): string {
    const car = this.cars.find(
      (c) => c.matricule === this.documentData.matricule,
    );
    return car ? `${car.marque} ${car.model}` : '';
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
        'danger',
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
          documentActive: this.documentData.documentActive,
          updatedAt: new Date(),
        };

        const success =
          await this.databaseService.updateDocument(updatedDocument);
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
          documentActive: this.documentData.documentActive,
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
