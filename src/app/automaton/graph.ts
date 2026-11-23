import { Automaton } from './automaton';

function quote(text: string): string {
  return '"' + text.replaceAll('\\', '\\\\').replaceAll('"', '\\"') + '"';
}

/** Nombre del nodo DOT de cada estado: n0, n1... en el orden de Q. */
export function nodeIds(m: Automaton): Map<string, string> {
  return new Map(m.states.map((q, i) => [q, `n${i}`]));
}

/** Traduce el autómata al lenguaje DOT de Graphviz. */
export function toDot(m: Automaton): string {
  const lines = [
    'digraph M {',
    '  rankdir=LR;',
    '  dpi=150;',
    '  node [shape=circle, fontname="Helvetica"];',
    '  edge [fontname="Helvetica"];',
    // Nodo invisible del que sale la flecha de entrada al estado inicial.
    '  start [shape=point, style=invis];',
  ];
  // El nombre del estado va en la etiqueta, para que ningún nombre que escriba
  // el usuario choque con el nodo start.
  const ids = nodeIds(m);
  for (const q of m.states) {
    const shape = m.finals.has(q) ? 'doublecircle' : 'circle';
    lines.push(`  ${ids.get(q)} [label=${quote(q)}, shape=${shape}];`);
  }
  lines.push(`  start -> ${ids.get(m.initial)};`);

  // Una sola flecha por par (origen, destino), con los símbolos en el orden de Σ.
  const labels = new Map<string, string[]>();
  for (const q of m.states) {
    for (const a of m.alphabet) {
      const key = `${ids.get(q)} -> ${ids.get(m.delta[q][a])}`;
      labels.set(key, [...(labels.get(key) ?? []), a]);
    }
  }
  for (const [key, symbols] of labels) {
    lines.push(`  ${key} [label=${quote(symbols.join(', '))}];`);
  }

  lines.push('}');
  return lines.join('\n');
}
