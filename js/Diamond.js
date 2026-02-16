import { html } from "./preact-htm.js";
import {
  colorMappingByNumber,
  colorMappingByContinent,
  numberMovesScale,
} from "./helpers.js";

export default function Diamond({
  number,
  color,
  colorContinent,
  hoverFunction,
}) {
  const size = numberMovesScale(number);

  // color of type "byNumber", "byContinent" or null
  let fillColor = "var(--color-vis-main-dark-blue)"; // default color if no mapping is applied
  if (color === "byNumber") {
    fillColor = `var(--color-vis-${colorMappingByNumber[number] || "neutral-grey2"})`;
  } else if (color === "byContinent" && colorContinent) {
    fillColor = `var(--color-vis-${colorMappingByContinent[colorContinent] || "neutral-grey2"})`;
  }

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
      fill="${fillColor}"
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
