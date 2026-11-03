import { Profile } from './profile.model';

/*
 * Tout le contenu du portfolio. Les faits viennent de l'export LinkedIn (novembre 2026) et des
 * dépôts publics github.com/BaptisteNodon (Argus, Ciné Baptiste), et de l'ancien portfolio
 * (drive Laravel, CRM, gestion de magasin, visualiseur 3D, captures dans public/projects/) ;
 * les phrases d'accroche et les coulisses sont des propositions à reformuler librement.
 * Les coordonnées GPS sont celles des villes, à quelques centaines de mètres près.
 */
export const PROFILE: Profile = {
  firstName: 'Baptiste',
  lastName: 'Nodon',
  kicker: 'Apprenti développeur · Bachelor CPI · DIIAGE',
  location: 'Auvergne-Rhône-Alpes, France',
  city: 'Villefontaine',
  status: 'En alternance chez Quercy Réfrigération',
  lead:
    "Du serveur à l'interface : je développe des outils métiers qui tiennent la route, " +
    "sans jamais perdre de vue l'infrastructure qui les fait tourner.",

  headlines: {
    profil: { title: "Un parcours qui part de l'infrastructure pour arriver au code." },
    parcours: {
      title: 'Le terrain, avant tout.',
      intro:
        "Trois expériences en Auvergne-Rhône-Alpes : le réseau d'une collectivité, un CRM en Angular, " +
        "puis l'alternance.",
    },
    realisations: {
      title: 'Des outils qui servent pour de vrai.',
      intro: "Projets d'entreprise, d'école et personnels : du mobile à l'API, du réseau au navigateur.",
    },
    competences: {
      title: 'Ce que je sais faire, et où je l’ai appris.',
      intro: 'Chaque compétence est reliée aux expériences et aux projets où je l’ai mise en pratique.',
    },
    formation: {
      title: 'Apprendre, puis appliquer.',
      intro: 'Un bac orienté maths et informatique, un BTS SIO, puis un Bachelor de coordination de projets.',
    },
    coulisses: {
      title: 'Ce portfolio est aussi un projet.',
      intro: 'Une application Angular sans zone.js, qui se lit à deux fenêtres.',
    },
    contact: { title: 'Une alternance, un projet, une question ?' },
  },

  about: {
    title: "Un parcours qui part de l'infrastructure pour arriver au code.",
    paragraphs: [
      'Après un bac Mathématiques et informatique, puis un BTS Services informatiques aux organisations ' +
        "au lycée Lamartine, j'ai rejoint le DIIAGE pour un Bachelor Coordinateur de projets informatiques.",
      'Depuis décembre 2025, je suis apprenti en développement informatique chez Quercy Réfrigération, ' +
        "à Villefontaine. Avant ça, j'ai configuré des serveurs et un réseau Windows et Linux pour une " +
        'communauté de communes, puis développé un CRM interne en Angular pendant un stage de six semaines.',
      "À l'école, je construis des projets complets en équipe : Argus, par exemple, relie une application " +
        "Android, une API .NET, l'Active Directory et la supervision Zabbix.",
    ],
    linkedinSummary:
      'Actuellement en Bachelor CPI (Coordinateur de projets informatiques). ' +
      "Je recherche actuellement une alternance pour une durée d'un an.",
    linkedinSummaryOutcome: 'alternance trouvée en décembre 2025 ✔',
  },

  contact: {
    invitation: 'Une alternance, un projet, une question ?',
    email: 'baptiste.nodon@gmail.com',
    linkedin: 'https://www.linkedin.com/in/baptiste-nodon/',
    github: 'https://github.com/BaptisteNodon',
  },

  experiences: [
    {
      id: 'quercy',
      company: 'Quercy Réfrigération',
      shortName: 'Quercy',
      role: 'Apprenti en développement informatique',
      contract: 'Alternance',
      start: '2025-12',
      end: null,
      place: { city: 'Villefontaine', region: 'Auvergne-Rhône-Alpes', geo: { lat: 45.6136, lon: 5.1503 } },
      summary: 'Développement informatique en alternance, en parallèle du Bachelor Coordinateur de projets informatiques.',
      skills: [],
      secret: "J+{jours} d'alternance · compteur en direct",
      secretLabel: "Le compteur d'alternance",
    },
    {
      id: 'celere',
      company: 'Celere Ouvertures',
      shortName: 'Celere',
      role: 'Stagiaire en informatique',
      contract: 'Stage · 6 semaines',
      start: '2025-03',
      end: '2025-04',
      place: { city: 'Saint-Georges-de-Reneins', region: 'Auvergne-Rhône-Alpes', geo: { lat: 46.0597, lon: 4.7244 } },
      summary:
        "Développement d'une application : création d'un CRM interne en Angular pour gérer les clients " +
        'et générer des rapports.',
      skills: ['angular', 'typescript', 'html-css'],
      secret: '6 semaines · 1 CRM · clients + rapports',
      secretLabel: 'Le CRM en six semaines',
    },
    {
      id: 'ccsb',
      company: 'Communauté de Communes Saône-Beaujolais',
      shortName: 'Saône-Beaujolais',
      role: 'Stagiaire au service informatique',
      contract: 'Stage',
      start: '2024-05',
      end: '2024-06',
      place: { city: 'Belleville-en-Beaujolais', region: 'Auvergne-Rhône-Alpes', geo: { lat: 46.1089, lon: 4.7494 } },
      summary: 'Configuration de serveurs et gestion du réseau sous Windows et Linux.',
      skills: ['infra', 'serveurs', 'reseau', 'windows', 'linux'],
      secret: 'Windows ⇄ Linux : les deux camps',
      secretLabel: 'Windows et Linux, les deux camps',
    },
  ],

  projects: [
    {
      id: 'argus',
      title: 'Argus',
      context: "Projet d'équipe · DIIAGE",
      year: '2026',
      summary:
        "Une application de supervision : une appli Android et une API .NET qui remontent les alertes " +
        "Zabbix en temps réel, avec connexion par l'Active Directory.",
      highlights: [
        'Appli Android en Kotlin · Jetpack Compose · MVI · Koin',
        'API .NET 10 conteneurisée · JWT et refresh token haché',
        'Connexion par bind LDAPS sur l’Active Directory',
        'Alertes Zabbix poussées par webhook · contrat OpenAPI partagé',
      ],
      skills: ['kotlin', 'compose', 'dotnet', 'api-rest', 'sql', 'ad-ldap', 'zabbix', 'clean-archi', 'gitlab-ci', 'docker'],
      visual: 'argus',
      featured: true,
      secret: '3 tiers · mobile → API → SQL Server + Zabbix',
      secretLabel: "L'architecture d'Argus",
    },
    {
      id: 'crm',
      title: 'CRM interne',
      context: 'Stage · Celere Ouvertures',
      year: '2025',
      summary:
        'Un CRM pour les commerciaux : Angular et NgRx côté interface, une API REST Nest.js et Prisma ' +
        'sur MySQL, conçu et développé pendant un stage de six semaines.',
      highlights: [
        'Gestion des prospects et des clients',
        'Suivi des interactions et des opportunités',
        'Tableaux de bord et rapports',
        'Authentification et rôles utilisateurs',
      ],
      skills: ['angular', 'typescript', 'nestjs', 'sql', 'api-rest'],
      visual: 'crm',
      images: [{ src: 'projects/crm-1.png', alt: "Page d'accueil du CRM Celere Ouverture" }],
      secret: 'schéma de principe · clients ↔ rapports',
      secretLabel: 'Le schéma du CRM',
    },
    {
      id: 'cine',
      title: 'Ciné Baptiste',
      context: 'Épreuve · Android',
      year: '2025',
      summary:
        "Une application Android qui affiche les films populaires du moment grâce à l'API TMDB, " +
        'construite en Clean Architecture.',
      highlights: ['Couches data · domain · ui', 'Injection de dépendances avec Koin', 'Son et vibration via un manager dédié'],
      skills: ['kotlin', 'compose', 'api-rest', 'clean-archi'],
      visual: 'cine',
      repo: 'https://github.com/BaptisteNodon/EpreuveBaptisteKotlin',
      secret: 'ui → domain ← data · les dépendances pointent vers le centre',
      secretLabel: 'Les couches de Ciné Baptiste',
    },
    {
      id: 'drive',
      title: 'Drive en Laravel',
      context: 'Projet BTS SIO',
      summary:
        'Un site de courses en ligne façon « drive », responsive, avec des vues générées côté serveur ' +
        'par Laravel et Blade.',
      highlights: [
        'Catalogue, comptes et commandes gérés par Laravel',
        'Panier interactif en JavaScript',
        'Espace client pour suivre ses commandes',
        'Interface responsive avec Bootstrap',
      ],
      skills: ['php-laravel', 'javascript', 'sql', 'html-css'],
      visual: 'drive',
      images: [
        { src: 'projects/drive-1.png', alt: 'Le panier du drive, avec cinq produits' },
        { src: 'projects/drive-2.png', alt: 'Capture du drive Laravel, deuxième écran' },
        { src: 'projects/drive-3.png', alt: 'Capture du drive Laravel, troisième écran' },
        { src: 'projects/drive-4.png', alt: 'Capture du drive Laravel, quatrième écran' },
        { src: 'projects/drive-5.png', alt: 'Capture du drive Laravel, cinquième écran' },
      ],
      secret: 'Blade rend les pages · JavaScript tient le panier',
      secretLabel: 'Le drive vu de l’intérieur',
    },
    {
      id: 'magasin',
      title: 'Gestion de magasin',
      context: 'Projet BTS SIO · C#',
      summary:
        "Une application de bureau en C# et Windows Forms pour gérer un magasin : produits, " +
        'informations et horaires, sur une base MySQL via Entity Framework.',
      highlights: [
        'Connexion des comptes du personnel',
        'Catalogue produits classé par familles (ajout, modification, suppression)',
        "Horaires d'ouverture réglables jour par jour",
        'Entity Framework entre l’application et MySQL',
      ],
      skills: ['dotnet', 'sql'],
      visual: 'magasin',
      images: [
        { src: 'projects/magasin-1.png', alt: 'Capture de la gestion de magasin, premier écran' },
        { src: 'projects/magasin-2.png', alt: "Page d'accueil de l'application, avec ses six actions" },
        { src: 'projects/magasin-3.png', alt: 'Capture de la gestion de magasin, troisième écran' },
        { src: 'projects/magasin-4.png', alt: 'Capture de la gestion de magasin, quatrième écran' },
        { src: 'projects/magasin-5.png', alt: 'Capture de la gestion de magasin, cinquième écran' },
        { src: 'projects/magasin-6.png', alt: 'Capture de la gestion de magasin, sixième écran' },
      ],
      secret: 'WinForms → Entity Framework → MySQL',
      secretLabel: 'Les couches du magasin',
    },
    {
      id: 'visu3d',
      title: 'Visualiseur 3D',
      context: 'Expérimentation · navigateur',
      summary:
        'Charger un modèle 3D au format OBJ et le manipuler dans le navigateur, avec Three.js dans ' +
        'une application Angular.',
      highlights: [
        'Import de fichiers OBJ',
        'Caméra libre : zoom, rotation, déplacement',
        'Réglage des lumières et de la position du modèle',
      ],
      skills: ['threejs', 'angular', 'typescript'],
      visual: 'visu3d',
      secret: 'scène · caméra · lumière · OBJLoader',
      secretLabel: 'La scène Three.js',
    },
    {
      id: 'infra',
      title: 'Serveurs & réseau',
      context: 'Stage · CC Saône-Beaujolais',
      year: '2024',
      summary:
        "Configuration de serveurs et gestion du réseau d'une collectivité, dans un environnement " +
        'mixte Windows et Linux.',
      highlights: ['Serveurs Windows et Linux', "Réseau d'une collectivité", 'Support au service informatique'],
      skills: ['infra', 'serveurs', 'reseau', 'windows', 'linux'],
      visual: 'infra',
      secret: 'schéma de principe · Windows ⇄ Linux',
      secretLabel: 'Le schéma réseau',
    },
    {
      id: 'site',
      title: 'Portfolio v2',
      context: 'Projet personnel',
      year: '2026',
      summary:
        "Ce site : un portfolio Angular qui se lit à deux fenêtres. Rétrécissez-en une, posez-la sur l'autre : " +
        'elle devient une loupe à rayons X.',
      highlights: ['Angular 21 sans zone.js', 'Synchronisation multi-fenêtres', 'Architecture en couches et en features'],
      skills: ['angular', 'typescript', 'html-css', 'clean-archi'],
      visual: 'site',
      secret: '2 fenêtres · 1 page · 0 serveur',
      secretLabel: 'Le plan de ce site',
    },
  ],

  skillGroups: [
    { id: 'dev', label: 'Développement', caption: 'Web, mobile et API' },
    { id: 'archi', label: 'Architecture & outillage', caption: 'Concevoir, versionner, livrer' },
    { id: 'infra', label: 'Infrastructure', caption: 'Serveurs, réseau, annuaire, supervision' },
    { id: 'pilotage', label: 'Pilotage', caption: 'Projets et certification' },
  ],

  skills: [
    { id: 'angular', label: 'Angular', group: 'dev' },
    { id: 'typescript', label: 'TypeScript', group: 'dev' },
    { id: 'html-css', label: 'HTML & CSS', group: 'dev' },
    { id: 'javascript', label: 'JavaScript', group: 'dev' },
    { id: 'dotnet', label: '.NET · C#', group: 'dev' },
    { id: 'kotlin', label: 'Kotlin', group: 'dev' },
    { id: 'compose', label: 'Jetpack Compose', group: 'dev' },
    { id: 'api-rest', label: 'API REST', group: 'dev' },
    { id: 'nestjs', label: 'Node.js · Nest.js', group: 'dev' },
    { id: 'php-laravel', label: 'PHP · Laravel', group: 'dev' },
    { id: 'sql', label: 'SQL · MySQL', group: 'dev' },
    { id: 'threejs', label: 'Three.js', group: 'dev' },
    { id: 'clean-archi', label: 'Clean Architecture', group: 'archi' },
    { id: 'gitlab-ci', label: 'Git · GitLab CI', group: 'archi' },
    { id: 'docker', label: 'Docker', group: 'archi' },
    { id: 'infra', label: 'Infrastructure informatique', group: 'infra' },
    { id: 'serveurs', label: 'Serveurs', group: 'infra' },
    { id: 'reseau', label: 'Réseau', group: 'infra' },
    { id: 'windows', label: 'Windows', group: 'infra' },
    { id: 'linux', label: 'Linux', group: 'infra' },
    { id: 'ad-ldap', label: 'Active Directory · LDAP', group: 'infra' },
    { id: 'zabbix', label: 'Supervision Zabbix', group: 'infra' },
    { id: 'coordination', label: 'Coordination de projets', group: 'pilotage' },
    { id: 'pix', label: 'Certification PIX', group: 'pilotage' },
  ],

  otherSkillSources: [
    { id: 'cpi', label: 'Bachelor CPI', skills: ['coordination'] },
    { id: 'linkedin', label: 'Top LinkedIn', skills: ['infra', 'dotnet'] },
    { id: 'pix', label: 'Certification', skills: ['pix'] },
  ],

  linkedinTopSkills: ['Infrastructure', '.NET Framework', 'Infrastructure informatique'],

  education: [
    {
      id: 'diiage',
      school: 'DIIAGE',
      degree: 'Bachelor Coordinateur de projets informatiques',
      acronym: 'CPI',
      start: '2025-07',
      end: '2026-08',
    },
    {
      id: 'lamartine',
      school: 'Lycée Lamartine',
      degree: 'BTS Services informatiques aux organisations',
      acronym: 'SIO',
      start: '2023',
      end: '2025',
    },
    {
      id: 'aiguerande',
      school: 'Lycée polyvalent Aiguerande',
      degree: 'Baccalauréat général',
      field: 'Mathématiques et informatique',
      start: '2020-09',
      end: '2023-06',
    },
  ],

  certifications: [{ id: 'pix', label: 'PIX', description: 'certification des compétences numériques' }],
};
