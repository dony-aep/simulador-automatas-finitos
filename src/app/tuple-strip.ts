import { Component, computed, inject } from '@angular/core';
import { formatSet, orderedFinals } from './automaton/automaton';
import { checkState, parseAlphabet, parseFinals, parseStates } from './automaton/logic';
import { AutomatonStore, Part } from './automaton/store';

interface Slot {
  part: Part;
  text: string;
  filled: boolean;
}

/**
 * La 5-tupla del autómata. En el Módulo 1 se llena mientras se escribe, con el símbolo
 * de cada elemento como marcador hasta que su valor sea válido.
 */
@Component({
  selector: 'app-tuple-strip',
  template: `
    <p class="tuple">
      <span class="visually-hidden">{{ spoken() }}</span>
      <span aria-hidden="true">
        <span class="tuple-open">M = (</span>
        @for (slot of slots(); track slot.part; let last = $last) {
          <span class="tuple-item"
            ><span
              class="tuple-slot"
              [class.is-placeholder]="!slot.filled"
              [class.is-active]="store.focus() === slot.part"
              >{{ slot.text }}</span
            >{{ last ? ')' : ',' }}</span
          >
        }
      </span>
    </p>
  `,
})
export class TupleStrip {
  protected readonly store = inject(AutomatonStore);

  protected readonly slots = computed<Slot[]>(() => {
    const m = this.store.automaton();
    if (this.store.module() !== 'build' && m) {
      return [
        { part: 'Q', text: formatSet(m.states), filled: true },
        { part: 'Σ', text: formatSet(m.alphabet), filled: true },
        { part: 'δ', text: 'δ', filled: true },
        { part: 'q0', text: m.initial, filled: true },
        { part: 'F', text: formatSet(orderedFinals(m)), filled: true },
      ];
    }

    const draft = this.store.draft();
    const states = parseStates(draft.states);
    const alphabet = parseAlphabet(draft.alphabet);
    const statesOk = !states.error;
    const initialOk = statesOk && !checkState(draft.initial, states.items);
    const finals = statesOk && draft.finals.trim() ? parseFinals(draft.finals, states.items) : null;
    const finalsOk = finals !== null && !finals.error;
    return [
      { part: 'Q', text: statesOk ? formatSet(states.items) : 'Q', filled: statesOk },
      { part: 'Σ', text: alphabet.error ? 'Σ' : formatSet(alphabet.items), filled: !alphabet.error },
      { part: 'δ', text: 'δ', filled: statesOk && !alphabet.error },
      { part: 'q0', text: initialOk ? draft.initial.trim() : 'q0', filled: initialOk },
      {
        part: 'F',
        text: finalsOk ? formatSet(states.items.filter((q) => finals.items.includes(q))) : 'F',
        filled: finalsOk,
      },
    ];
  });

  protected readonly spoken = computed(
    () => 'M = (' + this.slots().map((s) => s.text).join(', ') + ')',
  );
}
