import Diamond from "./Diamond.js";
import { html } from "./preact-htm.js";
import { numberMovesScale } from "./helpers.js";

const logoMapping = {
  "Apollo Global Management": "Apollo_Global_Management.png",
  "Ares Management Corporation": "Ares_Management.png",
  "Bain Capital": "Bain_Capital.png",
  Barings: "Barings.png",
  Blackstone: "Blackstone.png",
  "Blue Owl": "Blue_Owl.png",
  Brookfield: "Brookfield_Asset_Management.png",
  "Carlyle Group": "Carlyle.png",
  CVC: "CVC.png",
  "DWS Group": "DWS_Group.png",
  "EQT Partners": "EQT.png",
  "IFM Investors": "IFM_Investors.png",
  "Kohlberg Kravis Roberts": "Kohlberg_Kravis_Roberts.png",
  Oaktree: "Oaktree.png",
  "Partners Group": "Partners_Group_Icon 2.png",
  PGIM: "PGIM.png",
  "TPG Capital": "TPG.png",
  "Warburg Pincus": "Warburg_Pincus.png",
};

export function Company({ name, number }) {
  const width = 84;
  const size = numberMovesScale(number);
  const logoURL = `./assets/companyLogos/${logoMapping[name] || "default.png"}`;

  return html`<g transform="translate(${-width / 2}, ${size / 2 + 12})">
    <foreignObject width="${width}" height="100" x="0" y="0">
      <div xmlns="http://www.w3.org/1999/xhtml" class="company">
        <p class="company-name">${name}</p>
        <img src="${logoURL}" class="company-logo" />
      </div>
    </foreignObject>
  </g>`;
}

export function CompanyWithDiamond({ name, number }) {
  return html`<g>
    <${Diamond} number=${number} />
    <${Company} name=${name} number=${number} />
  </g>`;
}
