# Simulador de autómatas finitos

Aplicación web para construir autómatas finitos deterministas y completos, ver su gráfica, conocer las cinco palabras más cortas que reconocen y probar cualquier palabra. Es el proyecto final de Estructuras Discretas y un port de nuestro simulador de consola en Python: conserva su lógica y sus mensajes, y lleva el autómata a una interfaz donde se ve y se recorre en pantalla.

El código está en <https://github.com/dony-aep/simulador-automatas-finitos>.

## Integrantes

- Doney Peña (grupo 6A)
- Sebastian Barreto (grupo 6A)

## Qué mejora el port

- **Todo en una pantalla.** La 5-tupla, el formulario, la gráfica y la tabla de δ están a la vista, y la 5-tupla se llena mientras se escribe.
- **Un formulario en vez de una serie de preguntas.** δ es una tabla con una casilla por estado y símbolo. Los errores salen debajo de cada campo, todos a la vez.
- **La gráfica dentro de la página.** Graphviz corre en el navegador, así que no hay nada extra que instalar. La imagen se descarga en PNG o SVG.
- **El recorrido animado.** La gráfica avanza símbolo por símbolo y numera los pasos sobre cada flecha.
- **Autómatas que se conservan.** Los construidos quedan guardados en el navegador y se pueden exportar a un archivo JSON.
- **Apoyo para la clase.** Trae un botón para completar δ con un estado pozo, la gramática regular de cada autómata, una guía de símbolos y once ejemplos.
- **Tema y pantallas.** Tiene tema claro y oscuro, se adapta a pantallas de 375 px y las pestañas se manejan con las flechas del teclado.

## Lenguaje y herramientas

TypeScript 6 con Angular 22.3. La gráfica usa Graphviz 16.1 compilado a WebAssembly (`@viz-js/viz` 3.31). Los iconos son de Lucide (`@lucide/angular` 1.78) y las pruebas usan Vitest 5.

## Instalación

1. Instale Node.js 24 desde <https://nodejs.org/>. Trae npm.
2. Desde la carpeta del proyecto, instale las dependencias:

   ```
   npm install
   ```

## Ejecución

```
npm start
```

Abra <http://localhost:4200> en el navegador.

Para correr las pruebas una sola vez:

```
npx ng test --watch=false
```

Para generar la versión que se publica:

```
npm run build
```

El resultado queda en `dist/simulator-web/browser`. Son archivos estáticos, sin servidor propio: se pueden subir a Vercel, Netlify o GitHub Pages, o abrir con cualquier servidor de archivos. La página carga Google Sans y Google Sans Code desde Google Fonts. Sin internet usa la fuente del sistema y todo lo demás funciona igual.

## Cómo se usa

Arriba de todo está la 5-tupla M = (Q, Σ, δ, q0, F). En el Módulo 1 se va llenando mientras se escribe, y el elemento que se está editando aparece subrayado.

Las tres pestañas son los tres módulos del requerimiento:

- **Construir.** Se escriben Q y Σ separados por comas. Cuando los dos son válidos aparece la tabla de δ. Después van q0 y F. Al pulsar «Construir el autómata» se revisan los cinco elementos y cada error sale debajo de su campo. Si faltan transiciones, «Completar con pozo» manda las casillas vacías a un estado no final que vuelve a sí mismo, sin cambiar el lenguaje. Cada autómata construido entra a la lista «Guardados en este navegador», desde la que se carga o se quita. «Cargar desde archivo» abre un JSON descargado antes, y «Limpiar campos» vacía el formulario y saca de memoria el autómata actual, sin tocar la lista. Los botones de abajo cargan los ejemplos: A1 a A4 de la tabla 1 del requerimiento, tres de las diapositivas de la semana 15 y cuatro propios.
- **Cinco palabras.** Lista las cinco palabras reconocidas más cortas en orden canónico, con su recorrido. Al pasar el cursor por una palabra, la gráfica resalta su camino y numera sus pasos. Si hay menos de cinco, o ninguna, dice por qué.
- **Probar una palabra.** Recorre la palabra símbolo por símbolo. La gráfica y la fila de estados muestran en qué estado va, y al terminar aparece el veredicto. El campo vacío prueba ε, y un espacio cuenta como un símbolo fuera de Σ. Las palabras ya probadas quedan en una lista, y al pulsar una se vuelve a probar.

Si se entra a los módulos 2 o 3 sin haber construido un autómata, la página lo avisa. Construir otra vez reemplaza el autómata anterior. El título de la página lleva de vuelta a «Construir».

Debajo de la gráfica se descarga la imagen en PNG o SVG, su descripción en DOT y el autómata en JSON. Ese JSON pasa por las mismas validaciones del Módulo 1 al abrirlo. La sección «Gramática regular» muestra la gramática que sale de δ: cada transición δ(q, a) = p da q → a p, y cada estado final da q → λ.

En la esquina superior derecha, el icono del libro abre la guía de símbolos, con cómo se lee cada uno y qué significa. Los otros tres botones eligen el tema: el del sistema operativo, claro u oscuro. El navegador recuerda la elección para la próxima visita.

## Mejoras opcionales

De las mejoras que propone el requerimiento, esta versión implementa dos: resaltar el recorrido sobre la gráfica (figura 3), con animación y números de paso, y guardar el autómata en un archivo para volver a cargarlo. No admite autómatas no deterministas.

## Ejemplo de uso

Con el autómata A2, que reconoce las palabras sobre {a, b} que terminan en ab, la pestaña «Cinco palabras» muestra:

```
1. ab      s0 –a→ s1 –b→ s2
2. aab     s0 –a→ s1 –a→ s1 –b→ s2
3. bab     s0 –b→ s0 –a→ s1 –b→ s2
4. aaab    s0 –a→ s1 –a→ s1 –a→ s1 –b→ s2
5. abab    s0 –a→ s1 –b→ s2 –a→ s1 –b→ s2
```

Y en «Probar una palabra», con abc:

```
La palabra «abc» NO es reconocida: el símbolo «c» (posición 3) no pertenece al alfabeto Σ = {a, b}.
```

## Estructura

Los archivos están en `src/app`.

| Archivo | Contenido |
|---|---|
| `automaton/automaton.ts` | Cómo se guarda el autómata y el formato de la 5-tupla y de los recorridos |
| `automaton/logic.ts` | Validación de los cinco elementos, recorrido de una palabra y búsqueda de palabras reconocidas |
| `automaton/graph.ts` | Traduce el autómata al lenguaje DOT de Graphviz |
| `automaton/examples.ts` | Los autómatas del requerimiento, de las diapositivas y los propios |
| `automaton/messages.ts` | Los mensajes del Módulo 2 cuando hay menos de cinco palabras y el veredicto del Módulo 3 |
| `automaton/store.ts` | El autómata en memoria que comparten los tres módulos |
| `automaton/saved.ts` | La lista de autómatas guardados en el `localStorage` del navegador |
| `automaton/file.ts` | Escribe y lee el autómata en un archivo JSON |
| `automaton/sink.ts` | Completa δ con un estado pozo |
| `automaton/grammar.ts` | La gramática regular que sale de δ |
| `modules/` | Las pantallas de los tres módulos |
| `panel/` | La gráfica con sus descargas, la tabla de δ y la gramática |
| `guide-dialog.ts` | La guía de símbolos |
| `automaton/logic.spec.ts` | Las tablas 1 y 2 del requerimiento y la sesión de la sección 4.3 |
| `automaton/interface.spec.ts` | La 5-tupla, los recorridos, las cinco reglas de la gráfica y los mensajes |
| `automaton/saved.spec.ts` | La lista de autómatas guardados |
| `automaton/additions.spec.ts` | El archivo JSON, el pozo, la gramática y los ejemplos |

## Fuentes

- Diapositivas «Autómatas Finitos» de la semana 15 de la asignatura: estado pozo, paso de autómata a gramática regular y los ejemplos D8, D9 y D20.
- Documentación del lenguaje DOT: <https://graphviz.org/doc/info/lang.html>
- Formas de nodo de Graphviz (`circle`, `doublecircle`, `point`): <https://graphviz.org/doc/info/shapes.html>
- Viz.js, Graphviz para el navegador: <https://viz-js.com/api/>
- Patrón de pestañas accesibles: <https://www.w3.org/WAI/ARIA/apg/patterns/tabs/>
- Iconos de Lucide: <https://lucide.dev/>

## Uso de LLMs

Claude (Anthropic) hizo la implementación web: pasó a TypeScript y Angular el simulador de consola en Python, con su lógica, y escribió la interfaz, las funciones nuevas, las pruebas en Vitest y este README.
