import Diamond from "./Diamond.js";
import { html } from "./preact-htm.js";
import { numberMovesScale } from "./helpers.js";

const logoMapping = {
  "Apollo Global Management": "Apollo_Global_Management.png",
  "Ares Management Corporation": "Ares_Management.png",
  "Bain Capital": "Bain_Capital.png",
  Barings: "Barings.png",
  Blackstone: "Blackstone.png",
  "Blue Owl Capital": "Blue_Owl.png",
  Brookfield: "Brookfield.png",
  "The Carlyle Group": "Carlyle.png",
  CVC: "CVC.png",
  "DWS Group": "DWS_Group.png",
  EQT: "EQT.png",
  "IFM Investors": "IFM_Investors.png",
  KKR: "Kohlberg_Kravis_Roberts.png",
  "Oaktree Capital Management, L.P.": "Oaktree.png",
  "Partners Group": "Partners_Group_Icon 2.png",
  PGIM: "PGIM.png",
  TPG: "TPG.png",
  "Warburg Pincus LLC": "Warburg_Pincus.png",
};

export function Company({ name, number }) {
  const width = 84;
  const size = numberMovesScale(number);
  const logoURL = `./assets/companyLogos/${logoMapping[name] || "Brookfield.png"}`;

  return html`<g transform="translate(${-width / 2}, ${size / 2 + 12})">
    <foreignObject width="${width}" height="100" x="0" y="0">
      <div xmlns="http://www.w3.org/1999/xhtml" class="company">
        <p class="company-name">${name}</p>
        <img src="${logoURL}" class="company-logo" />
      </div>
    </foreignObject>
  </g>`;
}

export function CompanyWithDiamond({ name, number, isFaded }) {
  return html`<g
    style="opacity: ${isFaded ? 0.2 : 1}; transition: opacity 0.3s;"
  >
    <${Diamond} number=${number} />
    <${Company} name=${name} number=${number} />
  </g>`;
}
