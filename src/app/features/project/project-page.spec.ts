import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PROFILE } from '@domain/profile/profile.data';

import { ProjectPage } from './project-page';

describe('ProjectPage', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));

  async function render(id: string): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(ProjectPage);
    fixture.componentRef.setInput('id', id);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('affiche le projet demandé, ses points et ses captures', async () => {
    const project = PROFILE.projects.find((p) => p.images?.length)!;
    const element = await render(project.id);
    expect(element.querySelector('h1')?.textContent).toContain(project.title);
    expect(element.querySelectorAll('.step').length).toBe(project.highlights.length);
    expect(element.querySelectorAll('.shot img').length).toBe(project.images!.length);
  });

  it('propose le projet suivant et pas de précédent pour le premier', async () => {
    const element = await render(PROFILE.projects[0].id);
    expect(element.querySelector('.prev')).toBeNull();
    expect(element.querySelector('.next')?.getAttribute('href')).toBe(`/projets/${PROFILE.projects[1].id}`);
  });

  it('dit quand le projet n’existe pas', async () => {
    const element = await render('inconnu');
    expect(element.querySelector('h1')?.textContent).toContain('introuvable');
  });
});
