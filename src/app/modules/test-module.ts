import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { LucideCheck, LucidePlay, LucideRotateCcw, LucideX } from '@lucide/angular';
import { Run, formatRun, showWord, symbolsOf } from '../automaton/automaton';
import { runWord } from '../automaton/logic';
import { verdict } from '../automaton/messages';
import { AutomatonStore, highlightOf } from '../automaton/store';
import { NeedsAutomaton } from './needs-automaton';

const STEP_MS = 550;

interface Result {
  word: string;
  run: Run;
  symbols: string[];
  accepted: boolean;
  verdict: string;
}

/** Módulo 3: reconocimiento de palabras. */
@Component({
  selector: 'app-test-module',
  imports: [LucideCheck, LucidePlay, LucideRotateCcw, LucideX, NeedsAutomaton],
  templateUrl: './test-module.html',
})
export class TestModule {
  protected readonly store = inject(AutomatonStore);

  protected readonly word = signal('');
  protected readonly result = signal<Result | null>(null);
  /** Cuántos símbolos de la palabra ya se recorrieron en la animación. */
  protected readonly step = signal(0);
  private timer: ReturnType<typeof setTimeout> | undefined;

  protected readonly playing = computed(() => {
    const r = this.result();
    return r !== null && r.run.invalidSymbol === undefined && this.step() < r.symbols.length;
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.timer);
      this.store.highlight.set(null);
    });
  }

  protected setWord(event: Event): void {
    this.word.set((event.target as HTMLInputElement).value);
  }

  protected test(event: Event): void {
    event.preventDefault();
    this.check(this.word());
  }

  protected retest(word: string): void {
    this.word.set(word);
    this.check(word);
  }

  protected replay(): void {
    const r = this.result();
    if (r) this.play(r);
  }

  protected formatRun(r: Result): string {
    return formatRun(r.word, r.run.states);
  }

  protected showWord = showWord;

  private check(word: string): void {
    const m = this.store.automaton();
    if (!m) return;
    // Sin trim: un espacio es un símbolo fuera de Σ y hay que reportar su posición.
    const run = runWord(m, word);
    const accepted =
      run.invalidSymbol === undefined && m.finals.has(run.states[run.states.length - 1]);
    const result = { word, run, symbols: symbolsOf(word), accepted, verdict: verdict(m, word, run) };
    this.result.set(result);
    this.store.tested.update((list) => [{ word, accepted }, ...list.filter((t) => t.word !== word)]);
    this.play(result);
  }

  private play(r: Result): void {
    clearTimeout(this.timer);
    if (r.run.invalidSymbol !== undefined) {
      this.step.set(0);
      this.store.highlight.set(null);
      return;
    }
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.show(r, reduced ? r.symbols.length : 0);
  }

  private show(r: Result, step: number): void {
    this.step.set(step);
    this.store.highlight.set(highlightOf(r.run.states, step));
    if (step < r.symbols.length) {
      this.timer = setTimeout(() => this.show(r, step + 1), STEP_MS);
    }
  }
}
