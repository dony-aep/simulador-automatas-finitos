type VizInstance = Awaited<ReturnType<typeof import('@viz-js/viz').instance>>;

let viz: Promise<VizInstance> | undefined;

/** Graphviz pesa más de 1 MB; se carga solo la primera vez que hay que dibujar. */
export function getViz(): Promise<VizInstance> {
  return (viz ??= import('@viz-js/viz').then((module) => module.instance()));
}
