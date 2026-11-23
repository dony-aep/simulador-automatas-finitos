import { Component, computed, inject } from '@angular/core';
import { AutomatonStore } from '../automaton/store';
import { Downloads } from './downloads';
import { GrammarView } from './grammar-view';
import { GraphView } from './graph-view';

/** La gráfica, la tabla de transiciones y la gramática del autómata en memoria. */
@Component({
  selector: 'app-automaton-panel',
  imports: [Downloads, GrammarView, GraphView],
  template: `
    @if (store.automaton(); as m) {
      <figure class="panel-figure">
        <app-graph-view [automaton]="m" [highlight]="store.highlight()" />
        <figcaption class="caption">
          La flecha sin origen entra al estado inicial; el doble círculo marca los estados finales.
        </figcaption>
      </figure>

      <app-downloads [automaton]="m" />

      <table class="delta-table">
        <caption class="caption">Tabla de transiciones. → estado inicial, * estado final.</caption>
        <thead>
          <tr>
            <th scope="col"><span class="visually-hidden">Marca</span></th>
            <th scope="col">δ</th>
            @for (a of m.alphabet; track a) {
              <th scope="col">{{ a }}</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (q of m.states; track q) {
            <tr [class.is-current]="current() === q">
              <td class="delta-mark">{{ q === m.initial ? '→' : '' }}{{ m.finals.has(q) ? '*' : '' }}</td>
              <th scope="row">{{ q }}</th>
              @for (a of m.alphabet; track a) {
                <td>{{ m.delta[q][a] }}</td>
              }
            </tr>
          }
        </tbody>
      </table>

      <app-grammar-view [automaton]="m" />
    } @else {
      <div class="panel-empty">
        <svg viewBox="0 0 120 48" aria-hidden="true">
          <line x1="2" y1="24" x2="26" y2="24" />
          <polyline points="20,19 26,24 20,29" />
          <circle cx="44" cy="24" r="16" />
          <line x1="60" y1="24" x2="78" y2="24" />
          <polyline points="72,19 78,24 72,29" />
          <circle cx="98" cy="24" r="16" />
          <circle cx="98" cy="24" r="12" />
        </svg>
        <p>Aquí aparecen la gráfica y la tabla de δ cuando construya un autómata o cargue uno de prueba.</p>
      </div>
    }
  `,
})
export class AutomatonPanel {
  protected readonly store = inject(AutomatonStore);
  protected readonly current = computed(() => this.store.highlight()?.current);
}
