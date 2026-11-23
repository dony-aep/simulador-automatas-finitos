import { Component, computed, inject } from '@angular/core';
import { formatRun, showWord } from '../automaton/automaton';
import { findAccepted } from '../automaton/logic';
import { MAX_LENGTH, WORDS_TO_SHOW, wordsNote } from '../automaton/messages';
import { AutomatonStore, highlightOf } from '../automaton/store';
import { NeedsAutomaton } from './needs-automaton';

/** Módulo 2: las cinco palabras reconocidas más cortas. */
@Component({
  selector: 'app-words-module',
  imports: [NeedsAutomaton],
  template: `
    <header class="module-head">
      <h2>Cinco palabras reconocidas</h2>
      <p class="lede">
        Las más cortas en orden canónico: primero por longitud y, a igual longitud, en el orden
        en que se escribió Σ. Se buscan hasta longitud {{ maxLength }}.
      </p>
    </header>

    @if (store.automaton()) {
      @if (words().length > 0) {
        <ol class="word-list">
          @for (w of words(); track w.word; let i = $index) {
            <li
              class="word-row"
              tabindex="0"
              (mouseenter)="trace(w.states)"
              (focus)="trace(w.states)"
              (mouseleave)="clear()"
              (blur)="clear()"
            >
              <span class="word-index" aria-hidden="true">{{ i + 1 }}.</span>
              <span class="word">{{ w.shown }}</span>
              <span class="run"><span class="visually-hidden">recorrido: </span>{{ w.run }}</span>
            </li>
          }
        </ol>
        <p class="hint">Pase el cursor por una palabra para ver su recorrido en la gráfica.</p>
      }
      @for (line of note(); track $index) {
        <p [class]="$first ? 'note-lead' : 'note'">{{ line }}</p>
      }
    } @else {
      <app-needs-automaton />
    }
  `,
})
export class WordsModule {
  protected readonly store = inject(AutomatonStore);
  protected readonly maxLength = MAX_LENGTH;

  protected readonly words = computed(() => {
    const m = this.store.automaton();
    if (!m) return [];
    return findAccepted(m, WORDS_TO_SHOW, MAX_LENGTH).map(([word, states]) => ({
      word,
      states,
      shown: showWord(word),
      run: formatRun(word, states),
    }));
  });

  protected readonly note = computed(() => {
    const m = this.store.automaton();
    return m ? wordsNote(m, this.words().length) : [];
  });

  protected trace(states: string[]): void {
    this.store.highlight.set(highlightOf(states));
  }

  protected clear(): void {
    this.store.highlight.set(null);
  }
}
