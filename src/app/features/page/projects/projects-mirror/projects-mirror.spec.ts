import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { OTHER_PROJECTS } from '../project-views';
import { ProjectsMirror } from './projects-mirror';

describe('ProjectsMirror', () => {
  it('recopie la liste des autres projets en rayons X, défilement compris', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ProjectsMirror);
    fixture.componentRef.setInput('scrollTop', 120);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.classList).toContain('xray');
    expect(element.hasAttribute('inert')).toBe(true);
    expect(element.querySelectorAll('.item').length).toBe(OTHER_PROJECTS.length);
    expect(element.querySelector<HTMLElement>('app-projects-list')?.style.transform).toBe('translateY(-120px)');
  });
});
