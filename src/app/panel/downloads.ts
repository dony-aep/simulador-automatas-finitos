import { Component, input, signal } from '@angular/core';
import { LucideCircleAlert, LucideDownload } from '@lucide/angular';
import { Automaton } from '../automaton/automaton';
import { toFile } from '../automaton/file';
import { toDot } from '../automaton/graph';
import { getViz } from './viz';

type Format = 'png' | 'svg' | 'dot' | 'json';

async function renderSvg(m: Automaton): Promise<string> {
  return (await getViz()).renderString(toDot(m), { format: 'svg' });
}

async function renderPng(m: Automaton): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([await renderSvg(m)], { type: 'image/svg+xml' }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);
    return await new Promise((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('imagen vacía'))), 'image/png'),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function contentOf(m: Automaton, format: Format): Promise<Blob> {
  switch (format) {
    case 'png':
      return renderPng(m);
    case 'svg':
      return new Blob([await renderSvg(m)], { type: 'image/svg+xml' });
    case 'dot':
      return new Blob([toDot(m)], { type: 'text/vnd.graphviz' });
    case 'json':
      return new Blob([toFile(m)], { type: 'application/json' });
  }
}

/** Descarga la gráfica o el archivo del autómata en memoria. */
@Component({
  selector: 'app-downloads',
  imports: [LucideCircleAlert, LucideDownload],
  template: `
    <div class="downloads">
      <svg lucideDownload></svg>
      <div class="download-group" role="group" aria-label="Descargar la gráfica">
        <span aria-hidden="true">Gráfica</span>
        @for (format of graphFormats; track format.id) {
          <button
            type="button"
            class="button-text"
            [attr.aria-label]="'Descargar la gráfica en ' + format.label"
            (click)="download(format.id)"
          >
            {{ format.label }}
          </button>
        }
      </div>
      <div class="download-group" role="group" aria-label="Descargar el autómata">
        <span aria-hidden="true">Autómata</span>
        <button
          type="button"
          class="button-text"
          aria-label="Descargar el autómata en JSON"
          (click)="download('json')"
        >
          JSON
        </button>
      </div>
    </div>
    @if (error()) {
      <p class="field-error" role="alert"><svg lucideCircleAlert></svg>{{ error() }}</p>
    }
  `,
})
export class Downloads {
  readonly automaton = input.required<Automaton>();

  protected readonly error = signal('');
  protected readonly graphFormats: { id: Format; label: string }[] = [
    { id: 'png', label: 'PNG' },
    { id: 'svg', label: 'SVG' },
    { id: 'dot', label: 'DOT' },
  ];

  protected async download(format: Format): Promise<void> {
    try {
      const url = URL.createObjectURL(await contentOf(this.automaton(), format));
      const link = document.createElement('a');
      link.href = url;
      link.download = `automata.${format}`;
      link.click();
      URL.revokeObjectURL(url);
      this.error.set('');
    } catch (e) {
      this.error.set(`No se pudo generar el archivo ${format.toUpperCase()} (${e}).`);
    }
  }
}
