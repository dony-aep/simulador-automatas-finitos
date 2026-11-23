import { Service, signal } from '@angular/core';
import { Automaton } from './automaton';
import { AutomatonDraft } from './logic';

export type ModuleId = 'build' | 'words' | 'test';

/** Los cinco elementos de la 5-tupla, en el orden en que se piden. */
export type Part = 'Q' | 'Σ' | 'δ' | 'q0' | 'F';

/** Lo que la gráfica resalta de un recorrido: estados y flechas usados, el estado actual y la última flecha. */
export interface Highlight {
  visited: string[];
  path: [string, string][];
  current?: string;
  edge?: [string, string];
}

/** Lo que resalta la gráfica después de leer los primeros step símbolos de un recorrido. */
export function highlightOf(states: string[], step = states.length - 1): Highlight {
  const path = states.slice(1, step + 1).map((q, i): [string, string] => [states[i], q]);
  return {
    visited: states.slice(0, step + 1),
    path,
    current: states[step],
    edge: path[path.length - 1],
  };
}

export interface TestedWord {
  word: string;
  accepted: boolean;
}

export function emptyDraft(): AutomatonDraft {
  return { states: '', alphabet: '', delta: {}, initial: '', finals: '' };
}

export function draftOf(m: Automaton): AutomatonDraft {
  return {
    states: m.states.join(', '),
    alphabet: m.alphabet.join(', '),
    delta: structuredClone(m.delta),
    initial: m.initial,
    finals: m.states.filter((q) => m.finals.has(q)).join(', '),
  };
}

/** El autómata en memoria que comparten los tres módulos. */
@Service()
export class AutomatonStore {
  readonly automaton = signal<Automaton | null>(null);
  readonly draft = signal<AutomatonDraft>(emptyDraft());
  readonly module = signal<ModuleId>('build');
  /** El elemento que se está escribiendo en el Módulo 1, para resaltarlo en la 5-tupla. */
  readonly focus = signal<Part | null>(null);
  readonly highlight = signal<Highlight | null>(null);
  readonly tested = signal<TestedWord[]>([]);

  /** Construir otra vez reemplaza el autómata anterior y lo que se había probado con él. */
  replace(m: Automaton): void {
    this.automaton.set(m);
    this.highlight.set(null);
    this.tested.set([]);
  }

  clear(): void {
    this.automaton.set(null);
    this.draft.set(emptyDraft());
    this.highlight.set(null);
    this.tested.set([]);
  }
}
