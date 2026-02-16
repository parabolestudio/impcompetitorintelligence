import { html, useEffect, useState } from "./preact-htm.js";
import { CompanyWithDiamondRotated } from "./Company.js";
import Fallback from "./Fallback.js";
import { numberMovesScale, colorMapping, REPO_BASE_URL } from "./helpers.js";

export function Vis2() {
  const [firmsData, setFirmsData] = useState(null);
  const [newCompanyData, setNewCompanyData] = useState(null);

  const MOBILE_THRESHOLD = 1200;
  const [showFallback, setShowFallback] = useState(
    window.innerWidth < MOBILE_THRESHOLD,
  );

  // on resize, clear hovered object to prevent tooltip from getting stuck in wrong position and render fallback if width is below threshold
  useEffect(() => {
    function handleResize() {
      setHoveredObject(null);
      setShowFallback(window.innerWidth < MOBILE_THRESHOLD);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // mobile fallback
  if (showFallback) {
    return html`<${Fallback} />`;
  }

  useEffect(() => {
    // Fetch data when the component mounts
    d3.csv(
      // `${REPO_BASE_URL}/data/data_vis2_firms.csv`,
      `./data/data_vis2_firms.csv`,
    ).then((firmsData) => {
      firmsData.forEach((d) => {
        d["newFirm"] = d["New firm"];
        d["totalMoves"] = +d["Total moves"];
      });

      setFirmsData(firmsData);
    });
  }, []);

  if (!firmsData) {
    return html`<div>Loading data...</div>`;
  }

  console.log("Rendering vis 2 with ", {
    firmsData,
  });

  // dimensions
  const visContainer = document.querySelector("#vis-2");
  const width =
    visContainer && visContainer.offsetWidth ? visContainer.offsetWidth : 600;
  const height1 = 145; // upper section with new company names
  const height2 = 300; // middle section (upper part) with lines connecting to diamond
  const height3 = 70; // middle section (lower part) from diamond to new countries
  const height4 = 320; // lower section with current company names and logos
  const height = height1 + height2 + height3 + height4;
  const margin = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  };

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const config = window.customChartsConfig || {};

  // const uniqueCompanyMoves = Array.from(
  //   new Set(newCompanyData.map((d) => d.totalMoves)),
  // ).sort((a, b) => a - b);
  // const marginSection3 = {
  //   top: 180,
  //   left: 50,
  //   bottom: 110,
  //   right: 50,
  // };
  // const newCompanyScaleY = d3
  //   .scalePoint()
  //   .domain(uniqueCompanyMoves)
  //   .range([
  //     height1 + height2 + marginSection3.top,
  //     height1 + height2 + height3 - marginSection3.bottom,
  //   ]);
  // // Pyramid style: highest totalMoves in center, decreasing outward
  // // Pyramid ordering for new companies (x-direction):
  // // Sorts new companies by totalMoves descending
  // // Places the company with the most moves at the center index
  // // Alternates placing the next-highest companies to the right and left of center
  // // Result: a pyramid/funnel shape where companies with the most connections sit in the middle-bottom and companies with fewer connections fan out to the sides
  // const sortedByMovesDesc = [...newCompanyData].sort(
  //   (a, b) => b.totalMoves - a.totalMoves,
  // );
  // const nNew = sortedByMovesDesc.length;
  // const sortedNewCompanyData = new Array(nNew);
  // const mid = Math.floor(nNew / 2);
  // sortedNewCompanyData[mid] = sortedByMovesDesc[0];
  // let pLeft = mid - 1;
  // let pRight = mid + 1;
  // for (let i = 1; i < nNew; i++) {
  //   if (i % 2 === 1 && pRight < nNew) {
  //     sortedNewCompanyData[pRight] = sortedByMovesDesc[i];
  //     pRight++;
  //   } else if (pLeft >= 0) {
  //     sortedNewCompanyData[pLeft] = sortedByMovesDesc[i];
  //     pLeft--;
  //   } else {
  //     sortedNewCompanyData[pRight] = sortedByMovesDesc[i];
  //     pRight++;
  //   }
  // }

  // const newCompanyScaleX = d3
  //   .scalePoint()
  //   .domain(Array.from(sortedNewCompanyData.map((d) => d.name)))
  //   .range([marginSection3.left, innerWidth - marginSection3.right]);

  // get unique new firms
  const uniqueNewFirms = Array.from(new Set(firmsData.map((d) => d.newFirm)));

  const marginSection1 = {
    left: 90,
    right: 90,
  };
  const newFirmScaleX = d3
    .scalePoint()
    .domain(uniqueNewFirms)
    .range([marginSection1.left, innerWidth - marginSection1.right]);

  return html`<div class="vis-container">
    <p class="vis-title">${config?.vis2?.title || "Title for Vis 2"}</p>
    <p class="vis-subtitle">
      ${config?.vis2?.subtitle || "Subtitle for Vis 2"}
    </p>
    <div class="vis-content">
      <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <rect
          width="${innerWidth}"
          height="${innerHeight}"
          fill="#f2f2f2"
          stroke="none"
        />

        <g transform="translate(${margin.left}, ${margin.top})">
          <g>
            <line
              x1="0"
              y1="${height1}"
              x2="${width}"
              y2="${height1}"
              stroke="var(--color-vis-neutral-grey2)"
            />
            <text class="axis-text" y="${height1 - 5}">New firms</text>
            <line
              x1="0"
              y1="${height1 + height2 + height3}"
              x2="${width}"
              y2="${height1 + height2 + height3}"
              stroke="var(--color-vis-neutral-grey2)"
            />
            <text class="axis-text" y="${height1 + height2 + height3 - 22}">
              <tspan>Country and city</tspan>
              <tspan x="0" dy="16">after move</tspan>
            </text>
          </g>

          ${firmsData.map((d) => {
            const x = newFirmScaleX(d.newFirm);
            const y = height1;

            return html`
              <g transform="translate(${x}, ${y})" class="new-company-group">
                <${CompanyWithDiamondRotated}
                  name=${d.name}
                  number=${d.totalMoves}
                />
              </g>
            `;
          })}
        </g>
      </svg>
    </div>
    <p class="vis-source">${config?.vis2?.source || "Source for Vis 2"}</p>
  </div>`;
}
