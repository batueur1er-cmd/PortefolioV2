import { CV_PROJECTS, cvContent } from './cv';
import { PROFILE } from './profile.data';

describe('cvContent', () => {
  const cv = cvContent(PROFILE, new Date(2026, 10, 5));

  it('reprend toutes les expériences et formations du site', () => {
    expect(cv.experiences.length).toBe(PROFILE.experiences.length);
    expect(cv.education.length).toBe(PROFILE.education.length);
    expect(cv.experiences[0].title).toContain(PROFILE.experiences[0].company);
  });

  it('limite les projets aux premiers du site', () => {
    expect(cv.projects.map((p) => p.title)).toEqual(PROFILE.projects.slice(0, CV_PROJECTS).map((p) => p.title));
  });

  it('nomme le fichier avec le nom complet', () => {
    expect(cv.fileName).toBe('CV-Baptiste-Nodon.pdf');
  });
});
