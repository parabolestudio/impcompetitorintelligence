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
  return html`<g>
    <${Diamond} number=${number} includeFillColor=${false} />
  </g>`;
}
