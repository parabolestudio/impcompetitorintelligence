import Diamond from "./Diamond.js";
import { html } from "./preact-htm.js";
import { numberMovesScale, logoMapping } from "./helpers.js";

export function Company({ name, number, hoverFunction }) {
  const width = 84;
  const size = numberMovesScale(number);
  const logoURL = `./assets/companyLogos/${logoMapping[name] || "Brookfield.png"}`;

  return html`<g transform="translate(${-width / 2}, ${size / 2 + 12})">
    <foreignObject width="${width}" height="86" x="0" y="0">
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        class="company"
        onmouseenter=${hoverFunction}
      >
        <p class="company-name">${name}</p>
        <img src="${logoURL}" class="company-logo" />
      </div>
    </foreignObject>
  </g>`;
}

export function CompanyWithDiamondExtended({
  name,
  number,
  isFaded,
  hoverFunction,
}) {
  return html`<g
    style="opacity: ${isFaded ? 0.2 : 1}; transition: opacity 0.3s;"
  >
    <${Diamond}
      number=${number}
      includeFillColor=${true}
      hoverFunction=${hoverFunction}
    />
    <${Company} name=${name} number=${number} hoverFunction=${hoverFunction} />
  </g>`;
}

export function CompanyWithDiamondRotated({ name, number }) {
  const size = numberMovesScale(number);
  const topCornerY = (size * Math.sqrt(2)) / 2;

  return html`<g>
    <${Diamond} number=${number} includeFillColor=${false} />
    <text
      class="company-name-rotated"
      transform="translate(0, ${-topCornerY}) rotate(-45)"
      dx="2"
      dy="10"
      text-anchor="start"
      >${name}</text
    >
  </g>`;
}
