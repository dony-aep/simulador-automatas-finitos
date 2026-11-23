/**
 * Autómata finito determinista y completo M = (Q, Σ, δ, q0, F).
 *
 * states y alphabet son listas porque el orden en que el usuario los escribió
 * importa: el Módulo 2 usa el orden del alfabeto para el orden canónico, y la
 * tabla y la 5-tupla se muestran en ese orden.
 */
export interface Automaton {
  states: string[];
  alphabet: string[];
  /** delta[q][a] es el estado al que se pasa desde q leyendo a. */
  delta: Record<string, Record<string, string>>;
  initial: string;
  finals: Set<string>;
}

/**
 * Resultado de recorrer una palabra. Si la palabra tiene un símbolo fuera de Σ,
 * invalidSymbol y position (contada desde 1) dicen cuál y dónde, y states queda vacío.
 */
export interface Run {
  states: string[];
  invalidSymbol?: string;
  position?: number;
}

/** Separa en símbolos por punto de código, como hace Python al recorrer un str. */
export function symbolsOf(word: string): string[] {
  return Array.from(word);
}

export function formatSet(items: Iterable<string>): string {
  return '{' + Array.from(items).join(', ') + '}';
}

export function orderedFinals(m: Automaton): string[] {
  return m.states.filter((q) => m.finals.has(q));
}

export function formatTuple(m: Automaton): string {
  return (
    `M = (${formatSet(m.states)}, ${formatSet(m.alphabet)}, δ, ` +
    `${m.initial}, ${formatSet(orderedFinals(m))})`
  );
}

/** s0 –a→ s1 –b→ s2, la notación del requerimiento. */
export function formatRun(word: string, states: string[]): string {
  const parts = [states[0]];
  symbolsOf(word).forEach((symbol, i) => parts.push(`–${symbol}→ ${states[i + 1]}`));
  return parts.join(' ');
}

export function showWord(word: string): string {
  return word === '' ? 'ε' : word;
}
