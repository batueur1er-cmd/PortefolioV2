import { GeoPoint } from './geo';

export interface Place {
  readonly city: string;
  readonly region: string;
  readonly geo: GeoPoint;
}

export interface Experience {
  readonly id: string;
  readonly company: string;
  /** Nom court, utilisé dans les annotations du graphe de compétences. */
  readonly shortName: string;
  readonly role: string;
  readonly contract: string;
  /** « AAAA-MM ». */
  readonly start: string;
  /** « AAAA-MM », ou null si le poste est en cours. */
  readonly end: string | null;
  readonly place: Place;
  readonly summary: string;
  /** Identifiants de compétences (voir `skills`). */
  readonly skills: readonly string[];
  /** Coulisse révélée par la loupe. « {jours} » est remplacé par le nombre de jours depuis le début. */
  readonly secret: string;
  /** Nom du secret dans la liste des secrets trouvés. */
  readonly secretLabel: string;
}

export interface Project {
  readonly id: string;
  readonly title: string;
  readonly context: string;
  readonly year: string;
  readonly summary: string;
  readonly skills: readonly string[];
  readonly visual: 'crm' | 'infra' | 'site';
  readonly secret: string;
  readonly secretLabel: string;
}

export type SkillGroupId = 'dev' | 'infra' | 'pilotage';

export interface SkillGroup {
  readonly id: SkillGroupId;
  readonly label: string;
  readonly caption: string;
}

export interface Skill {
  readonly id: string;
  readonly label: string;
  readonly group: SkillGroupId;
}

/** Ce qui justifie une compétence : une expérience, un projet, une formation… */
export interface SkillSource {
  readonly id: string;
  readonly label: string;
  readonly skills: readonly string[];
}

export interface Education {
  readonly id: string;
  readonly school: string;
  readonly degree: string;
  readonly acronym?: string;
  readonly field?: string;
  /** « AAAA » ou « AAAA-MM ». */
  readonly start: string;
  readonly end: string;
}

export interface Certification {
  readonly id: string;
  readonly label: string;
  readonly description: string;
}

export interface Profile {
  readonly firstName: string;
  readonly lastName: string;
  readonly kicker: string;
  readonly location: string;
  readonly status: string;
  readonly lead: string;
  readonly about: {
    readonly title: string;
    readonly paragraphs: readonly string[];
    /** Le résumé tel qu'il figure sur LinkedIn, révélé barré par la loupe. */
    readonly linkedinSummary: string;
    readonly linkedinSummaryOutcome: string;
  };
  readonly contact: {
    readonly invitation: string;
    readonly email: string;
    readonly linkedin: string;
  };
  readonly experiences: readonly Experience[];
  readonly projects: readonly Project[];
  readonly skillGroups: readonly SkillGroup[];
  readonly skills: readonly Skill[];
  /** Sources de compétences hors expériences et projets. */
  readonly otherSkillSources: readonly SkillSource[];
  /** Les « principales compétences » telles qu'affichées sur LinkedIn. */
  readonly linkedinTopSkills: readonly string[];
  readonly education: readonly Education[];
  readonly certifications: readonly Certification[];
}
