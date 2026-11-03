import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Une liste d'étiquettes (technologies, compétences). */
@Component({
  selector: 'app-tag-list',
  template: `
    <ul [attr.aria-label]="label()">
      @for (tag of tags(); track tag) {
        <li>{{ tag }}</li>
      }
    </ul>
  `,
  styles: `
    ul {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    li {
      padding: 5px 10px;
      border-radius: var(--radius-pill);
      background: var(--paper-2);
      font: 500 10.5px/1.3 var(--mono);
      letter-spacing: 0.04em;
      color: var(--ink);
    }
    :host-context(.xray) li {
      background: transparent;
      box-shadow: inset 0 0 0 1px var(--line);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagList {
  readonly tags = input.required<readonly string[]>();
  readonly label = input('Technologies');
}
