import { Component, ElementRef, computed, effect, input, signal, viewChild } from '@angular/core';
import { LucideCircleAlert } from '@lucide/angular';
import { Automaton } from '../automaton/automaton';
import { nodeIds, toDot } from '../automaton/graph';
import { Highlight } from '../automaton/store';
import { getViz } from './viz';

const SVG_NS = 'http://www.w3.org/2000/svg';
const MAX_SHOWN_STEPS = 4;

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

const overlaps = (a: Box, b: Box): boolean =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

/** Lo que una marca no debe tapar: estados, puntas de flecha, etiquetas y el trazo de las flechas. */
function obstaclesIn(svg: SVGSVGElement): Box[] {
  const boxes: Box[] = Array.from(
    svg.querySelectorAll<SVGGraphicsElement>('.node ellipse, .edge polygon, .edge text'),
  ).map((element) => element.getBBox());
  for (const path of Array.from(svg.querySelectorAll<SVGPathElement>('.edge path'))) {
    const length = path.getTotalLength();
    for (let at = 0; at <= length; at += 4) {
      const { x, y } = path.getPointAtLength(at);
      boxes.push({ x, y, width: 1, height: 1 });
    }
  }
  return boxes;
}

/** Agrega junto a la etiqueta de la flecha los pasos del recorrido que la usaron. */
function addStepBadge(edge: SVGGElement, steps: number[], limit: Box, obstacles: Box[]): void {
  const label = edge.querySelector('text');
  if (!label) return;
  const shown =
    steps.length > MAX_SHOWN_STEPS
      ? `${steps.slice(0, MAX_SHOWN_STEPS - 1).join(', ')}…`
      : steps.join(', ');

  const badge = document.createElementNS(SVG_NS, 'g');
  badge.classList.add('step-badge');
  const box = document.createElementNS(SVG_NS, 'rect');
  const text = document.createElementNS(SVG_NS, 'text');
  text.textContent = shown;
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('font-size', '10');
  badge.append(box, text);
  edge.append(badge);

  const labelBox = label.getBBox();
  const width = text.getBBox().width + 8;
  const height = 14;
  const centeredX = labelBox.x + (labelBox.width - width) / 2;
  const centeredY = labelBox.y + (labelBox.height - height) / 2;
  const spots: Box[] = [
    { x: labelBox.x + labelBox.width + 3, y: centeredY, width, height },
    { x: labelBox.x - width - 3, y: centeredY, width, height },
    { x: centeredX, y: labelBox.y - height - 1, width, height },
    { x: centeredX, y: labelBox.y + labelBox.height + 1, width, height },
  ];
  const inside = spots.filter(
    (s) =>
      s.x >= limit.x &&
      s.y >= limit.y &&
      s.x + s.width <= limit.x + limit.width &&
      s.y + s.height <= limit.y + limit.height,
  );
  const clashes = (spot: Box) => obstacles.filter((o) => overlaps(spot, o)).length;
  const spot = [...(inside.length > 0 ? inside : spots)].sort((a, b) => clashes(a) - clashes(b))[0];
  obstacles.push(spot);
  const { x, y } = spot;
  box.setAttribute('x', String(x));
  box.setAttribute('y', String(y));
  box.setAttribute('width', String(width));
  box.setAttribute('height', String(height));
  box.setAttribute('rx', '3');
  text.setAttribute('x', String(x + width / 2));
  text.setAttribute('y', String(y + 10.5));
}

@Component({
  selector: 'app-graph-view',
  imports: [LucideCircleAlert],
  template: `
    <div #canvas class="graph-canvas" role="img" [attr.aria-label]="label()"></div>
    @if (error()) {
      <p class="field-error"><svg lucideCircleAlert></svg>{{ error() }}</p>
    }
  `,
})
export class GraphView {
  readonly automaton = input.required<Automaton>();
  readonly highlight = input<Highlight | null>(null);

  private readonly canvas = viewChild.required<ElementRef<HTMLElement>>('canvas');
  private readonly svg = signal<SVGSVGElement | null>(null);
  protected readonly error = signal('');

  protected readonly label = computed(() => {
    const m = this.automaton();
    return `Gráfica del autómata: ${m.states.length} estados, inicial ${m.initial}.`;
  });

  constructor() {
    effect(async () => {
      const m = this.automaton();
      const host = this.canvas().nativeElement;
      try {
        const element = (await getViz()).renderSVGElement(toDot(m));
        // El tamaño lo pone el CSS; Graphviz lo fija en puntos a 150 dpi.
        element.removeAttribute('width');
        element.removeAttribute('height');
        host.replaceChildren(element);
        this.svg.set(element);
        this.error.set('');
      } catch (e) {
        host.replaceChildren();
        this.svg.set(null);
        this.error.set(`Graphviz no pudo dibujar la gráfica (${e}). El autómata sí quedó construido.`);
      }
    });

    effect(() => {
      const svg = this.svg();
      if (!svg) return;
      const ids = nodeIds(this.automaton());
      const h = this.highlight();
      const visited = new Set((h?.visited ?? []).map((q) => ids.get(q)));
      // Graphviz pone como <title> de cada flecha «origen->destino» con los nombres de nodo.
      const edgeTitle = ([from, to]: [string, string]) => `${ids.get(from)}->${ids.get(to)}`;
      const stepsByEdge = new Map<string, number[]>();
      (h?.path ?? []).forEach((pair, i) => {
        const title = edgeTitle(pair);
        stepsByEdge.set(title, [...(stepsByEdge.get(title) ?? []), i + 1]);
      });
      const current = h?.current ? ids.get(h.current) : undefined;
      const edge = h?.edge ? edgeTitle(h.edge) : undefined;

      svg.querySelectorAll('.step-badge').forEach((badge) => badge.remove());
      const limit = svg.querySelector<SVGGElement>('g.graph')!.getBBox();
      const obstacles = stepsByEdge.size > 0 ? obstaclesIn(svg) : [];
      svg.classList.toggle('is-tracing', h !== null);
      for (const group of Array.from(svg.querySelectorAll<SVGGElement>('g.node, g.edge'))) {
        const title = group.querySelector('title')?.textContent ?? '';
        const steps = stepsByEdge.get(title);
        group.classList.toggle('is-current', title === current || title === edge);
        group.classList.toggle('is-visited', visited.has(title) || steps !== undefined);
        if (steps) addStepBadge(group, steps, limit, obstacles);
      }
    });
  }
}
