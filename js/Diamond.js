import { html } from "./preact-htm.js";
import { colorMapping, numberMovesScale } from "./helpers.js";

export default function Diamond({ number }) {
  console.log("Rendering Diamond with props:", { number });
  const size = numberMovesScale(number);

  return html`<g class="diamond">
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
