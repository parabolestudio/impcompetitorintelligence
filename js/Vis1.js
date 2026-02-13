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
  const height1 = 150; // upper section with former company names
  const height2 = 200; // middle section with lines connecting to current company names
  const height3 = 1000; // lower section with current company names and logos
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
        ${newCompanyData.map((d, i) => {
          const x = (i + 1) * (innerWidth / (newCompanyData.length + 1));
          // add random jitter to y position to avoid overlap
          const y = height1 + height2 + 50 + Math.random() * 200;
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
