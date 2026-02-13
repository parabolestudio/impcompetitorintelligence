import Diamond from "./Diamond.js";
import { html } from "./preact-htm.js";

export function Company({ name }) {
  const width = 84;
  return html`<g transform="translate(${-width / 2}, 4)">
    <foreignObject width="${width}" height="100" x="0" y="0">
      <div xmlns="http://www.w3.org/1999/xhtml" class="company">
        <p class="company-name">${name}</p>
      </div>
    </foreignObject>
  </g>`;
}

export function CompanyWithDiamond({ name, number }) {
  return html`<g>
    <${Diamond} number=${number} />
    <${Company} name=${name} />
  </g>`;
}
