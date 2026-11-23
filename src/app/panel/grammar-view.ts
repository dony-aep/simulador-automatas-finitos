import { Component, computed, input } from '@angular/core';
import { Automaton } from '../automaton/automaton';
import { toGrammar } from '../automaton/grammar';

@Component({
  selector: 'app-grammar-view',
  template: `
    <details class="panel-details">
      <summary>Gramática regular</summary>
      <ul class="grammar">
        @for (rule of rules(); track rule.head) {
          <li>
            <span class="grammar-head">{{ rule.head }}</span>
            <span>→ {{ rule.bodies.join(' | ') }}</span>
          </li>
        }
      </ul>
      <p class="caption">
        Símbolo inicial: {{ automaton().initial }}. Cada transición δ(q, a) = p da q → a p, y cada
        estado final da q → λ, donde λ es la palabra vacía ε.
      </p>
    </details>
  `,
})
export class GrammarView {
  readonly automaton = input.required<Automaton>();
  protected readonly rules = computed(() => toGrammar(this.automaton()));
}
