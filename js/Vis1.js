import { html, useEffect, useState } from "./preact-htm.js";
import { CompanyWithDiamond } from "./Company.js";
// import { REPO_BASE_URL } from "./helpers.js";

export function Vis1() {
  const [movesData, setMovesData] = useState(null);
  const [newCompanyData, setNewCompanyData] = useState(null);

  useEffect(() => {
    // Fetch data when the component mounts
    d3.csv(
      //   `${REPO_BASE_URL}/data/vis1_data.csv`,
      `./data/data_vis1_transformed.csv`,
    ).then((transformedData) => {
      transformedData.forEach((d) => {
        d["formerFirm"] = d["Former firm"];
        d["newFirm"] = d["New firm"];
        d["numberMoves"] = +d["Number of Moves"];
      });

      // sort by number of moves
      transformedData.sort((a, b) => +b.numberMoves - +a.numberMoves);
      setMovesData(transformedData);

      // Extract unique new firms for the lower section
      const uniqueNewFirms = Array.from(
        new Set(transformedData.map((d) => d.newFirm)),
      );
      // for each new firm, find the total number of moves to that firm
      const newCompanyData = uniqueNewFirms.map((newFirm) => {
        const totalMoves = transformedData
          .filter((d) => d.newFirm === newFirm)
          .reduce((sum, d) => sum + d.numberMoves, 0);
        return {
          name: newFirm,
          totalMoves,
        };
      });
      setNewCompanyData(newCompanyData);
    });
  }, []);

  if (!movesData) {
    return html`<div>Loading data...</div>`;
  }

  console.log("Rendering vis 1 with ", {
    movesData,
    newCompanyData,
  });

  // dimensions
  const visContainer = document.querySelector("#vis-1");
  const width =
    visContainer && visContainer.offsetWidth ? visContainer.offsetWidth : 600;
  const height1 = 160; // upper section with former company names
  const height2 = 210; // middle section with lines connecting to current company names
  const height3 = 634; // lower section with current company names and logos
  const height = height1 + height2 + height3;
  const margin = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  };
  console.log("Vis 1 dimensions: ", {
    width,
    height,
    margin,
  });

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const config = window.customChartsConfig || {};

  const uniqueCompanyMoves = Array.from(
    new Set(newCompanyData.map((d) => d.totalMoves)),
  ).sort((a, b) => a - b);
  const marginSection3 = {
    top: 100,
    left: 50,
    bottom: 110,
    right: 50,
  };
  const scaleCompanyY = d3
    .scalePoint()
    .domain(uniqueCompanyMoves)
    .range([
      height1 + height2 + marginSection3.top,
      height1 + height2 + height3 - marginSection3.bottom,
    ]);
  const sortedNewCompanyData = [...newCompanyData].sort(
    (a, b) => a.totalMoves - b.totalMoves,
  );

  const newCompanyScaleX = d3
    .scalePoint()
    .domain(Array.from(sortedNewCompanyData.map((d) => d.name)))
    .range([marginSection3.left, innerWidth - marginSection3.right]);

  // get unique former firms
  const uniqueFormerFirms = Array.from(
    new Set(movesData.map((d) => d.formerFirm)),
  );
  // sort unique former firms by total number of moves from that firm
  // uniqueFormerFirms.sort((a, b) => {
  //   const totalMovesA = movesData
  //     .filter((d) => d.formerFirm === a)
  //     .reduce((sum, d) => sum + d.numberMoves, 0);
  //   const totalMovesB = movesData
  //     .filter((d) => d.formerFirm === b)
  //     .reduce((sum, d) => sum + d.numberMoves, 0);
  //   return totalMovesB - totalMovesA;
  // });

  // sort unique former firms by name
  uniqueFormerFirms.sort((a, b) => a.localeCompare(b));

  const marginSection1 = {
    left: 90,
    right: 90,
  };
  const formerFirmScaleX = d3
    .scalePoint()
    .domain(uniqueFormerFirms)
    .range([marginSection1.left, innerWidth - marginSection1.right]);
  console.log("Unique former firms: ", uniqueFormerFirms);

  return html`<div class="vis-container">
    <p class="vis-title">${config?.vis1?.title || "Title for Vis 1"}</p>
    <p class="vis-subtitle">
      ${config?.vis1?.subtitle || "Subtitle for Vis 1"}
    </p>
    <svg
      viewBox="0 0 ${width} ${height}"
      style="background: #ccc;"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(${margin.left}, ${margin.top})">
        <rect
          width="${innerWidth}"
          height="${innerHeight}"
          fill="#f2f2f2"
          stroke="none"
        />
        <g>
          <line
            x1="0"
            y1="${height1}"
            x2="${width}"
            y2="${height1}"
            stroke="var(--color-vis-neutral-grey2)"
          />
          <text class="axis-text" y="${height1 - 5}">Former firms</text>
          <line
            x1="0"
            y1="${height1 + height2}"
            x2="${width}"
            y2="${height1 + height2}"
            stroke="var(--color-vis-neutral-grey2)"
          />
          <text class="axis-text" y="${height1 + height2 - 5}">New firms</text>
        </g>
        ${uniqueFormerFirms.map((d, i) => {
          const positionX = formerFirmScaleX(d);
          return html`
            <text class="former-firm-text" x="-${height1 - 2}" y="${positionX}">
              ${d}
            </text>
          `;
        })}
        ${sortedNewCompanyData.map((d) => {
          const x = newCompanyScaleX(d.name);
          const y = scaleCompanyY(d.totalMoves);
          return html`
            <g transform="translate(${x}, ${y})">
              <${CompanyWithDiamond} name=${d.name} number=${d.totalMoves} />
            </g>
          `;
        })}
      </g>
    </svg>
    <p class="vis-source">${config?.vis1?.source || "Source for Vis 1"}</p>
  </div>`;
}
