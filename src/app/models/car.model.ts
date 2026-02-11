export interface Car {
  id?: string;
  matricule: string;
  marque: string;
  model: string;
  chauffeur: string;
  tel: string;
  typeVehicule: 'voiture' | 'moto';
  createdAt?: Date;
  updatedAt?: Date;
}
