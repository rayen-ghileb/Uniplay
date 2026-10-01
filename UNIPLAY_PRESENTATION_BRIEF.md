# UniPlay - Brief de présentation PowerPoint

> Document de référence destiné à une IA chargée de générer une présentation PowerPoint sur le projet UniPlay.
>
> **Langue souhaitée de la présentation :** français  
> **Public cible :** jury académique, encadrants, responsables de l'Université ESPRIT et utilisateurs potentiels  
> **Nature du projet :** application web full-stack en développement  
> **Périmètre actuel :** réservation de terrains sportifs, création de jeux et administration de la plateforme

## 1. Consignes pour la présentation

La présentation doit être claire, professionnelle et orientée produit. Elle doit expliquer le besoin avant de détailler la solution technique. Le fil conducteur recommandé est :

1. Le contexte universitaire et le problème rencontré.
2. La solution apportée par UniPlay.
3. Les utilisateurs et leurs parcours.
4. Les fonctionnalités principales.
5. Les technologies et l'architecture.
6. Les exigences fonctionnelles et non fonctionnelles.
7. Une conclusion sur la valeur apportée et les évolutions possibles.

La présentation doit éviter de présenter UniPlay comme une simple application CRUD. Il s'agit d'un service centralisé qui organise l'accès aux infrastructures sportives, facilite la constitution de groupes et donne à l'administration une vision globale de l'activité.

## 2. Introduction

UniPlay est une plateforme web de réservation et de gestion des activités sportives destinée à la communauté de l'Université ESPRIT.

Elle permet aux étudiants de :

- consulter les sports et les terrains disponibles ;
- visualiser les créneaux libres ;
- réserver un créneau pour un terrain ;
- inviter d'autres étudiants à participer ;
- créer ou rejoindre un jeu public ou privé ;
- suivre leurs réservations, leurs jeux et leurs invitations ;
- recevoir des notifications liées à la vie de leurs jeux ;
- gérer leur profil et envoyer des réclamations à l'administration.

Elle permet aux administrateurs de :

- gérer les comptes étudiants ;
- administrer les sports et les terrains ;
- configurer les horaires, la capacité et la durée des créneaux ;
- consulter le planning et les réservations ;
- annuler une réservation si nécessaire ;
- exporter les données de réservation ;
- consulter les statistiques et les réclamations.

## 3. Problématique

Dans un établissement universitaire, la réservation des terrains sportifs peut devenir difficile lorsque les disponibilités, les utilisateurs et les groupes sont gérés de manière manuelle ou dispersée.

Les problèmes principaux sont les suivants :

- manque de visibilité sur les créneaux disponibles ;
- risques de conflits ou de doubles réservations ;
- échanges informels et difficiles à suivre pour constituer une équipe ;
- absence d'un historique fiable des réservations ;
- difficulté pour l'administration de connaître l'occupation des terrains ;
- gestion manuelle des comptes, des terrains, des créneaux et des annulations ;
- manque de centralisation des réclamations et des notifications ;
- perte de temps pour les étudiants comme pour les responsables sportifs.

### Question centrale

Comment centraliser, sécuriser et simplifier la réservation des infrastructures sportives tout en facilitant la création de jeux entre étudiants et le pilotage administratif ?

## 4. Solution proposée

UniPlay propose une application web centralisée composée de deux espaces complémentaires :

### Espace étudiant

L'étudiant se connecte avec son matricule, consulte le catalogue des sports, choisit un terrain et réserve un créneau disponible. Il peut ensuite créer un lobby de jeu, inviter des étudiants, accepter ou refuser des invitations et rejoindre des jeux publics.

### Espace administrateur

L'administrateur dispose d'un tableau de bord sécurisé pour superviser les utilisateurs, les sports, les terrains, les créneaux, les réservations, les jeux et les réclamations.

### Valeur ajoutée

- une seule plateforme pour découvrir, réserver et organiser une activité sportive ;
- une disponibilité des créneaux visible en temps réel ;
- une validation serveur qui protège l'intégrité des réservations ;
- une gestion des groupes intégrée à la réservation ;
- une meilleure traçabilité grâce à l'historique, aux notifications et aux exports ;
- une séparation claire entre l'expérience étudiant et l'administration.

## 5. Acteurs de l'application

### 5.1 Étudiant

L'étudiant est l'utilisateur principal de la plateforme. Il possède un matricule, un compte, un profil et un statut d'activation. Lors de son inscription, son compte doit être approuvé par un administrateur avant de pouvoir accéder aux fonctionnalités protégées.

### 5.2 Organisateur d'un jeu

L'organisateur est un étudiant qui réserve un terrain et crée un jeu associé à cette réservation. Il est automatiquement ajouté comme premier participant et peut gérer la taille du lobby, inviter d'autres étudiants et, selon les règles du jeu, gérer les membres.

### 5.3 Participant ou membre d'un jeu

Un participant peut être invité dans un jeu ou rejoindre directement un jeu public. Il peut accepter ou refuser une invitation, rejoindre un jeu, quitter un jeu et consulter les informations auxquelles il a accès.

Un même étudiant peut être simultanément simple participant d'un jeu et organisateur d'un autre.

### 5.4 Administrateur

L'administrateur est un utilisateur disposant du droit applicatif `is_admin`. Il supervise les comptes, les infrastructures, les réservations, les plannings, les jeux et les réclamations via un espace dédié.

### 5.5 Système UniPlay

Le système automatise plusieurs opérations : génération des créneaux, contrôle des capacités, prévention des doubles réservations, gestion des statuts, création des notifications, rafraîchissement des données et protection des routes.

### 5.6 Université ESPRIT

L'université est le contexte institutionnel et le bénéficiaire de la solution. Elle dispose d'une meilleure visibilité sur l'utilisation de ses infrastructures et peut améliorer l'organisation de ses activités sportives.

## 6. Fonctionnalités de chaque acteur

### 6.1 Fonctionnalités de l'étudiant

#### Compte et authentification

- créer un compte à partir d'un matricule étudiant ;
- renseigner ses informations personnelles, sa classe et sa spécialité ;
- attendre l'approbation de l'administration ;
- se connecter et se déconnecter ;
- utiliser des tokens JWT avec renouvellement de session ;
- récupérer un mot de passe oublié par courrier électronique ;
- modifier son profil, sa photo et son mot de passe.

#### Consultation des activités sportives

- consulter les sports actifs, notamment padel, football et basketball ;
- afficher les terrains associés à un sport ;
- consulter la capacité, l'image, le statut et les informations du terrain ;
- distinguer un terrain disponible d'un terrain en maintenance ;
- consulter les créneaux disponibles sur une fenêtre d'environ sept jours.

#### Réservation

- choisir un terrain et un créneau ;
- réserver un créneau encore libre ;
- devenir automatiquement l'organisateur de la réservation ;
- inviter d'autres étudiants à participer ;
- respecter la capacité maximale du terrain ;
- consulter les réservations à venir ;
- annuler sa propre réservation lorsque le délai autorisé est respecté ;
- retrouver les réservations terminées ou annulées dans l'historique.

#### Jeux et lobbies

- créer un jeu public ou privé lors de la réservation ;
- choisir la taille maximale du lobby, dans la limite de la capacité du terrain ;
- consulter les jeux publics à venir ;
- filtrer les jeux par sport ;
- rejoindre directement un jeu public ;
- inviter un étudiant dans un jeu ;
- accepter ou refuser une invitation ;
- quitter un jeu selon les règles prévues ;
- modifier la taille du lobby en tant que propriétaire ;
- consulter ses jeux actifs, en attente, terminés et annulés.

#### Notifications et réclamations

- recevoir des notifications d'invitation ;
- être informé lorsqu'un membre rejoint, quitte ou refuse un jeu ;
- recevoir les événements liés à une réservation ou à une annulation ;
- marquer les notifications comme lues ou les supprimer ;
- envoyer une réclamation ou un message à l'administration.

### 6.2 Fonctionnalités de l'organisateur

- réserver le terrain et créer le jeu en une seule opération ;
- être enregistré comme premier participant ;
- choisir si le jeu est public ou privé ;
- définir la taille maximale du lobby ;
- inviter des étudiants grâce à leur matricule ;
- consulter la composition du jeu ;
- modifier la taille du lobby entre le nombre de participants présents et la capacité du terrain ;
- être identifié comme propriétaire du jeu ;
- recevoir les notifications liées à l'activité du lobby.

### 6.3 Fonctionnalités du participant

- consulter les détails d'un jeu auquel il appartient ;
- rejoindre un jeu public ;
- recevoir et gérer une invitation ;
- accepter ou refuser une invitation ;
- quitter un jeu ;
- voir les autres membres selon la visibilité du jeu ;
- recevoir les notifications de participation et de changement d'état.

### 6.4 Fonctionnalités de l'administrateur

#### Tableau de bord et pilotage

- consulter des indicateurs statistiques ;
- voir le volume d'étudiants, de réservations et d'annulations ;
- suivre l'activité globale de la plateforme ;
- recevoir les événements importants liés aux réservations et aux jeux.

#### Gestion des utilisateurs

- consulter la liste des utilisateurs et des étudiants ;
- approuver ou activer un compte ;
- désactiver un compte ;
- supprimer un utilisateur ;
- attribuer ou retirer le statut administrateur ;
- consulter les informations de profil utiles à la gestion.

#### Gestion des sports et des terrains

- créer, modifier et désactiver un sport ;
- créer et modifier un terrain ;
- associer un terrain à un sport ;
- définir sa capacité et la durée d'un créneau ;
- définir les horaires d'ouverture ;
- importer une image de sport ou de terrain ;
- mettre un terrain en maintenance ;
- désactiver un terrain sans supprimer son historique.

#### Gestion des créneaux et du planning

- générer les créneaux du mois courant ou du mois suivant ;
- éviter la création de doublons ;
- consulter un planning mensuel par terrain ;
- visualiser les créneaux occupés et libres ;
- accéder aux détails d'une réservation depuis le planning.

#### Gestion des réservations

- consulter toutes les réservations ;
- rechercher par étudiant, matricule ou terrain ;
- annuler une réservation ;
- exporter les réservations au format CSV ;
- distinguer les réservations confirmées, annulées et terminées.

#### Gestion des réclamations

- consulter la liste des réclamations ;
- ouvrir le détail d'un message ;
- voir l'identité, l'email, le téléphone, la classe et la spécialité de l'expéditeur.

#### Gestion des groupes et jeux

- superviser les groupes et les événements de jeu via les notifications administratives ;
- suivre les réservations qui servent de base aux jeux ;
- intervenir lorsqu'une réservation ou une activité doit être annulée.

## 7. Besoins fonctionnels

Les besoins fonctionnels décrivent ce que l'application doit permettre de faire.

### BF1 - Gestion des comptes

Le système doit permettre l'inscription, la connexion, la déconnexion, la récupération du mot de passe et la mise à jour du profil. Un compte étudiant nouvellement créé doit rester inactif jusqu'à son approbation.

### BF2 - Gestion des accès

Le système doit protéger les pages destinées aux utilisateurs connectés et réserver l'espace d'administration aux utilisateurs possédant le statut administrateur.

### BF3 - Consultation du catalogue sportif

Le système doit afficher les sports actifs, les terrains visibles, leurs caractéristiques et leur statut de disponibilité.

### BF4 - Consultation des créneaux

Le système doit générer et exposer les créneaux correspondant aux horaires et à la durée définis pour chaque terrain.

### BF5 - Réservation d'un terrain

Le système doit permettre à un étudiant connecté de réserver un créneau futur et libre, en associant le terrain, le créneau et l'organisateur.

### BF6 - Validation de la réservation

Le système doit vérifier côté serveur que le créneau appartient au terrain choisi, n'est pas passé, n'est pas déjà réservé et respecte la capacité autorisée.

### BF7 - Gestion des participants

Le système doit permettre d'inviter des étudiants à une réservation ou à un jeu, éviter les doublons et empêcher de dépasser la capacité du terrain.

### BF8 - Création et gestion des jeux

Le système doit permettre de créer un jeu public ou privé lié à une réservation, de définir sa taille, de rejoindre un jeu public et de gérer les invitations.

### BF9 - Suivi des réservations

Le système doit afficher les réservations à venir, les réservations passées et les réservations annulées.

### BF10 - Annulation

Un étudiant doit pouvoir annuler sa propre réservation au moins douze heures avant le début du créneau. Un administrateur doit pouvoir annuler une réservation globale. L'annulation conserve une trace historique.

### BF11 - Notifications

Le système doit notifier les utilisateurs lors des invitations, acceptations, refus, arrivées, départs et événements administratifs importants.

### BF12 - Réclamations

Un étudiant doit pouvoir envoyer une réclamation et un administrateur doit pouvoir la consulter avec les informations de son auteur.

### BF13 - Administration des infrastructures

Un administrateur doit pouvoir gérer les sports, terrains, images, capacités, horaires, statuts et créneaux.

### BF14 - Planning et export

L'administrateur doit pouvoir consulter le planning mensuel d'un terrain, rechercher des réservations et exporter les données au format CSV.

## 8. Besoins non fonctionnels

### BNF1 - Sécurité

- authentification par JWT avec token d'accès et token de rafraîchissement ;
- contrôle d'accès pour les routes étudiantes et administratives ;
- mots de passe gérés par le système d'authentification Django ;
- validation des données côté API ;
- protection contre les doubles réservations grâce à une contrainte de base de données ;
- absence de divulgation de l'existence d'un email lors d'une demande de réinitialisation ;
- séparation entre les données d'un étudiant et les données administratives.

### BNF2 - Intégrité et cohérence

- une seule réservation confirmée par créneau ;
- un étudiant ne peut apparaître qu'une seule fois dans un même jeu ou une même réservation ;
- une réservation doit toujours référencer un terrain et un créneau cohérents ;
- les réservations annulées restent disponibles pour l'historique et le reporting ;
- les règles métier critiques doivent être contrôlées par le backend, et non uniquement par l'interface.

### BNF3 - Performance

- chargement rapide des écrans principaux ;
- consultation des créneaux et des réservations sans rechargement complet de la page ;
- mise en cache et invalidation des données serveur avec TanStack Query ;
- génération en masse des créneaux ;
- recherche et export adaptés aux besoins de l'administration.

### BNF4 - Disponibilité et maintenabilité

- architecture séparée entre frontend et backend ;
- API REST documentée avec OpenAPI et Swagger UI ;
- code organisé par domaines : comptes, sports, réservations, jeux et administration ;
- gestion centralisée des appels HTTP avec Axios ;
- composants et routes réutilisables côté React ;
- possibilité de faire évoluer le frontend, l'API et la base de données indépendamment.

### BNF5 - Ergonomie et accessibilité d'usage

- interface adaptée aux étudiants et à l'administration ;
- navigation par routes protégées ;
- calendrier de réservation lisible ;
- affichage clair des statuts : disponible, maintenance, confirmé, annulé et terminé ;
- interface responsive pour les écrans de tailles différentes ;
- messages d'erreur compréhensibles lors d'une action impossible.

### BNF6 - Évolutivité

La solution doit pouvoir accueillir de nouveaux sports, de nouveaux terrains, de nouveaux types de notifications et de nouvelles fonctionnalités sans remettre en cause le modèle général de l'application.

## 9. Technologies utilisées

### Frontend

- **React 19** : construction de l'interface utilisateur en composants ;
- **Vite** : serveur de développement et génération du build ;
- **React Router** : navigation et définition des routes ;
- **Axios** : communication avec l'API REST ;
- **TanStack React Query** : récupération, cache et invalidation des données serveur ;
- **React Hook Form** : gestion de formulaires ;
- **React Big Calendar** : affichage des créneaux et du calendrier ;
- **date-fns** : manipulation et localisation des dates ;
- **Tailwind CSS** : styles et design system ;
- **Lucide React** : icônes de l'interface ;
- **ESLint** : contrôle de la qualité du code JavaScript/JSX.

### Backend

- **Python** ;
- **Django** : framework web et modèle de données ;
- **Django REST Framework** : création de l'API REST ;
- **Simple JWT** : authentification par tokens JWT ;
- **PostgreSQL** : stockage persistant des utilisateurs, sports, terrains, créneaux, réservations et jeux ;
- **django-cors-headers** : gestion des communications entre frontend et backend ;
- **drf-spectacular** : génération de la documentation OpenAPI et Swagger ;
- **Pillow** : gestion des images téléversées ;
- **SMTP Gmail** : envoi des emails de récupération de mot de passe.

### Architecture technique

```text
Navigateur
    |
    | React SPA + React Router + Axios + TanStack Query
    | JSON / multipart pour les images
    v
Django REST Framework
    |
    | JWT, permissions, serializers, règles métier
    v
PostgreSQL
    |
    +-- Utilisateurs et profils
    +-- Sports et terrains
    +-- Créneaux et réservations
    +-- Participants, jeux et notifications
    +-- Réclamations
```

## 10. Modèle métier simplifié

- **User** : étudiant ou administrateur ; contient l'identité, le matricule, le profil et les droits.
- **Sport** : type d'activité sportive, par exemple padel, football ou basketball.
- **Terrain** : infrastructure appartenant à un sport, avec capacité, durée, image, horaires et statut.
- **TimeSlot** : créneau réservable d'un terrain, avec date et heures de début et de fin.
- **Reservation** : réservation confirmée ou annulée, rattachée à un terrain, un créneau et un organisateur.
- **Participant** : étudiant associé à une réservation.
- **Game** : lobby public ou privé construit autour d'une réservation.
- **GameParticipant** : membre invité ou ayant rejoint un jeu.
- **Notification** : événement adressé à un utilisateur.
- **Reclamation** : message envoyé par un étudiant à l'administration.

## 11. Parcours utilisateur principal à montrer dans la présentation

1. L'étudiant crée son compte avec son matricule.
2. L'administrateur approuve le compte.
3. L'étudiant se connecte et arrive sur la page d'accueil.
4. Il choisit un sport puis un terrain.
5. Il consulte les créneaux disponibles dans le calendrier.
6. Il choisit un créneau et définit la taille de son jeu.
7. Il choisit un jeu public ou privé.
8. La réservation et le lobby sont créés ensemble.
9. Il invite d'autres étudiants ou partage un jeu public.
10. Les participants acceptent, refusent ou rejoignent le jeu.
11. L'administrateur peut suivre la réservation dans son planning et son tableau de bord.

## 12. Règles métier importantes à valoriser

- un compte étudiant doit être activé par l'administration ;
- un terrain en maintenance reste visible mais ne peut pas être réservé ;
- un créneau passé ou déjà occupé ne peut pas être réservé ;
- une réservation confirmée est unique pour un créneau donné ;
- l'organisateur est automatiquement le premier participant ;
- les invitations en attente occupent une place dans le lobby ;
- la taille du jeu ne peut pas dépasser la capacité du terrain ;
- un étudiant ne peut pas être ajouté deux fois au même jeu ;
- une réservation étudiante est annulable au moins douze heures avant son début ;
- une annulation conserve l'historique au lieu de supprimer la donnée ;
- les règles critiques sont appliquées par l'API et protégées par la base de données.

## 13. Proposition de plan de diapositives

### Diapositive 1 - Titre

**UniPlay : la plateforme intelligente de réservation et d'organisation sportive à l'Université ESPRIT**

Présenter le logo, le nom du projet, l'équipe et le contexte académique.

### Diapositive 2 - Contexte et introduction

Présenter la vie sportive universitaire et le besoin de centraliser l'accès aux terrains.

### Diapositive 3 - Problématique

Illustrer les difficultés : manque de visibilité, réservations conflictuelles, groupes difficiles à constituer et gestion administrative dispersée.

### Diapositive 4 - Solution proposée

Montrer les deux espaces : application étudiant et tableau de bord administrateur.

### Diapositive 5 - Acteurs et rôles

Présenter étudiant, organisateur, participant, administrateur, système et université.

### Diapositive 6 - Parcours étudiant

Présenter le parcours inscription, approbation, recherche, réservation, invitation et suivi.

### Diapositive 7 - Réservation et calendrier

Montrer la sélection du sport, du terrain et du créneau, avec les contrôles de disponibilité et de capacité.

### Diapositive 8 - Jeux et lobbies

Expliquer la différence entre réservation et jeu, ainsi que les jeux publics/privés, les invitations et les notifications.

### Diapositive 9 - Fonctionnalités administrateur

Présenter utilisateurs, sports, terrains, créneaux, planning, réservations, CSV, statistiques et réclamations.

### Diapositive 10 - Technologies

Présenter React/Vite côté frontend, Django/DRF côté backend, PostgreSQL, JWT, Axios, React Query et les outils associés.

### Diapositive 11 - Architecture et modèle métier

Utiliser un schéma navigateur -> API Django -> PostgreSQL, puis un diagramme simplifié User/Sport/Terrain/TimeSlot/Reservation/Game.

### Diapositive 12 - Besoins fonctionnels

Regrouper les exigences par authentification, consultation, réservation, jeux, notifications et administration.

### Diapositive 13 - Besoins non fonctionnels

Présenter sécurité, intégrité, performance, ergonomie, maintenabilité, disponibilité et évolutivité.

### Diapositive 14 - Valeur apportée et perspectives

Conclure sur la centralisation, le gain de temps, la réduction des conflits et l'amélioration du pilotage sportif. Les évolutions possibles incluent les notifications enrichies, une application mobile, des statistiques avancées et des recommandations personnalisées.

### Diapositive 15 - Conclusion

Rappeler qu'UniPlay transforme une gestion fragmentée des terrains en une expérience numérique unique, collaborative et administrable.

## 14. Éléments visuels recommandés

L'IA qui générera le PowerPoint peut utiliser :

- une palette inspirée de l'identité visuelle actuelle : noir profond, gris clair, blanc et rouge crimson ;
- des captures de l'accueil étudiant, du calendrier, du lobby et du tableau de bord ;
- des icônes pour les acteurs et les fonctionnalités ;
- un schéma d'architecture client/API/base de données ;
- un diagramme de parcours étudiant ;
- une matrice acteur/fonctionnalité ;
- un exemple de planning mensuel avec créneaux libres et occupés ;
- des pictogrammes pour sécurité, performance, intégrité et évolutivité.

Les diapositives doivent rester lisibles : privilégier les mots-clés, les schémas et les captures d'écran plutôt que de longs paragraphes. Les détails présents dans ce fichier peuvent servir de notes du présentateur.

## 15. Formulation courte du projet

> **UniPlay est une plateforme web full-stack qui permet aux étudiants de l'Université ESPRIT de consulter, réserver et partager des terrains sportifs, tout en offrant à l'administration des outils centralisés de gestion, de planification et de suivi.**

## 16. Note de fidélité technique

Ce document s'appuie sur le code actuel du projet, notamment les applications `accounts`, `sports`, `reservations`, `games` et `admin_panel`, ainsi que sur les routes et dépendances réellement présentes. Les informations sensibles de configuration, comme les mots de passe de base de données ou de messagerie, ne doivent pas apparaître dans la présentation.