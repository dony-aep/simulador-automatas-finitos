import { Automaton } from './automaton';

export interface Production {
  head: string;
  bodies: string[];
}

/** Diapositiva 17: δ(q, a) = p da q → a p, y cada estado final da q → λ. */
export function toGrammar(m: Automaton): Production[] {
  return m.states.map((q) => ({
    head: q,
    bodies: [...m.alphabet.map((a) => `${a} ${m.delta[q][a]}`), ...(m.finals.has(q) ? ['λ'] : [])],
  }));
}
