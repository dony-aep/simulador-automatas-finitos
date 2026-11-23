import { Service, effect, signal } from '@angular/core';

export type ThemeMode = 'system' | 'light' | 'dark';

const KEY = 'simulator-theme';

function readSaved(): ThemeMode {
  try {
    const saved = localStorage.getItem(KEY);
    return saved === 'light' || saved === 'dark' ? saved : 'system';
  } catch {
    return 'system';
  }
}

/**
 * El tema elegido. «system» quita data-theme y deja que mande prefers-color-scheme.
 * El script de index.html aplica el tema guardado antes de que arranque Angular.
 */
@Service()
export class ThemeStore {
  readonly mode = signal<ThemeMode>(readSaved());

  constructor() {
    effect(() => {
      const mode = this.mode();
      const root = document.documentElement;
      if (mode === 'system') {
        delete root.dataset['theme'];
      } else {
        root.dataset['theme'] = mode;
      }
      try {
        if (mode === 'system') localStorage.removeItem(KEY);
        else localStorage.setItem(KEY, mode);
      } catch {
        // Sin almacenamiento (ventana privada) el tema dura solo esta visita.
      }
    });
  }
}
