import { Service, signal } from '@angular/core';
import { AutomatonDraft, readAutomaton } from './logic';

export interface SavedAutomaton {
  savedAt: number;
  draft: AutomatonDraft;
}

const KEY = 'simulator-automata';

/** Pone el autómata de primero; si ya estaba guardado, lo mueve en vez de repetirlo. */
export function remember(
  list: SavedAutomaton[],
  draft: AutomatonDraft,
  savedAt: number,
): SavedAutomaton[] {
  const same = JSON.stringify(draft);
  return [{ savedAt, draft }, ...list.filter((s) => JSON.stringify(s.draft) !== same)];
}

function readSaved(): SavedAutomaton[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    if (!Array.isArray(saved)) return [];
    // localStorage se puede editar a mano: solo se aceptan entradas que sigan siendo autómatas.
    return saved.filter((s: SavedAutomaton) => s?.draft && readAutomaton(s.draft).automaton);
  } catch {
    return [];
  }
}

/** Los autómatas construidos, guardados en el navegador. */
@Service()
export class SavedStore {
  readonly list = signal<SavedAutomaton[]>(readSaved());

  constructor() {
    // Sin esto, una segunda pestaña abierta borraría al guardar lo que agregó la primera.
    window.addEventListener('storage', (event) => {
      if (event.key === KEY) this.list.set(readSaved());
    });
  }

  save(draft: AutomatonDraft): void {
    this.commit(remember(this.list(), draft, Date.now()));
  }

  remove(savedAt: number): void {
    this.commit(this.list().filter((s) => s.savedAt !== savedAt));
  }

  private commit(list: SavedAutomaton[]): void {
    this.list.set(list);
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch {
      // Sin almacenamiento (ventana privada) la lista dura solo esta visita.
    }
  }
}
