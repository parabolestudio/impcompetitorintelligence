import { html } from "./lib.js";
import { countryShapeMapping } from "./helpers.js";

export default function Country({
  countryName,
  color,
  width: propWidth,
  height: propHeight,
}) {
  const countryConfig = countryShapeMapping[countryName];
  if (countryConfig) {
    const { shapeFile, aspectRatio } = countryConfig;
    // Use props if provided, otherwise derive from aspectRatio with a default area
    const width = propWidth || (aspectRatio >= 1 ? 80 : 80 * aspectRatio);
    const height = propHeight || (aspectRatio >= 1 ? 80 / aspectRatio : 80);

    const countryMiniDiamondSize = 7;
    return html`<g class="country ${countryName}">
      <image
        href="./assets/countryShapes/${shapeFile}"
        x="-${width / 2}"
        width="${width}"
        height="${height}"
      />
      <text class="country-name" text-anchor="middle" y="${height + 20}"
        >${countryName}</text
      >
      <rect
        y="${height / 2 - countryMiniDiamondSize / 2}"
        x="-${countryMiniDiamondSize / 2}"
        width="${countryMiniDiamondSize}"
        height="${countryMiniDiamondSize}"
        fill="var(--color-vis-${color})"
        transform="rotate(45)"
        transform-origin="0 ${height / 2}px"
      />
    </g>`;
  }

  return null;
}
