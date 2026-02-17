import { html } from "./preact-htm.js";
import { countryShapeMapping } from "./helpers.js";

export default function Country({ countryName, color }) {
  const countryConfig = countryShapeMapping[countryName];
  if (countryConfig) {
    const { shapeFile, shapeWidth, shapeHeight } = countryConfig;
    const width = shapeWidth || 100; // default width if not specified
    const height = shapeHeight || 100; // default height if not specified

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
