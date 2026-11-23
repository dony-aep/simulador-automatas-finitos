import { AutomatonDraft, parseAlphabet, parseFinals, parseStates } from './logic';

export interface Completed {
  draft: AutomatonDraft;
  sink: string;
  filled: number;
}

const isBlank = (draft: AutomatonDraft, q: string, a: string): boolean =>
  !(draft.delta[q]?.[a] ?? '').trim();

/** Reutiliza un estado llamado pozo solo si ya se comporta como pozo. */
function sinkName(draft: AutomatonDraft, states: string[], alphabet: string[]): string {
  const finals = parseFinals(draft.finals, states).items;
  for (let i = 1; ; i++) {
    const name = i === 1 ? 'pozo' : `pozo${i}`;
    if (!states.includes(name)) return name;
    const onlyLoops = alphabet.every(
      (a) => isBlank(draft, name, a) || draft.delta[name][a].trim() === name,
    );
    if (onlyLoops && !finals.includes(name)) return name;
  }
}

/**
 * Manda cada casilla vacía de δ a un estado no final que vuelve a sí mismo.
 * El lenguaje no cambia: desde el pozo no se llega a F, y en el dibujo original
 * una palabra sin transición también se rechaza.
 */
export function completeWithSink(draft: AutomatonDraft): Completed {
  const states = parseStates(draft.states).items;
  const alphabet = parseAlphabet(draft.alphabet).items;
  const sink = sinkName(draft, states, alphabet);
  const filled = states.flatMap((q) => alphabet.filter((a) => isBlank(draft, q, a))).length;
  const withSink = states.includes(sink) ? states : [...states, sink];
  const delta = Object.fromEntries(
    withSink.map((q) => [
      q,
      Object.fromEntries(
        alphabet.map((a) => [a, isBlank(draft, q, a) ? sink : draft.delta[q][a]]),
      ),
    ]),
  );
  return { draft: { ...draft, states: withSink.join(', '), delta }, sink, filled };
}
