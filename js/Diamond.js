import { html } from "./preact-htm.js";
import { colorMapping, numberMovesScale } from "./helpers.js";

export default function Diamond({ number, includeFillColor, hoverFunction }) {
  const size = numberMovesScale(number);

  const fontSizeScale = d3
    .scaleLinear()
    .domain([3, 16])
    .range([12, 16])
    .clamp(true);
  const fontSize = fontSizeScale(number);

  return html`<g class="diamond" onmouseenter=${hoverFunction}>
    <rect
      width="${size}"
      height="${size}"
      x="${-size / 2}"
      y="${-size / 2}"
      transform="rotate(45)"
      class="diamond-rect"
      fill="${includeFillColor && colorMapping[number]
        ? `var(--color-vis-${colorMapping[number]})`
        : "var(--color-vis-main-dark-blue)"}"
    />
    <text
      x="0"
      y="0"
      text-anchor="middle"
      dominant-baseline="central"
      class="diamond-text"
      font-size="${fontSize}"
    >
      ${number}
    </text>
    />
  </g>`;
}
