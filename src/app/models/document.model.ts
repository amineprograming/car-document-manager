export interface Document {
  id?: string;
  reference: string;
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
  CARTE_GRISE = 'Carte Grise',
  CONTROLE_TECHNIQUE = 'Contrôle Technique',
  VIGNETTE = 'Vignette',
  AUTRE = 'Autre',
}
