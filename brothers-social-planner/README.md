# Brothers Social Planner — Supabase + Vercel

Application web de calendrier éditorial connectée au projet Supabase **Brothers Social Planner**.

## Données
- Aucun client de démonstration
- Aucune publication de démonstration
- Les données sont créées uniquement par l'utilisateur

## Backend Supabase
- Authentification email + mot de passe
- Clients synchronisés dans Supabase
- Publications synchronisées dans Supabase
- Visuels dans un bucket privé
- Row Level Security (RLS) activée pour isoler les données de chaque compte
- Clé publishable uniquement côté navigateur

## Déploiement Vercel
Le dossier est prêt pour un déploiement statique Vercel.

Fichiers principaux :
- `index.html`
- `styles.css`
- `app.js`
- `vercel.json`

Aucune commande de build n'est nécessaire.

Après le premier déploiement, ajouter l'URL de production Vercel dans la configuration Auth URL de Supabase afin que les emails de confirmation puissent rediriger vers le site public.

## Test local Windows
Double-cliquer sur `start.bat`, puis ouvrir `http://localhost:3000`.
