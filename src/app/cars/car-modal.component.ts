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
  IonInput,
  IonToggle,
  ModalController,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  close,
  checkmark,
  carSport,
  bicycle,
  person,
  call,
} from 'ionicons/icons';
import { Car } from '../models/car.model';
import { DatabaseService } from '../services/firebase-database.service';

@Component({
  selector: 'app-car-modal',
  template: `
    <ion-header>
      <ion-toolbar class="modal-toolbar">
        <ion-buttons slot="start">
          <ion-button class="close-btn" (click)="dismiss()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title class="modal-title">
          {{ isEdit ? 'Modifier' : 'Nouveau' }} Véhicule
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="modal-content">
      <div class="modal-container">
        <!-- Header Icon -->
        <div class="modal-header-icon">
          <div
            class="icon-wrapper"
            [class.moto]="carData.typeVehicule === 'moto'"
          >
            <ion-icon
              [name]="carData.typeVehicule === 'moto' ? 'bicycle' : 'car-sport'"
            ></ion-icon>
          </div>
          <h2 class="modal-subtitle">
            {{
              isEdit
                ? 'Modifier les informations'
                : 'Ajouter un nouveau véhicule'
            }}
          </h2>
        </div>

        <!-- Vehicle Type Selector -->
        <div class="type-selector">
          <div
            class="type-option"
            [class.selected]="carData.typeVehicule === 'voiture'"
            (click)="carData.typeVehicule = 'voiture'"
          >
            <div class="type-icon car">
              <ion-icon name="car-sport"></ion-icon>
            </div>
            <span class="type-label">Voiture</span>
          </div>
          <div
            class="type-option"
            [class.selected]="carData.typeVehicule === 'moto'"
            (click)="carData.typeVehicule = 'moto'"
          >
            <div class="type-icon moto">
              <ion-icon name="bicycle"></ion-icon>
            </div>
            <span class="type-label">Moto</span>
          </div>
        </div>

        <!-- Form Fields -->
        <div class="form-section">
          <!-- Matricule -->
          <div class="form-group">
            <div class="form-label">
              <ion-icon name="car-sport"></ion-icon>
              <span>Matricule <span class="required">*</span></span>
            </div>
            <div class="input-wrapper">
              <ion-input
                [(ngModel)]="carData.matricule"
                placeholder="Ex: 12345-A-67"
                class="elegant-input"
                [disabled]="isEdit"
              ></ion-input>
            </div>
          </div>

          <!-- Marque & Modèle Row -->
          <div class="form-row">
            <div class="form-group half">
              <div class="form-label">
                <span>Marque <span class="required">*</span></span>
              </div>
              <div class="input-wrapper">
                <ion-input
                  [(ngModel)]="carData.marque"
                  placeholder="Ex: Toyota"
                  class="elegant-input"
                ></ion-input>
              </div>
            </div>

            <div class="form-group half">
              <div class="form-label">
                <span>Modèle <span class="required">*</span></span>
              </div>
              <div class="input-wrapper">
                <ion-input
                  [(ngModel)]="carData.model"
                  placeholder="Ex: Corolla"
                  class="elegant-input"
                ></ion-input>
              </div>
            </div>
          </div>

          <!-- Chauffeur -->
          <div class="form-group">
            <div class="form-label">
              <ion-icon name="person"></ion-icon>
              <span>Chauffeur <span class="required">*</span></span>
            </div>
            <div class="input-wrapper">
              <ion-input
                [(ngModel)]="carData.chauffeur"
                placeholder="Nom du chauffeur"
                class="elegant-input"
              ></ion-input>
            </div>
          </div>

          <!-- Téléphone -->
          <div class="form-group">
            <div class="form-label">
              <ion-icon name="call"></ion-icon>
              <span>Téléphone <span class="required">*</span></span>
            </div>
            <div class="input-wrapper">
              <ion-input
                [(ngModel)]="carData.tel"
                type="tel"
                placeholder="Ex: 0612345678"
                class="elegant-input"
              ></ion-input>
            </div>
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
              isEdit ? 'Enregistrer les modifications' : 'Ajouter le véhicule'
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
        margin-bottom: 24px;

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
          transition: all 0.3s ease;

          ion-icon {
            font-size: 2.5rem;
            color: #fff;
          }

          &.moto {
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

      .type-selector {
        display: flex;
        gap: 16px;
        margin-bottom: 28px;

        .type-option {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 20px 16px;
          background: #fff;
          border-radius: 16px;
          border: 3px solid transparent;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          cursor: pointer;
          transition: all 0.3s ease;

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          }

          &.selected {
            border-color: #667eea;
            background: linear-gradient(
              135deg,
              rgba(102, 126, 234, 0.08) 0%,
              rgba(118, 75, 162, 0.08) 100%
            );

            .type-icon.car {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);

              ion-icon {
                color: #fff;
              }
            }

            .type-icon.moto {
              background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
              box-shadow: 0 8px 20px rgba(245, 158, 11, 0.3);

              ion-icon {
                color: #fff;
              }
            }
          }

          .type-icon {
            width: 56px;
            height: 56px;
            border-radius: 16px;
            background: #f1f5f9;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;

            ion-icon {
              font-size: 1.8rem;
              color: #64748b;
              transition: all 0.3s ease;
            }
          }

          .type-label {
            font-size: 0.95rem;
            font-weight: 600;
            color: #334155;
          }
        }
      }

      .form-section {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .form-row {
        display: flex;
        gap: 16px;
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

      @media (max-width: 380px) {
        .form-row {
          flex-direction: column;
          gap: 20px;
        }

        .type-selector {
          flex-direction: column;
          gap: 12px;

          .type-option {
            flex-direction: row;
            justify-content: flex-start;
            padding: 16px 20px;

            .type-icon {
              width: 48px;
              height: 48px;
            }
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
    IonInput,
    IonToggle,
  ],
})
export class CarModalComponent implements OnInit {
  @Input() car?: Car;
  @Input() isEdit: boolean = false;

  carData = {
    matricule: '',
    marque: '',
    model: '',
    chauffeur: '',
    tel: '',
    typeVehicule: 'voiture' as 'voiture' | 'moto',
  };

  constructor(
    private modalController: ModalController,
    private databaseService: DatabaseService,
    private toastController: ToastController,
  ) {
    addIcons({ close, checkmark, carSport, bicycle, person, call });
  }

  ngOnInit() {
    if (this.isEdit && this.car) {
      this.carData = {
        matricule: this.car.matricule,
        marque: this.car.marque,
        model: this.car.model,
        chauffeur: this.car.chauffeur,
        tel: this.car.tel,
        typeVehicule: this.car.typeVehicule || 'voiture',
      };
    }
  }

  isFormValid(): boolean {
    return !!(
      this.carData.matricule &&
      this.carData.marque &&
      this.carData.model &&
      this.carData.chauffeur &&
      this.carData.tel
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
      if (this.isEdit && this.car) {
        const updatedCar: Car = {
          ...this.car,
          marque: this.carData.marque,
          model: this.carData.model,
          chauffeur: this.carData.chauffeur,
          tel: this.carData.tel,
          typeVehicule: this.carData.typeVehicule,
          updatedAt: new Date(),
        };

        const success = await this.databaseService.updateCar(updatedCar);
        if (success) {
          await this.showToast('Véhicule modifié avec succès', 'success');
          this.modalController.dismiss({ updated: true });
        } else {
          await this.showToast('Erreur lors de la modification', 'danger');
        }
      } else {
        const newCar: Omit<Car, 'id'> = {
          matricule: this.carData.matricule,
          marque: this.carData.marque,
          model: this.carData.model,
          chauffeur: this.carData.chauffeur,
          tel: this.carData.tel,
          typeVehicule: this.carData.typeVehicule,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const success = await this.databaseService.addCar(newCar);
        if (success) {
          await this.showToast('Véhicule ajouté avec succès', 'success');
          this.modalController.dismiss({ added: true });
        } else {
          await this.showToast("Erreur lors de l'ajout", 'danger');
        }
      }
    } catch (error) {
      console.error('Error saving car:', error);
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
}
