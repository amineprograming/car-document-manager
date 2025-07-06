# 📱 Gestionnaire de Documents Auto

Une application mobile complète construite avec Ionic + Angular et Firebase pour gérer tous les documents liés aux véhicules (assurance, carte grise, contrôle technique, etc.) avec des notifications d'expiration.

## 🎯 Fonctionnalités Principales

### ✅ Fonctionnalités Implémentées

#### 🚗 Gestion des Véhicules

- ✅ Ajouter, modifier, supprimer des véhicules
- ✅ Champs requis : Matricule, Marque, Modèle, Chauffeur, Téléphone
- ✅ Interface intuitive avec recherche et filtrage
- ✅ Validation des données et gestion d'erreurs

#### 📄 Gestion des Documents

- ✅ Ajouter, modifier, supprimer des documents
- ✅ Types de documents : Assurance, Carte Grise, Contrôle Technique, Vignette, Autre
- ✅ Champs : Référence, Type, Matricule véhicule, Date début/fin, Statut actif
- ✅ Liaison avec les véhicules via matricule

#### 🔔 Système de Notifications

- ✅ Vérification quotidienne des expirations
- ✅ Notifications locales pour les documents :
  - Expirant aujourd'hui
  - Expirant dans les 7 prochains jours
  - Expirés depuis X jours
- ✅ Paramétrable (nombre de jours d'avance)

#### 🔍 Recherche et Filtrage

- ✅ Recherche par matricule, chauffeur, type de document
- ✅ Filtres : Actif/Inactif, Expiré/Expirant bientôt
- ✅ Interface de recherche en temps réel

#### 📊 Tableau de Bord

- ✅ Statistiques : Nombre total de véhicules, documents actifs, expirés, expirant bientôt
- ✅ Liste des documents à expiration proche
- ✅ Actions rapides vers les autres sections
- ✅ Interface utilisateur moderne et intuitive

#### 💾 Stockage Local (Offline First)

- ✅ Base de données SQLite locale via Capacitor
- ✅ Fonctionne entièrement hors ligne
- ✅ Synchronisation cloud préparée (Phase 2)

#### 🔐 Authentification

- ✅ Connexion Google via Firebase
- ✅ Gestion des sessions utilisateur
- ✅ Interface de connexion attrayante

## 🛠️ Stack Technique

- **Framework**: Ionic 7 + Angular 17
- **Base de données**: SQLite (Capacitor Community)
- **Authentification**: Firebase Auth avec Google
- **Notifications**: Capacitor Local Notifications
- **Styling**: CSS personnalisé avec variables Ionic
- **Langue**: Interface entièrement en français

## 📱 Pages et Navigation

1. **🔐 Page de Connexion** (`/auth`)

   - Authentification Google
   - Design moderne avec dégradé
   - Liste des fonctionnalités

2. **📊 Tableau de Bord** (`/tabs/dashboard`)

   - Vue d'ensemble des statistiques
   - Documents à expiration proche
   - Actions rapides

3. **🚗 Gestion Véhicules** (`/tabs/cars`)

   - Liste avec recherche
   - Formulaires d'ajout/modification
   - Compteur de documents par véhicule

4. **📄 Gestion Documents** (`/tabs/documents`)

   - Liste avec filtres avancés
   - Statuts d'expiration colorés
   - Formulaires complets

5. **🔔 Alertes** (`/tabs/alerts`)

   - Documents expirés et expirant
   - Notifications personnalisables

6. **⚙️ Paramètres** (`/tabs/settings`)
   - Configuration des notifications
   - Gestion du profil utilisateur

## 🚀 Installation et Configuration

### Prérequis

```bash
node >= 16
npm >= 8
@ionic/cli
@angular/cli
```

### Installation

```bash
# Cloner le projet
cd car-document-manager

# Installer les dépendances
npm install

# Configurer Firebase
# 1. Créer un projet Firebase
# 2. Activer Authentication avec Google
# 3. Copier la configuration dans src/main.ts
```

### Configuration Firebase

Remplacez la configuration dans `src/main.ts` :

```typescript
const firebaseConfig = {
  apiKey: "votre-api-key",
  authDomain: "votre-projet.firebaseapp.com",
  projectId: "votre-projet-id",
  storageBucket: "votre-projet.appspot.com",
  messagingSenderId: "123456789",
  appId: "votre-app-id",
};
```

### Développement

```bash
# Lancer en mode développement
ionic serve

# Builder pour production
ionic build

# Ajouter plateforme mobile
ionic capacitor add android
ionic capacitor add ios

# Synchroniser et ouvrir
ionic capacitor sync
ionic capacitor open android
ionic capacitor open ios
```

## 📐 Architecture du Code

```
src/app/
├── models/           # Interfaces TypeScript
│   ├── car.model.ts
│   ├── document.model.ts
│   └── user.model.ts
├── services/         # Services Angular
│   ├── auth.service.ts
│   ├── database.service.ts
│   ├── notification.service.ts
│   └── dashboard.service.ts
├── pages/           # Pages de l'application
│   ├── auth/
│   ├── tabs/
│   ├── cars/
│   ├── documents/
│   ├── alerts/
│   └── settings/
└── assets/          # Ressources statiques
```

## 🗄️ Structure de la Base de Données

### Table `cars`

```sql
CREATE TABLE cars (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  matricule TEXT NOT NULL UNIQUE,
  marque TEXT NOT NULL,
  model TEXT NOT NULL,
  chauffeur TEXT NOT NULL,
  tel TEXT NOT NULL,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### Table `documents`

```sql
CREATE TABLE documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT NOT NULL UNIQUE,
  typeDocument TEXT NOT NULL,
  matriculeCar TEXT NOT NULL,
  dateDebut TEXT NOT NULL,
  dateFin TEXT NOT NULL,
  documentActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (matriculeCar) REFERENCES cars (matricule)
);
```

### Table `settings`

```sql
CREATE TABLE settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  notificationDays INTEGER DEFAULT 7
);
```

## 🔔 Système de Notifications

Le système vérifie automatiquement tous les jours :

- **Documents expirant aujourd'hui** → Notification immédiate
- **Documents expirant bientôt** → Notification programmée
- **Statuts visuels** dans l'interface avec codes couleur

## 🎨 Design et UX

- **Design System**: Variables CSS Ionic personnalisées
- **Couleurs**: Palette cohérente avec indicateurs d'état
- **Responsive**: Optimisé mobile-first avec adaptations tablette
- **Animations**: Transitions fluides et micro-interactions
- **Accessibilité**: Contrastes et tailles de police appropriés

## 🔮 Roadmap (Phase 2)

- [ ] Synchronisation cloud Firebase Firestore
- [ ] Photos de documents avec scan
- [ ] Partage de documents
- [ ] Rappels personnalisés
- [ ] Export PDF/Excel
- [ ] Mode sombre
- [ ] Multi-langues
- [ ] Widget home screen

## 📊 Performances

- **Temps de chargement**: < 2 secondes
- **Stockage local**: Optimisé SQLite
- **Mémoire**: Gestion efficace des listes
- **Batterie**: Notifications optimisées

## 🧪 Tests

```bash
# Tests unitaires
npm run test

# Tests E2E
npm run e2e

# Build de production
npm run build --prod
```

## 📝 Notes de Développement

### Bonnes Pratiques Appliquées

- ✅ Architecture modulaire avec services
- ✅ Gestion d'erreurs centralisée
- ✅ Validation des formulaires
- ✅ Responsive design
- ✅ Optimisation des performances
- ✅ Code TypeScript strictement typé

### Améliorations Techniques

- ✅ Standalone Components Angular
- ✅ Signals pour la réactivité
- ✅ Lazy loading des pages
- ✅ Service Workers pour le cache
- ✅ Optimisation des bundles

## 🤝 Contribution

Pour contribuer au projet :

1. Fork le repository
2. Créer une branche feature
3. Commiter les changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🆘 Support

Pour toute question ou problème :

- 📧 Email : support@car-documents.app
- 🐛 Issues : [GitHub Issues](https://github.com/your-repo/issues)
- 📖 Documentation : [Wiki](https://github.com/your-repo/wiki)

---

🔧 **Status**: ✅ Version 1.0 - Production Ready
🚀 **Dernière mise à jour**: Juillet 2025
