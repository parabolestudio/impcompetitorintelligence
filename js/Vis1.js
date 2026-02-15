import { html, useEffect, useState } from "./preact-htm.js";
import { CompanyWithDiamond } from "./Company.js";
import { Tooltip } from "./Tooltip.js";
import {
  numberMovesScale,
  colorMapping,
  logoMapping,
  REPO_BASE_URL,
} from "./helpers.js";

export function Vis1() {
  const [movesData, setMovesData] = useState(null);
  const [newCompanyData, setNewCompanyData] = useState(null);
  const [hoveredObject, setHoveredObject] = useState(null);

  useEffect(() => {
    // Fetch data when the component mounts
    d3.csv(
      `${REPO_BASE_URL}/data/data_vis1_transformed.csv`,
      // `./data/data_vis1_transformed.csv`,
    ).then((transformedData) => {
      transformedData.forEach((d) => {
        d["formerFirm"] = d["Former firm"];
        d["newFirm"] = d["New firm"];
        d["numberMoves"] = +d["Number of Moves"];
        d["teamInvolved"] = d["Teams (IMP defined)"]
          .split(";")
          .map((s) => s.trim());
        d["positionsWithSeniority"] = d["Seniorities (IMP defined)"]
          .split(";")
          .map((s) => s.trim());
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

        const teamsInvolved = transformedData
          .filter((d) => d.newFirm === newFirm)
          .flatMap((d) => d.teamInvolved);
        const uniqueTeams = Array.from(new Set(teamsInvolved));

        const positionsWithSeniority = transformedData
          .filter((d) => d.newFirm === newFirm)
          .flatMap((d) => d.positionsWithSeniority);
        const uniquePositionsWithSeniority = Array.from(
          new Set(positionsWithSeniority),
        );

        return {
          name: newFirm,
          totalMoves,
          teamsInvolved: uniqueTeams,
          positionsWithSeniority: uniquePositionsWithSeniority,
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

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const config = window.customChartsConfig || {};

  // Bézier curve parameters
  // cpOffset: vertical distance (fraction of total dy) from start/end
  //           to first/second control point. 0 = straight, 0.5 = smooth S, 1 = extreme
  const curveCpOffset = 0.3;
  // cpSkew:   horizontal shift of control points (px). Positive = both CPs shift right.
  //           0 = symmetric curve that follows the straight-line direction
  const curveCpSkew = 0;
  // cpSpread: extra horizontal spread applied symmetrically to the two CPs (px).
  //           Positive = CPs pushed apart, Negative = CPs pulled together
  const curveCpSpread = 0;

  const uniqueCompanyMoves = Array.from(
    new Set(newCompanyData.map((d) => d.totalMoves)),
  ).sort((a, b) => a - b);
  const marginSection3 = {
    top: 180,
    left: 50,
    bottom: 110,
    right: 50,
  };
  const newCompanyScaleY = d3
    .scalePoint()
    .domain(uniqueCompanyMoves)
    .range([
      height1 + height2 + marginSection3.top,
      height1 + height2 + height3 - marginSection3.bottom,
    ]);
  // Pyramid style: highest totalMoves in center, decreasing outward
  // Pyramid ordering for new companies (x-direction):
  // Sorts new companies by totalMoves descending
  // Places the company with the most moves at the center index
  // Alternates placing the next-highest companies to the right and left of center
  // Result: a pyramid/funnel shape where companies with the most connections sit in the middle-bottom and companies with fewer connections fan out to the sides
  const sortedByMovesDesc = [...newCompanyData].sort(
    (a, b) => b.totalMoves - a.totalMoves,
  );
  const nNew = sortedByMovesDesc.length;
  const sortedNewCompanyData = new Array(nNew);
  const mid = Math.floor(nNew / 2);
  sortedNewCompanyData[mid] = sortedByMovesDesc[0];
  let pLeft = mid - 1;
  let pRight = mid + 1;
  for (let i = 1; i < nNew; i++) {
    if (i % 2 === 1 && pRight < nNew) {
      sortedNewCompanyData[pRight] = sortedByMovesDesc[i];
      pRight++;
    } else if (pLeft >= 0) {
      sortedNewCompanyData[pLeft] = sortedByMovesDesc[i];
      pLeft--;
    } else {
      sortedNewCompanyData[pRight] = sortedByMovesDesc[i];
      pRight++;
    }
  }

  const newCompanyScaleX = d3
    .scalePoint()
    .domain(Array.from(sortedNewCompanyData.map((d) => d.name)))
    .range([marginSection3.left, innerWidth - marginSection3.right]);

  // get unique former firms
  const uniqueFormerFirms = Array.from(
    new Set(movesData.map((d) => d.formerFirm)),
  );

  // sort former firms by weighted average x-position of their connected new firms
  // so that former firms leading to the same new firm cluster together
  // Proximity-based ordering for former companies:
  // For each former company, computes a weighted average x-position based on where its connected new companies are placed (weighted by number of moves)
  // Sorts former companies by this weighted average
  // Result: former companies that feed into the same new company are grouped together along the x-axis, which significantly reduces line crossings
  uniqueFormerFirms.sort((a, b) => {
    const aConns = movesData.filter((d) => d.formerFirm === a);
    const bConns = movesData.filter((d) => d.formerFirm === b);
    const aTotalMoves = aConns.reduce((s, d) => s + d.numberMoves, 0);
    const bTotalMoves = bConns.reduce((s, d) => s + d.numberMoves, 0);
    const aWeightedX =
      aConns.reduce(
        (s, d) => s + newCompanyScaleX(d.newFirm) * d.numberMoves,
        0,
      ) / aTotalMoves;
    const bWeightedX =
      bConns.reduce(
        (s, d) => s + newCompanyScaleX(d.newFirm) * d.numberMoves,
        0,
      ) / bTotalMoves;
    return aWeightedX - bWeightedX;
  });

  const marginSection1 = {
    left: 90,
    right: 90,
  };
  const formerFirmScaleX = d3
    .scalePoint()
    .domain(uniqueFormerFirms)
    .range([marginSection1.left, innerWidth - marginSection1.right]);

  const linesData = movesData.map((d) => {
    // find new company data for this move's new firm
    const newCompany = newCompanyData.find((c) => c.name === d.newFirm);
    return {
      formerFirm: d.formerFirm,
      newFirm: d.newFirm,
      numberMoves: d.numberMoves,
      start: {
        x: formerFirmScaleX(d.formerFirm),
        y: height1 + 4,
      },
      end: {
        x: newCompanyScaleX(d.newFirm),
        y:
          newCompanyScaleY(newCompany.totalMoves) -
          numberMovesScale(newCompany.totalMoves) / 2 -
          4,
      },
      color: `var(--color-vis-${colorMapping[newCompany.totalMoves]})`,
      colorKey: colorMapping[newCompany.totalMoves],
    };
  });

  // Extract unique colors for gradient definitions
  const uniqueColors = Array.from(
    new Set(linesData.map((d) => d.colorKey)),
  ).map((colorKey) => ({
    key: colorKey,
    cssVar: `var(--color-vis-${colorKey})`,
  }));

  const tooltipWidth = 280;

  return html`<div class="vis-container">
    <p class="vis-title">${config?.vis1?.title || "Title for Vis 1"}</p>
    <p class="vis-subtitle">
      ${config?.vis1?.subtitle || "Subtitle for Vis 1"}
    </p>
    <div class="vis-content">
      <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          ${uniqueColors.map((colorObj) => {
            return html`
              <linearGradient
                id="gradient-${colorObj.key}"
                x1="0"
                y1="${height1}"
                x2="0"
                y2="${height1 + height2}"
                gradientUnits="userSpaceOnUse"
              >
                <stop stop-color="${colorObj.cssVar}" stop-opacity="0.3" />
                <stop offset="1" stop-color="${colorObj.cssVar}" />
              </linearGradient>
            `;
          })}
        </defs>
        <g transform="translate(${margin.left}, ${margin.top})">
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
            <text class="axis-text" y="${height1 + height2 - 5}">
              New firms
            </text>
          </g>
          ${uniqueFormerFirms.map((d, i) => {
            const positionX = formerFirmScaleX(d);

            // find out if this former firm is connected to the currently hovered new company (if any)
            const isConnectedToHoveredNewCompany =
              hoveredObject &&
              hoveredObject.hoverType === "newCompany" &&
              movesData.some(
                (move) =>
                  move.formerFirm === d &&
                  move.newFirm === hoveredObject.newCompany,
              );

            const isFaded =
              hoveredObject &&
              hoveredObject.hoverType === "newCompany" &&
              !isConnectedToHoveredNewCompany;

            return html`
              <text
                class="former-firm-text"
                x="-${height1 - 2}"
                y="${positionX}"
                opacity="${isFaded ? 0.2 : 1}"
              >
                ${d}
              </text>
            `;
          })}
          ${linesData.map((d) => {
            const dx = d.end.x - d.start.x;
            const dy = d.end.y - d.start.y;
            const cp1x = d.start.x + curveCpSkew - curveCpSpread + dx * 0;
            const cp1y = d.start.y + dy * curveCpOffset;
            const cp2x = d.end.x + curveCpSkew + curveCpSpread + dx * 0;
            const cp2y = d.end.y - dy * curveCpOffset;
            const isFaded =
              hoveredObject &&
              hoveredObject.hoverType === "newCompany" &&
              hoveredObject.newCompany !== d.newFirm;
            return html`
              <path
                d="M ${d.start.x},${d.start
                  .y} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${d.end.x},${d.end.y}"
                stroke="url(#gradient-${d.colorKey})"
                stroke-width="2"
                fill="none"
                style="transition: stroke-opacity 0.3s;"
                stroke-opacity="${isFaded ? 0.2 : 1}"
              />
            `;
          })}
          ${sortedNewCompanyData.map((d) => {
            const x = newCompanyScaleX(d.name);
            const y = newCompanyScaleY(d.totalMoves);
            const isFaded =
              hoveredObject &&
              hoveredObject.hoverType === "newCompany" &&
              hoveredObject.newCompany !== d.name;
            return html`
              <g
                transform="translate(${x}, ${y})"
                class="new-company-group"
                onmouseenter=${(event) => {
                  const container = event.currentTarget.closest(".vis-content");
                  const rect = container.getBoundingClientRect();
                  setHoveredObject({
                    hoverType: "newCompany",
                    newCompany: d.name,
                    x: x + tooltipWidth / 2 - rect.left,
                    y: event.clientY - rect.top,
                    tooltipContent: [
                      { label: "New firm", value: d.name },
                      { label: "Number of moves", value: d.totalMoves },
                      {
                        label: "Positions offered",
                        value: d.positionsWithSeniority
                          .sort((a, b) => a.localeCompare(b))
                          .join(", "),
                      },
                      {
                        label: "Teams involved",
                        value: d.teamsInvolved
                          .sort((a, b) => a.localeCompare(b))
                          .join(", "),
                      },
                    ],
                    tooltipUpperContent: html`
                      <img
                        src="${`./assets/companyLogos/${logoMapping[d.name] || "Brookfield.png"}`}"
                        class="company-logo-tooltip"
                      />
                    `,
                  });
                }}
                onmouseleave=${() => setHoveredObject(null)}
              >
                <${CompanyWithDiamond}
                  name=${d.name}
                  number=${d.totalMoves}
                  isFaded=${isFaded}
                />
              </g>
            `;
          })}
        </g>
      </svg>
      <${Tooltip} hoveredItem=${hoveredObject} />
    </div>
    <p class="vis-source">${config?.vis1?.source || "Source for Vis 1"}</p>
  </div>`;
}
