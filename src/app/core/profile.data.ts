import { Profile } from './profile.model';

/*
 * Tout le contenu du portfolio. Les faits viennent de l'export LinkedIn (novembre 2026) ;
 * les phrases d'accroche et les coulisses sont des propositions à reformuler librement.
 * Les coordonnées GPS sont celles des villes, à quelques centaines de mètres près.
 */
export const PROFILE: Profile = {
  firstName: 'Baptiste',
  lastName: 'Nodon',
  kicker: 'Apprenti développeur · Bachelor CPI · DIIAGE',
  location: 'Auvergne-Rhône-Alpes, France',
  status: 'En alternance chez Quercy Réfrigération',
  lead:
    "Du serveur à l'interface : je développe des outils métiers qui tiennent la route, " +
    "sans jamais perdre de vue l'infrastructure qui les fait tourner.",

  about: {
    title: "Un parcours qui part de l'infrastructure pour arriver au code.",
    paragraphs: [
      'Après un bac Mathématiques et informatique, puis un BTS Services informatiques aux organisations ' +
        "au lycée Lamartine, j'ai rejoint le DIIAGE pour un Bachelor Coordinateur de projets informatiques.",
      'Depuis décembre 2025, je suis apprenti en développement informatique chez Quercy Réfrigération, ' +
        "à Villefontaine. Avant ça, j'ai configuré des serveurs et un réseau Windows et Linux pour une " +
        'communauté de communes, puis développé un CRM interne en Angular pendant un stage de six semaines.',
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
      id: 'crm',
      title: 'CRM interne',
      context: 'Celere Ouvertures',
      year: '2025',
      summary:
        "Application Angular pour gérer les clients de l'entreprise et générer des rapports, " +
        'conçue et développée pendant un stage de six semaines.',
      skills: ['angular', 'typescript', 'html-css'],
      visual: 'crm',
      secret: 'schéma de principe · clients ↔ rapports',
      secretLabel: 'Le schéma du CRM',
    },
    {
      id: 'infra',
      title: 'Serveurs & réseau',
      context: 'CC Saône-Beaujolais',
      year: '2024',
      summary:
        "Configuration de serveurs et gestion du réseau d'une collectivité, dans un environnement " +
        'mixte Windows et Linux.',
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
        'Ce site : un portfolio Angular qui se lit à deux fenêtres, avec synchronisation multi-fenêtres, ' +
        'rendu « rayons X » et chasse aux secrets.',
      skills: ['angular', 'typescript', 'html-css'],
      visual: 'site',
      secret: '2 fenêtres · 1 page · 0 serveur',
      secretLabel: 'Le plan de ce site',
    },
  ],

  skillGroups: [
    { id: 'dev', label: 'Développement', caption: 'Applications web et outils métiers' },
    { id: 'infra', label: 'Infrastructure', caption: 'Serveurs, réseau, systèmes' },
    { id: 'pilotage', label: 'Pilotage', caption: 'Projets et certification' },
  ],

  skills: [
    { id: 'angular', label: 'Angular', group: 'dev' },
    { id: 'typescript', label: 'TypeScript', group: 'dev' },
    { id: 'dotnet', label: '.NET Framework', group: 'dev' },
    { id: 'html-css', label: 'HTML & CSS', group: 'dev' },
    { id: 'infra', label: 'Infrastructure informatique', group: 'infra' },
    { id: 'serveurs', label: 'Serveurs', group: 'infra' },
    { id: 'reseau', label: 'Réseau', group: 'infra' },
    { id: 'windows', label: 'Windows', group: 'infra' },
    { id: 'linux', label: 'Linux', group: 'infra' },
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
