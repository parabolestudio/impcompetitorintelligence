import { html } from "./preact-htm.js";
import { colorMapping } from "./helpers.js";

export default function Diamond({ number, position = { x: 50, y: 50 } }) {
  console.log("Rendering Diamond with props:", { number, position });
  const scaleSize = d3.scaleLinear().domain([3, 15]).range([17, 38]);
  const size = scaleSize(number);

  return html`<g class="diamond" transform="translate(${position.x}, ${position.y})">
    <rect 
        width="${size}"
        height="${size}"
        x="${-size / 2}"
        y="${-size / 2}"
        transform="rotate(45)"
        class="diamond-rect"
        fill="${colorMapping[number] ? `var(--color-vis-${colorMapping[number]})` : "grey"}"
    />
    <text x="0" y="0" text-anchor="middle" dominant-baseline="central" class="diamond-text">
      ${number}
    </text
    />
  </g>`;
}
