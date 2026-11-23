import { Automaton, Run, formatSet, showWord } from './automaton';
import { reachableStates } from './logic';

/** Valores fijos del requerimiento (sección 5): cuántas palabras mostrar y hasta qué longitud buscar. */
export const WORDS_TO_SHOW = 5;
export const MAX_LENGTH = 10;

/** Lo que el Módulo 2 dice debajo de la lista cuando encontró menos de cinco palabras. */
export function wordsNote(m: Automaton, found: number): string[] {
  if (found === 0) {
    const lines = [
      `Este autómata no reconoce ninguna palabra de longitud menor o igual que ${MAX_LENGTH}.`,
    ];
    const reachable = reachableStates(m);
    const unreachable = m.states.filter((q) => m.finals.has(q) && !reachable.has(q));
    if (m.finals.size === 0) {
      lines.push('Motivo: el conjunto de estados finales F está vacío.');
    } else if (unreachable.length === m.finals.size) {
      lines.push(
        `Motivo: ningún estado final ${formatSet(unreachable)} es alcanzable desde ${m.initial}.`,
      );
    } else {
      lines.push(
        `Motivo: los estados finales alcanzables necesitan palabras de más de ${MAX_LENGTH} símbolos.`,
      );
    }
    return lines;
  }
  if (found < WORDS_TO_SHOW) {
    const noun = found === 1 ? 'palabra' : 'palabras';
    return [
      `Este autómata solo reconoce ${found} ${noun} de longitud menor o igual que ${MAX_LENGTH}.`,
    ];
  }
  return [];
}

/** El veredicto del Módulo 3 para una palabra ya recorrida. */
export function verdict(m: Automaton, word: string, run: Run): string {
  if (run.invalidSymbol !== undefined) {
    return (
      `La palabra «${word}» NO es reconocida: el símbolo «${run.invalidSymbol}» ` +
      `(posición ${run.position}) no pertenece al alfabeto Σ = ${formatSet(m.alphabet)}.`
    );
  }
  const accepted = m.finals.has(run.states[run.states.length - 1]);
  return `La palabra «${showWord(word)}» ${accepted ? 'SÍ' : 'NO'} es reconocida por el autómata.`;
}
