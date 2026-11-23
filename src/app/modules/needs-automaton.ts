import { Component, inject } from '@angular/core';
import { LucideArrowLeft } from '@lucide/angular';
import { AutomatonStore } from '../automaton/store';

/** El aviso cuando se entra al Módulo 2 o al 3 sin autómata. */
@Component({
  selector: 'app-needs-automaton',
  imports: [LucideArrowLeft],
  template: `
    <div class="needs-automaton">
      <p>Primero construya un autómata en el Módulo 1.</p>
      <button type="button" class="button-primary" (click)="store.module.set('build')">
        <svg lucideArrowLeft></svg>Ir a construir
      </button>
    </div>
  `,
})
export class NeedsAutomaton {
  protected readonly store = inject(AutomatonStore);
}
