import { CV_PROJECT_ORDER, CV_PROJECTS, cvContent } from './cv';
import { PROFILE } from './profile.data';

describe('cvContent', () => {
  const cv = cvContent(PROFILE, new Date(2026, 10, 5));

  it('reprend toutes les expériences et formations du site', () => {
    expect(cv.experiences.length).toBe(PROFILE.experiences.length);
    expect(cv.education.length).toBe(PROFILE.education.length);
    expect(cv.experiences[0].title).toContain(PROFILE.experiences[0].company);
  });

  it('limite les projets aux premiers de son propre ordre', () => {
    const titles = CV_PROJECT_ORDER.slice(0, CV_PROJECTS).map((id) => PROFILE.projects.find((p) => p.id === id)!.title);
    expect(cv.projects.map((p) => p.title)).toEqual(titles);
  });

  it('oriente le CV vers un poste', () => {
    const mobile = cvContent(PROFILE, new Date(2026, 10, 5), { focus: 'mobile' });
    expect(mobile.focus).toBe('Développeur mobile');
    expect(mobile.projects[0].title).toBe('Argus');
    expect(mobile.fileName).toBe('CV-Baptiste-Nodon-mobile.pdf');
  });

  it('nomme le fichier avec le nom complet', () => {
    expect(cv.fileName).toBe('CV-Baptiste-Nodon.pdf');
  });
});
