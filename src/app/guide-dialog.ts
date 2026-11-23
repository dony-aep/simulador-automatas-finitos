import { Component } from '@angular/core';
import { LucideBookOpen, LucideX } from '@lucide/angular';

interface Entry {
  symbol: string;
  reads?: string;
  meaning: string;
}

interface Section {
  title: string;
  entries: Entry[];
}

const SECTIONS: Section[] = [
  {
    title: 'El autómata',
    entries: [
      { symbol: 'M', reads: 'eme', meaning: 'El autómata completo, escrito como la 5-tupla (Q, Σ, δ, q0, F).' },
      { symbol: 'Q', reads: 'cu', meaning: 'El conjunto de estados.' },
      { symbol: 'Σ', reads: 'sigma', meaning: 'El alfabeto: los símbolos que el autómata puede leer. Las diapositivas lo llaman V.' },
      { symbol: 'δ', reads: 'delta', meaning: 'La función de transición: a qué estado se pasa desde cada estado con cada símbolo.' },
      { symbol: 'δ(s0, a) = s1', reads: 'delta de ese cero, a, es igual a ese uno', meaning: 'Desde s0, leyendo a, se pasa a s1.' },
      { symbol: 'q0', reads: 'cu cero', meaning: 'El estado inicial. También puede ser el nombre de un estado, como en A1.' },
      { symbol: 'F', reads: 'efe', meaning: 'El conjunto de estados finales o de aceptación.' },
      { symbol: 'ε', reads: 'épsilon', meaning: 'La palabra vacía, de longitud 0.' },
      { symbol: 'λ', reads: 'lambda', meaning: 'Lo mismo que ε, en la notación de las diapositivas.' },
    ],
  },
  {
    title: 'Tabla de transiciones',
    entries: [
      { symbol: '→', reads: 'flecha', meaning: 'Marca el estado inicial.' },
      { symbol: '*', reads: 'asterisco', meaning: 'Marca un estado final.' },
      { symbol: '→*', reads: 'flecha asterisco', meaning: 'Un estado inicial que también es final, como q0 en A1.' },
    ],
  },
  {
    title: 'Gráfica',
    entries: [
      { symbol: 'Círculo', meaning: 'Un estado, es decir, un vértice del grafo.' },
      { symbol: 'Doble círculo', meaning: 'Un estado final.' },
      { symbol: 'Flecha sin origen', meaning: 'Señala el estado inicial.' },
      { symbol: 'Flecha con símbolo', meaning: 'Una transición: una arista dirigida con el símbolo que la produce.' },
      { symbol: 'Bucle', meaning: 'El estado pasa a sí mismo con ese símbolo.' },
      { symbol: 'a, b', meaning: 'Varios símbolos van del mismo origen al mismo destino y comparten flecha.' },
      { symbol: '1, 3', meaning: 'Al seguir un recorrido, los pasos en que se usó esa flecha.' },
    ],
  },
  {
    title: 'Recorridos',
    entries: [
      { symbol: 's0 –a→ s1', reads: 'de ese cero, leyendo a, pasa a ese uno', meaning: 'Un paso del recorrido.' },
      { symbol: '(posición 3)', meaning: 'El símbolo inválido es el tercero de la palabra, contando desde 1.' },
    ],
  },
  {
    title: 'Conjuntos y lenguajes',
    entries: [
      { symbol: '{ }', reads: 'el conjunto', meaning: 'Un conjunto: no importa el orden ni se repiten elementos.' },
      { symbol: '|Q|', reads: 'cardinal de Q', meaning: 'Cuántos elementos tiene. En A2, |Q| × |Σ| = 3 × 2 = 6 casillas de δ.' },
      { symbol: '∈', reads: 'pertenece a', meaning: 's2 ∈ F: s2 es un estado final.' },
      { symbol: '∉', reads: 'no pertenece a', meaning: 'c ∉ Σ: por eso se rechaza abc.' },
      { symbol: 'Σ*', reads: 'sigma estrella', meaning: 'Todas las palabras posibles, incluida ε. También se llama clausura de Kleene.' },
      { symbol: 'L(M)', reads: 'el lenguaje de eme', meaning: 'El conjunto de palabras que M reconoce.' },
    ],
  },
  {
    title: 'Pozo y gramática',
    entries: [
      { symbol: 'Estado pozo', meaning: 'Un estado no final que vuelve a sí mismo con todos los símbolos. Completa δ sin cambiar el lenguaje.' },
      { symbol: 's0 → a s1', reads: 'ese cero produce a ese uno', meaning: 'Una regla de la gramática regular. Sale de δ(s0, a) = s1.' },
      { symbol: '|', reads: 'o', meaning: 'Separa varias producciones del mismo estado.' },
      { symbol: 's2 → λ', reads: 'ese dos produce lambda', meaning: 'La palabra puede terminar en s2, porque s2 es final.' },
    ],
  },
];

@Component({
  selector: 'app-guide-dialog',
  imports: [LucideBookOpen, LucideX],
  template: `
    <button
      type="button"
      class="guide-button"
      aria-haspopup="dialog"
      aria-label="Guía de símbolos"
      title="Guía de símbolos"
      (click)="guide.showModal()"
    >
      <svg lucideBookOpen></svg>
    </button>

    <dialog #guide class="guide" aria-labelledby="guide-title" (click)="closeOnBackdrop($event, guide)">
      <div class="guide-body">
        <div class="guide-head">
          <h2 id="guide-title">Guía de símbolos</h2>
          <button
            type="button"
            class="guide-close"
            aria-label="Cerrar la guía"
            title="Cerrar"
            (click)="guide.close()"
          >
            <svg lucideX></svg>
          </button>
        </div>
        @for (section of sections; track section.title) {
          <section>
            <h3>{{ section.title }}</h3>
            <dl class="guide-list">
              @for (entry of section.entries; track entry.symbol) {
                <div>
                  <dt>{{ entry.symbol }}</dt>
                  <dd>
                    @if (entry.reads) {
                      <span class="guide-reads">Se lee «{{ entry.reads }}».</span>
                    }
                    {{ entry.meaning }}
                  </dd>
                </div>
              }
            </dl>
          </section>
        }
      </div>
    </dialog>
  `,
})
export class GuideDialog {
  protected readonly sections = SECTIONS;

  /** Un clic en el fondo llega al propio dialog; el contenido va dentro de .guide-body. */
  protected closeOnBackdrop(event: MouseEvent, guide: HTMLDialogElement): void {
    if (event.target === guide) guide.close();
  }
}
