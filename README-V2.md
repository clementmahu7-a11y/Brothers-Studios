# Brothers Studios V2 — Preview (branche feature/site-v2-studio)

## Architecture
Site statique HTML/CSS/JS, sans changement de framework. Les pages publiques sont dans leurs dossiers `index.html` ; design partagé dans `assets/site-v2.css`, interactions et prix dans `assets/site-v2.js`.
Les pages historiques de démonstration et les outils internes du dépôt sont préservés.

## Mise en ligne
Ne pas fusionner cette branche sur `main` avant validation. Le domaine public actuel doit rester inchangé. Vérifier la liaison réelle du domaine (le projet Vercel **brothers-studios** ne liste pas brothersstudios.fr parmi ses domaines lors de l'audit).

## Formulaire
Le formulaire POST /api/contact utilise la fonction Vercel `api/contact.js`.
Pour activer l'envoi réel, configurer dans Vercel Preview puis Production :
- `RESEND_API_KEY` (clé secrète, jamais dans Git)
- `CONTACT_FROM_EMAIL` (adresse expéditrice vérifiée chez Resend)
- Optionnel : `CONTACT_TO_EMAIL` (par défaut : brothersstudios9@gmail.com)

Tant que ces paramètres ne sont pas présents, le formulaire répond explicitement que l'envoi est indisponible et les coordonnées directes restent visibles. Une protection anti-spam supplémentaire de type Turnstile ou un limiteur partagé sera nécessaire pour un déploiement à fort trafic. Le limiteur mémoire est seulement best-effort en environnement serverless.

## Vérifications avant production
- Visuel : desktop, tablette, mobile (320–1440 px) et clavier, réduction d'animations.
- Comportement : navigation, liens, CTA, formulaires, confirmation d'envoi après configuration.
- Technique : vérifier déploiement en preview sur Vercel, réponse de l'API, performances Lighthouse, SEO et données structurées.
- Contenu : valider explicitement les intitulés et périmètres des offres, droit de présenter les réalisations, autorisations de captures et statut du logiciel.
- Légal : actualiser mentions hébergement si migration GitHub Pages → Vercel ; revoir CGV / traitement des données et durée de conservation.
- SEO : lors du passage de la V1 à la V2, prévoir des redirections des anciennes ancres et confirmer le domaine canonique ; conserver les démonstrations accessibles.

## Notes produit
- Brothers Convocations : tarifs confirmés 20 €/mois, mise en place normale 150 €, promotion 75 € pour les trois premiers clubs seulement. Publication actuelle prudente : commercialisation à confirmer.
- Brothers Studios OS : outil interne, non commercialisé, aucune donnée interne diffusée.
- Les Étangs du Moulin : collaboration confirmée, pas de captures ou de logos clients sans droit de publication.
