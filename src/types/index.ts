export interface Utilisateur {
  id: string
  nom: string
  email: string
  role: string
  organisationId: string
}

export interface Organisation {
  id: string
  nom: string
  slug: string
}

export interface Compte {
  id: string
  nom: string
  type: string
  soldeInitial: number
  soldeActuel: number
  devise: string
  actif: boolean
  creeLe: string
  organisationId: string
}

export interface Transaction {
  id: string
  compteId: string
  categorieId?: string
  montant: number
  type: 'ENTREE' | 'SORTIE'
  sourcePaiement: string
  description?: string
  dateTransaction: string
  categorieNom?: string
  compteNom?: string
}

export interface Categorie {
  id: string
  nom: string
  type: string
  couleur?: string
  estSysteme: boolean
  organisationId: string
}

export interface Budget {
  id: string
  categorieId: string
  categorieNom: string
  categorieCouleur?: string
  montantLimite: number
  montantDepense: number
  pourcentage: number
  dateDebut: string
  dateFin: string
}

export interface Alerte {
  id: string
  type: string
  message: string
  lue: boolean
  budgetId: string
  creeLe: string
}

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface AuthResponse {
  token: string
  utilisateur: Utilisateur
}
