export interface Document {
  id?: string;
  typeDocument: string;
  matriculeCar: string;
  dateDebut: Date;
  dateFin: Date;
  documentActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum DocumentType {
  ASSURANCE = 'Assurance',
  VIGNETTE = 'Vignette',
  CARTE_GRISE = 'Carte Grise',
}
