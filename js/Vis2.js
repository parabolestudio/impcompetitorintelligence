import { html, useEffect, useState, csv } from "./lib.js";
import { CompanyWithDiamondRotated } from "./Company.js";
import Fallback from "./Fallback.js";
import { Tooltip } from "./Tooltip.js";
import {
  numberMovesScale,
  colorMappingByContinent,
  REPO_BASE_URL,
  isLocal,
  countryShapeMapping,
} from "./helpers.js";
import Diamond from "./Diamond.js";
import Country from "./Country.js";

const updateParam = new URLSearchParams(window.location.search).get(
  "dataUpdate",
);
const inputFileNamePart = updateParam
  ? `data_vis2_${updateParam}`
  : "data_vis2_2026_2";

export function Vis2() {
  const [firmsData, setFirmsData] = useState(null);
  const [countriesData, setCountriesData] = useState(null);
  const [countriesCentricData, setCountriesCentricData] = useState(null);
  const [cityMovesData, setCityMovesData] = useState(null);
  const [hoveredObject, setHoveredObject] = useState(null);
  const [svgCityData, setSvgCityData] = useState({}); // { countryName: { viewBox: {w,h}, cities: { cityName: {x,y} } } }

  console.log("Vis2 hoveredObject", { hoveredObject });

  const MOBILE_THRESHOLD = 1200;
  const [showFallback, setShowFallback] = useState(
    window.innerWidth < MOBILE_THRESHOLD,
  );

  // on resize, clear hovered object to prevent tooltip from getting stuck in wrong position and render fallback if width is below threshold
  useEffect(() => {
    function handleResize() {
      setHoveredObject ? setHoveredObject(null) : null;
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
    Promise.all([
      csv(
        isLocal
          ? `./data/${inputFileNamePart}_firms.csv`
          : `${REPO_BASE_URL}/data/${inputFileNamePart}_firms.csv`,
      ),
      csv(
        isLocal
          ? `./data/${inputFileNamePart}_countries.csv`
          : `${REPO_BASE_URL}/data/${inputFileNamePart}_countries.csv`,
      ),
      csv(
        isLocal
          ? `./data/${inputFileNamePart}_cities.csv`
          : `${REPO_BASE_URL}/data/${inputFileNamePart}_cities.csv`,
      ),
    ]).then(([firmsDataRaw, countriesDataRaw, cityMovesDataRaw]) => {
      firmsDataRaw.forEach((d) => {
        d["newFirm"] = d["New firm"];
        d["totalMoves"] = +d["Total moves"];
      });

      countriesDataRaw.forEach((d) => {
        d["newFirm"] = d["New firm"];
        d["country"] = d["Country"];
        d["continent"] = d["Continent"];
        d["cities"] = d["Cities"]
          ? d["Cities"].split(";").map((s) => s.trim())
          : [];
        d["movesNewFirmCountry"] = +d["Moves"];
        d["colorKey"] =
          colorMappingByContinent[d["Continent"]] || "neutral-grey2";
      });

      // add country to firms data for easier access when rendering and interactions
      firmsDataRaw.forEach((firm) => {
        const countryConnections = countriesDataRaw.filter(
          (d) => d.newFirm === firm.newFirm,
        );
        firm.countries = countryConnections.map((d) => d.country);
      });

      setFirmsData(firmsDataRaw);
      setCountriesData(countriesDataRaw);

      // parse city moves data
      cityMovesDataRaw.forEach((d) => {
        d["country"] = d["Country"];
        d["city"] = d["City"];
        d["moves"] = +d["Moves"];
      });
      setCityMovesData(cityMovesDataRaw);

      // get unique list of countries
      const uniqueCountries = Array.from(
        new Set(countriesDataRaw.map((d) => d["Country"])),
      ).filter((c) => c && c.trim() !== "");

      const countryCentricData = uniqueCountries.map((country) => {
        const moves = countriesDataRaw
          .filter((d) => d["country"] === country)
          .reduce((sum, d) => sum + d["movesNewFirmCountry"], 0);
        return {
          country,
          movesNewFirmCountry: moves,
          continent:
            countriesDataRaw.find((d) => d["Country"] === country)?.[
              "Continent"
            ] || "Unknown",
        };
      });
      setCountriesCentricData(countryCentricData);

      // Fetch SVG files for countries with showCities to extract city positions
      const countriesWithCities = Object.entries(countryShapeMapping).filter(
        ([, cfg]) => cfg.showCities,
      );
      Promise.all(
        countriesWithCities.map(([countryName, cfg]) =>
          fetch(`${REPO_BASE_URL}/assets/countryShapes/${cfg.shapeFile}`)
            // fetch(`./assets/countryShapes/${cfg.shapeFile}`)
            .then((res) => res.text())
            .then((svgText) => {
              const parser = new DOMParser();
              const doc = parser.parseFromString(svgText, "image/svg+xml");
              const svgEl = doc.querySelector("svg");
              const vb = svgEl.getAttribute("viewBox").split(/\s+/).map(Number);
              const viewBox = { width: vb[2], height: vb[3] };

              // Find city groups inside <g class="cities">
              const citiesGroup =
                doc.querySelector('g[class="cities"]') ||
                doc.querySelector(".cities");
              const cities = {};
              if (citiesGroup) {
                for (const cityGroup of citiesGroup.children) {
                  const cityName =
                    cityGroup.getAttribute("class") ||
                    cityGroup.getAttribute("id");
                  if (!cityName) continue;
                  const path = cityGroup.querySelector("path");
                  if (!path) continue;
                  const d = path.getAttribute("d");
                  if (!d) continue;
                  // Parse the first move command to get the top-left of the diamond
                  // Format: "m29.865 68.306 4.584 4.584 ..." or "M29.865 68.306 ..."
                  const match = d.match(
                    /[mM]\s*([\d.eE+-]+)[\s,]+([\d.eE+-]+)\s+([\d.eE+-]+)[\s,]+([\d.eE+-]+)/,
                  );
                  if (match) {
                    const topX = parseFloat(match[1]);
                    const topY = parseFloat(match[2]);
                    const dx = parseFloat(match[3]);
                    const dy = parseFloat(match[4]);
                    // Center of diamond = top point shifted down by one leg length
                    cities[cityName] = { x: topX, y: topY + dy };
                  }
                }
              }
              return { countryName, viewBox, cities };
            }),
        ),
      ).then((results) => {
        const data = {};
        results.forEach((r) => {
          data[r.countryName] = {
            viewBox: r.viewBox,
            cities: r.cities,
          };
        });
        setSvgCityData(data);
      });
    });
  }, []);

  if (!firmsData) {
    return html`<div>Loading data...</div>`;
  }

  // console.log("Rendering vis 2 with ", {
  //   firmsData,
  //   countriesData,
  //   countriesCentricData,
  // });

  // dimensions
  const visContainer = document.querySelector("#vis-2");
  const width =
    visContainer && visContainer.offsetWidth ? visContainer.offsetWidth : 600;
  const height1 = 145; // upper section with new company names
  const height2 = 300; // middle section (upper part) with lines connecting to diamond
  const height3 = 70; // middle section (lower part) from diamond to new countries
  let height4 = 260; // lower section
  const height5 = 40; // continent labels below country shapes
  let height = height1 + height2 + height3 + height4 + height5;
  const margin = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  };

  const innerWidth = width - margin.left - margin.right;
  // let innerHeight = height - margin.top - margin.bottom;

  const config = window.customChartsConfig || {};

  // Bézier curve parameters (same principle as Vis1)
  const curveCpOffset = 0.3;
  const curveCpSkew = 0;
  const curveCpSpread = 0;

  // pre-calculate country positions grouped by continent
  const countryPositions = {};
  if (countriesCentricData) {
    // 1. Group countries by continent
    const continentGroups = {};
    countriesCentricData.forEach((d) => {
      if (!continentGroups[d.continent]) {
        continentGroups[d.continent] = [];
      }
      continentGroups[d.continent].push(d);
    });

    // 2. Calculate total moves per continent and sort continents descending
    const sortedContinents = Object.entries(continentGroups)
      .map(([continent, countries]) => ({
        continent,
        countries,
        totalMoves: countries.reduce(
          (sum, c) => sum + c.movesNewFirmCountry,
          0,
        ),
      }))
      .sort((a, b) => b.totalMoves - a.totalMoves);

    // 3. Sort countries within each continent by moves descending
    sortedContinents.forEach((group) => {
      group.countries.sort(
        (a, b) => b.movesNewFirmCountry - a.movesNewFirmCountry,
      );
    });

    // 4. Calculate diamond widths for spacing
    const countryWidth = (moves) => numberMovesScale(moves) * Math.sqrt(2);

    // Total width of all diamonds
    const countryGap = 16; // spacing between diamonds within a continent group
    const totalDiamondWidth = countriesCentricData.reduce(
      (sum, d) => sum + countryWidth(d.movesNewFirmCountry),
      0,
    );
    const totalIntraGaps = sortedContinents.reduce(
      (sum, g) => sum + Math.max(0, g.countries.length - 1) * countryGap,
      0,
    );

    // Spacing between continent groups
    const numGaps = sortedContinents.length - 1;
    const continentGap =
      numGaps > 0
        ? Math.max(
            20,
            (innerWidth - totalDiamondWidth - totalIntraGaps) / (numGaps + 2),
          )
        : 0;

    // Total width including gaps
    const totalLayoutWidth =
      totalDiamondWidth + totalIntraGaps + numGaps * continentGap;
    let cursorX = (innerWidth - totalLayoutWidth) / 2;

    // 5. Assign positions
    sortedContinents.forEach((group, gi) => {
      group.countries.forEach((d, ci) => {
        const w = countryWidth(d.movesNewFirmCountry);
        countryPositions[d.country] = {
          centerX: cursorX + w / 2,
          centerY: height1 + height2,
          topY: height1 + height2 - w / 2,
        };
        cursorX += w;
        if (ci < group.countries.length - 1) {
          cursorX += countryGap;
        }
      });
      if (gi < sortedContinents.length - 1) {
        cursorX += continentGap;
      }
    });
  }

  // Pre-calculate country shape positions, grouped by continent.
  // Continents with 4+ countries are placed in two rows; others in one row,
  // vertically centered to align with two-row continents.
  const countryShapePositions = {};
  if (countriesCentricData && Object.keys(countryPositions).length > 0) {
    const shapeGapX = 25; // horizontal gap between shapes within a row
    const rowGap = 4; // vertical gap between rows in a two-row continent
    const twoRowTopPadding = 25; // extra top spacing before the first row in two-row layout
    const twoRowThreshold = 4; // continents with this many or more countries get two rows
    const sectionTopY = height1 + height2 + height3; // top of the country shapes section
    const textHeight = 25; // approximate height of country name text below shape
    const targetShapeArea = 6000; // target visual area (w*h) for each country shape

    // Per-country size multipliers for fine-tuning (1.0 = default)
    // TODO: could be data-dependent, but needs fine-tuning for high value outlier
    const countrySizeOverrides = {
      USA: 8,
      UK: 5,
      Australia: 3,
    };

    // Get countries with shape mappings, grouped by continent (same order as diamonds)
    const continentGroups = {};
    countriesCentricData.forEach((d) => {
      if (!countryShapeMapping[d.country]) return;
      if (!continentGroups[d.continent]) continentGroups[d.continent] = [];
      continentGroups[d.continent].push(d);
    });

    // Sort continents by total moves descending (same order as diamond layout)
    const sortedContinentEntries = Object.entries(continentGroups)
      .map(([continent, countries]) => ({
        continent,
        countries,
        totalMoves: countries.reduce((s, c) => s + c.movesNewFirmCountry, 0),
      }))
      .sort((a, b) => b.totalMoves - a.totalMoves);

    // Sort countries within each continent by moves descending
    sortedContinentEntries.forEach((g) =>
      g.countries.sort((a, b) => b.movesNewFirmCountry - a.movesNewFirmCountry),
    );

    // Compute shape dimensions from equal area + aspect ratio
    const shapeItems = [];
    sortedContinentEntries.forEach((group) => {
      group.countries.forEach((d) => {
        const cfg = countryShapeMapping[d.country];
        const ar = cfg.aspectRatio || 1;
        const sizeMultiplier = countrySizeOverrides[d.country] || 1;
        const area = targetShapeArea * sizeMultiplier;
        // area = w * h, ar = w / h  =>  h = sqrt(area / ar), w = h * ar
        const h = Math.sqrt(area / ar);
        const w = h * ar;
        shapeItems.push({
          country: d.country,
          continent: d.continent,
          shapeW: w,
          shapeH: h,
          totalH: h + textHeight,
        });
      });
    });

    // Build a map for quick item lookup
    const shapeItemByCountry = {};
    shapeItems.forEach((item) => {
      shapeItemByCountry[item.country] = item;
    });

    // Two-row splitting only activates when at least 2 continents have >= twoRowThreshold countries
    const continentsAboveThreshold = sortedContinentEntries.filter(
      (g) => g.countries.length >= twoRowThreshold,
    ).length;
    const enableTwoRow = continentsAboveThreshold >= 2;

    // Determine row assignment for each continent (two rows if >= twoRowThreshold countries AND enableTwoRow)
    const continentLayoutMap = {};
    sortedContinentEntries.forEach((group) => {
      const n = group.countries.length;
      const isTwoRow = enableTwoRow && n >= twoRowThreshold;
      // Interleave: even-index countries → row 0, odd-index → row 1
      const rows = isTwoRow
        ? [
            group.countries.filter((_, i) => i % 2 === 0),
            group.countries.filter((_, i) => i % 2 === 1),
          ]
        : [group.countries];
      continentLayoutMap[group.continent] = { isTwoRow, rows };
    });

    // Compute row widths and block widths for each continent
    const getRowWidth = (row) =>
      row.reduce(
        (sum, d) => sum + (shapeItemByCountry[d.country]?.shapeW || 0),
        0,
      ) +
      Math.max(0, row.length - 1) * shapeGapX;

    const continentBlockData = sortedContinentEntries.map((group) => {
      const layout = continentLayoutMap[group.continent];
      const rowWidths = layout.rows.map(getRowWidth);
      return {
        continent: group.continent,
        rowWidths,
        blockWidth: Math.max(...rowWidths),
      };
    });

    // Calculate total width needed (using per-continent block widths)
    const numContinentGaps = sortedContinentEntries.length - 1;
    const continentShapeGap = 30; // gap between continent groups
    const totalBlockWidth =
      continentBlockData.reduce((s, b) => s + b.blockWidth, 0) +
      numContinentGaps * continentShapeGap;

    // Scale down if total width exceeds available width
    const maxWidth = innerWidth - 40; // leave some margin
    const scaleFactor =
      totalBlockWidth > maxWidth ? maxWidth / totalBlockWidth : 1;

    // Apply scale factor to all items if needed, then recompute block widths
    if (scaleFactor < 1) {
      shapeItems.forEach((item) => {
        item.shapeW *= scaleFactor;
        item.shapeH *= scaleFactor;
        item.totalH = item.shapeH + textHeight;
      });
      continentBlockData.forEach((b) => {
        const layout = continentLayoutMap[b.continent];
        b.rowWidths = layout.rows.map(getRowWidth);
        b.blockWidth = Math.max(...b.rowWidths);
      });
    }

    // Compute the tallest single shape height across all items (used as row-height reference)
    const maxSingleShapeH = shapeItems.reduce(
      (max, item) => Math.max(max, item.shapeH),
      0,
    );
    const hasTwoRowContinent = sortedContinentEntries.some(
      (g) => continentLayoutMap[g.continent].isTwoRow,
    );
    // Total block height for two-row continents; single-row continents center within this
    const twoRowBlockH = hasTwoRowContinent
      ? 2 * maxSingleShapeH + rowGap
      : maxSingleShapeH;

    // Expand height4 to fit the two-row layout + text if needed
    height4 = Math.max(height4, twoRowBlockH + textHeight + 20);

    // Position items, centered horizontally
    const scaledTotalBlockWidth =
      continentBlockData.reduce((s, b) => s + b.blockWidth, 0) +
      numContinentGaps * continentShapeGap;
    let cursorX = (innerWidth - scaledTotalBlockWidth) / 2;

    sortedContinentEntries.forEach((group, gi) => {
      const layout = continentLayoutMap[group.continent];
      const blockData = continentBlockData[gi];

      layout.rows.forEach((row, rowIndex) => {
        const rowShapeH = row.reduce(
          (max, d) => Math.max(max, shapeItemByCountry[d.country]?.shapeH || 0),
          0,
        );

        // Y: two-row continents stack rows top-to-bottom; single-row continents center vertically
        const rowY = layout.isTwoRow
          ? sectionTopY +
            twoRowTopPadding +
            rowIndex * (maxSingleShapeH + rowGap)
          : sectionTopY +
            (hasTwoRowContinent
              ? (twoRowBlockH - rowShapeH) / 2
              : Math.max(0, (height4 - rowShapeH - textHeight) / 2));

        // Row 0: centered; Row 1 (second row in two-row layout): right-aligned
        const rowWidth = blockData.rowWidths[rowIndex];
        let rowCursorX =
          layout.isTwoRow && rowIndex === 1
            ? cursorX + blockData.blockWidth - rowWidth
            : cursorX + (blockData.blockWidth - rowWidth) / 2;

        row.forEach((d) => {
          const item = shapeItemByCountry[d.country];
          if (!item) return;
          // When no two-row layout is active, center each item individually (matching original behavior)
          // When two-row layout is active, center each item within its row height
          const itemY = hasTwoRowContinent
            ? rowY + Math.max(0, (maxSingleShapeH - item.shapeH) / 2)
            : sectionTopY +
              Math.max(0, (height4 - item.shapeH - textHeight) / 2);
          countryShapePositions[d.country] = {
            x: rowCursorX + item.shapeW / 2,
            y: itemY,
            shapeW: item.shapeW,
            shapeH: item.shapeH,
          };
          rowCursorX += item.shapeW + shapeGapX;
        });
      });

      cursorX += blockData.blockWidth;
      if (gi < sortedContinentEntries.length - 1) cursorX += continentShapeGap;
    });
  }

  // Compute continent label positions (centered horizontally under each continent's country shapes)
  const continentLabelPositions = [];
  if (countriesCentricData && Object.keys(countryShapePositions).length > 0) {
    // Group countries by continent
    const continentCountries = {};
    countriesCentricData.forEach((d) => {
      if (!continentCountries[d.continent]) {
        continentCountries[d.continent] = [];
      }
      if (countryShapePositions[d.country]) {
        continentCountries[d.continent].push(d.country);
      }
    });

    Object.entries(continentCountries).forEach(([continent, countries]) => {
      if (countries.length === 0) return;
      const xs = countries.map((c) => countryShapePositions[c].x);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      continentLabelPositions.push({
        continent,
        centerX: (minX + maxX) / 2,
      });
    });
  }

  // Recalculate total height after potential height4 adjustment
  height = height1 + height2 + height3 + height4 + height5;
  innerHeight = height - margin.top - margin.bottom;

  // Sort firms by barycenter (weighted average x of connected countries) to minimize line crossings
  const sortedFirmsData = [...firmsData];
  if (countriesData && Object.keys(countryPositions).length > 0) {
    const firmBarycenter = {};
    sortedFirmsData.forEach((firm) => {
      const connections = countriesData.filter(
        (d) => d.newFirm === firm.newFirm,
      );
      if (connections.length > 0) {
        const weightedSum = connections.reduce((sum, d) => {
          const pos = countryPositions[d.country];
          return sum + (pos ? pos.x * d.movesNewFirmCountry : 0);
        }, 0);
        const totalWeight = connections.reduce(
          (sum, d) => sum + d.movesNewFirmCountry,
          0,
        );
        firmBarycenter[firm.newFirm] =
          totalWeight > 0 ? weightedSum / totalWeight : 0;
      } else {
        firmBarycenter[firm.newFirm] = 0;
      }
    });
    sortedFirmsData.sort(
      (a, b) => firmBarycenter[a.newFirm] - firmBarycenter[b.newFirm],
    );
  }

  // compute per-firm diamond widths and cumulative x positions (tightly packed, centered)
  const firmWidths = sortedFirmsData.map((d) => {
    const size = numberMovesScale(d.totalMoves);
    return size * Math.sqrt(2); // rotated square width
  });
  const totalGroupWidth = firmWidths.reduce((sum, w) => sum + w, 0);
  const groupStartX = (innerWidth - totalGroupWidth) / 2;

  // build a map from firm name to its center-x position
  const firmCenterX = {};
  let cumX = groupStartX;
  sortedFirmsData.forEach((d, i) => {
    firmCenterX[d.newFirm] = cumX + firmWidths[i] / 2;
    cumX += firmWidths[i];
  });
  // build a map from firm name to its diamond size for quick lookup when drawing lines
  const firmDiamondSize = {};
  sortedFirmsData.forEach((d) => {
    firmDiamondSize[d.newFirm] = numberMovesScale(d.totalMoves);
  });

  // Extract unique colors for gradient definitions
  const uniqueColors = Array.from(
    new Set(countriesData.map((d) => d.colorKey)),
  ).map((colorKey) => ({
    key: colorKey,
    cssVar: `var(--color-vis-${colorKey})`,
  }));

  const hoverCountry = (event, d) => {
    const container = event.currentTarget.closest(".vis-content");
    const rect = container.getBoundingClientRect();

    // Raise all paths connected to this country
    const svgEl = event.currentTarget.closest("svg");
    if (svgEl) {
      svgEl
        .querySelectorAll(
          `#lines-new-firms-to-countries-group path[data-country="${d.country}"]`,
        )
        .forEach((p) => p.parentNode.appendChild(p));
    }

    // Build per-city move counts for this country from the dedicated dataset
    const citiesInCountry = (cityMovesData || [])
      .filter((c) => c.country === d.country)
      .map((c) => `${c.city} (${c.moves})`)
      .join("; ");

    setHoveredObject({
      hoverType: "country",
      country: d.country,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      tooltipContent: [
        { label: "Country", value: d.country },
        {
          label: "Firms involved",
          value: countriesData
            .filter((c) => c.country === d.country)
            .map((c) => c.newFirm)
            .join(", "),
        },
        {
          label: "Number of key executive moves*",
          value: d.movesNewFirmCountry,
        },
        {
          label: "Cities",
          value: citiesInCountry || "N/A",
        },
      ],
    });
  };

  return html`<div class="vis-container">
    <p class="vis-title">${config?.vis2?.title || "Title for Vis 2"}</p>
    <p class="vis-subtitle">
      ${config?.vis2?.subtitle || "Subtitle for Vis 2"}
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
          ${uniqueColors.map((colorObj) => {
            return html`
              <linearGradient
                id="gradient-light-${colorObj.key}"
                x1="0"
                y1="${height1}"
                x2="0"
                y2="${height1 + height2}"
                gradientUnits="userSpaceOnUse"
              >
                <stop
                  stop-color="${`var(--color-vis-${colorObj.key}-light-gradient-start)`}"
                />
                <stop
                  offset="1"
                  stop-color="${`var(--color-vis-${colorObj.key}-light-gradient-end)`}"
                />
              </linearGradient>
            `;
          })}
        </defs>

        <g transform="translate(${margin.left}, ${margin.top})">
          <g>
            <line
              x1="0"
              y1="${height1}"
              x2="${sortedFirmsData.length > 0
                ? firmCenterX[sortedFirmsData[0].newFirm] -
                  firmWidths[0] / 2 -
                  2
                : width}"
              y2="${height1}"
              stroke="var(--color-vis-neutral-grey2)"
            />
            <line
              x1="${sortedFirmsData.length > 0
                ? firmCenterX[
                    sortedFirmsData[sortedFirmsData.length - 1].newFirm
                  ] +
                  firmWidths[sortedFirmsData.length - 1] / 2 +
                  2
                : width}"
              y1="${height1}"
              x2="${sortedFirmsData.length > 0
                ? firmCenterX[
                    sortedFirmsData[sortedFirmsData.length - 1].newFirm
                  ] +
                  firmWidths[sortedFirmsData.length - 1] / 2 +
                  20
                : width}"
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
          <g id="lines-new-firms-to-countries-group">
            ${countriesData && countriesData.length > 0
              ? countriesData.map((d) => {
                  const firmX = firmCenterX[d.newFirm];
                  const firmY = height1 + firmDiamondSize[d.newFirm] / 2 + 4; // start from bottom corner of diamond

                  const pos = countryPositions[d.country];

                  // const dx = pos.centerX - firmX;
                  const dy = pos.topY - firmY;
                  const cp1x = firmX + curveCpSkew - curveCpSpread;
                  const cp1y = firmY + dy * curveCpOffset;
                  const cp2x = pos.centerX + curveCpSkew + curveCpSpread;
                  const cp2y = pos.topY - dy * curveCpOffset;

                  // check if hovered object is a different new company to determine if this line should be faded
                  const isFaded = hoveredObject
                    ? (hoveredObject.hoverType === "newCompany" &&
                        hoveredObject.newCompany !== d.newFirm) ||
                      (hoveredObject.hoverType === "newCompanyCountryLine" &&
                        (hoveredObject.newCompany !== d.newFirm ||
                          hoveredObject.country !== d.country)) ||
                      (hoveredObject.hoverType === "country" &&
                        hoveredObject.country !== d.country)
                    : false;

                  return html`
                    <path
                      d="M ${firmX},${firmY} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${pos.centerX},${pos.topY}"
                      stroke="${isFaded
                        ? `url(#gradient-light-${d.colorKey})`
                        : `url(#gradient-${d.colorKey})`}"
                      stroke-width="2"
                      fill="none"
                      data-new-firm="${d.newFirm}"
                      data-country="${d.country}"
                      style="transition: opacity 0.3s;cursor: pointer;"
                      onmouseenter=${(event) => {
                        // Raise hovered path to render on top
                        const pathEl = event.currentTarget;
                        pathEl.parentNode.appendChild(pathEl);
                        const container =
                          event.currentTarget.closest(".vis-content");
                        const rect = container.getBoundingClientRect();

                        setHoveredObject({
                          hoverType: "newCompanyCountryLine",
                          newCompany: d.newFirm,
                          country: d.country,
                          x: event.clientX - rect.left,
                          y: event.clientY - rect.top,
                          tooltipContent: [
                            { label: "New firm", value: d.newFirm },
                            { label: "Country", value: d.country },
                            {
                              label: "Number of key executive moves*",
                              value: d.movesNewFirmCountry,
                            },
                            {
                              label: "Cities",
                              value: d.cities.join(", "),
                            },
                          ],
                        });
                      }}
                      onmouseleave=${() => setHoveredObject(null)}
                    />
                  `;
                })
              : null}
          </g>

          <g id="new-firms-group">
            ${sortedFirmsData.map((d) => {
              const x = firmCenterX[d.newFirm];
              const y = height1;

              const isFaded = hoveredObject
                ? (hoveredObject.hoverType === "newCompany" &&
                    hoveredObject.newCompany !== d.newFirm) ||
                  (hoveredObject.hoverType === "newCompanyCountryLine" &&
                    hoveredObject.newCompany !== d.newFirm) ||
                  (hoveredObject.hoverType === "country" &&
                    !d.countries.includes(hoveredObject.country))
                : false;

              return html`
                <g
                  transform="translate(${x}, ${y})"
                  class="new-company-group"
                  onmouseenter=${(event) => {
                    // Raise all paths connected to this firm
                    const svgEl = event.currentTarget.closest("svg");
                    if (svgEl) {
                      svgEl
                        .querySelectorAll(
                          `#lines-new-firms-to-countries-group path[data-new-firm="${d.newFirm}"]`,
                        )
                        .forEach((p) => p.parentNode.appendChild(p));
                    }
                    const container =
                      event.currentTarget.closest(".vis-content");
                    const rect = container.getBoundingClientRect();

                    setHoveredObject({
                      hoverType: "newCompany",
                      newCompany: d.newFirm,
                      countries: d.countries,
                      x: event.clientX - rect.left,
                      y: event.clientY - rect.top,
                      tooltipContent: [
                        { label: "New firm", value: d.newFirm },

                        {
                          label: "Number of key executive moves*",
                          value: d.totalMoves,
                        },
                        {
                          label: "Countries after move",
                          value: d.countries.join(", "),
                        },
                      ],
                    });
                  }}
                  onmouseleave=${() => setHoveredObject(null)}
                  opacity="${isFaded ? 0.2 : 1}"
                >
                  <${CompanyWithDiamondRotated}
                    name=${d.newFirm}
                    number=${d.totalMoves}
                    color="${null}"
                  />
                </g>
              `;
            })}
          </g>
          <g id="countries-group">
            ${countriesCentricData && countriesCentricData.length > 0
              ? countriesCentricData.map((d) => {
                  const pos = countryPositions[d.country];

                  // check if hovered object is a different country to determine if this country's diamond should be faded
                  const isFaded = hoveredObject
                    ? (hoveredObject.hoverType === "newCompany" &&
                        !countriesData.some(
                          (c) =>
                            c.newFirm === hoveredObject.newCompany &&
                            c.country === d.country,
                        )) ||
                      (hoveredObject.hoverType === "newCompanyCountryLine" &&
                        hoveredObject.country !== d.country) ||
                      (hoveredObject.hoverType === "country" &&
                        hoveredObject.country !== d.country)
                    : false;

                  return html`
                    <g
                      transform="translate(${pos.centerX}, ${pos.centerY})"
                      class="new-country-group ${d.country}"
                      opacity="${isFaded ? 0.2 : 1}"
                      style="transition: opacity 0.3s;cursor: pointer;"
                      onmouseenter=${(event) => hoverCountry(event, d)}
                      onmouseleave=${() => setHoveredObject(null)}
                    >
                      <${Diamond}
                        number=${d.movesNewFirmCountry}
                        color="byContinent"
                        colorContinent=${d.continent}
                      />
                    </g>
                  `;
                })
              : null}
          </g>

          <g id="country-shapes-group">
            ${countriesCentricData && countriesCentricData.length > 0
              ? countriesCentricData.map((d) => {
                  const shapePos = countryShapePositions[d.country];
                  if (!shapePos) return null;
                  const continentColor =
                    colorMappingByContinent[d.continent] || "neutral-grey2";

                  // check if hovered object is a different country to determine if this shape should be faded
                  const isFaded = hoveredObject
                    ? (hoveredObject.hoverType === "newCompany" &&
                        !countriesData.some(
                          (c) =>
                            c.newFirm === hoveredObject.newCompany &&
                            c.country === d.country,
                        )) ||
                      (hoveredObject.hoverType === "newCompanyCountryLine" &&
                        hoveredObject.country !== d.country) ||
                      (hoveredObject.hoverType === "country" &&
                        hoveredObject.country !== d.country)
                    : false;

                  return html`<g
                    transform="translate(${shapePos.x}, ${shapePos.y})"
                    opacity="${isFaded ? 0.2 : 1}"
                    style="transition: opacity 0.3s;cursor: pointer;"
                  >
                    <${Country}
                      countryName=${d.country}
                      color=${continentColor}
                      width=${shapePos.shapeW}
                      height=${shapePos.shapeH}
                    />
                  </g>`;
                })
              : null}
          </g>
          <g id="diamond-to-country-lines-group">
            ${countriesCentricData && countriesCentricData.length > 0
              ? countriesCentricData.map((d) => {
                  const shapePos = countryShapePositions[d.country];
                  if (!shapePos) return null;
                  const diamondPos = countryPositions[d.country];
                  const diamondSize = numberMovesScale(d.movesNewFirmCountry);
                  const diamondBottomY =
                    diamondPos.centerY + (diamondSize * Math.sqrt(2)) / 2;
                  const miniDiamondCenterY = shapePos.y + shapePos.shapeH / 2;
                  const continentColor =
                    colorMappingByContinent[d.continent] || "neutral-grey2";

                  // check if hovered object is a different country to determine if this line should be faded
                  const isFaded = hoveredObject
                    ? (hoveredObject.hoverType === "newCompany" &&
                        !countriesData.some(
                          (c) =>
                            c.newFirm === hoveredObject.newCompany &&
                            c.country === d.country,
                        )) ||
                      (hoveredObject.hoverType === "newCompanyCountryLine" &&
                        hoveredObject.country !== d.country) ||
                      (hoveredObject.hoverType === "country" &&
                        hoveredObject.country !== d.country)
                    : false;

                  const countryShapeConfig = countryShapeMapping[d.country];
                  const parsedSvg = svgCityData[d.country];
                  if (
                    countryShapeConfig &&
                    countryShapeConfig.showCities &&
                    parsedSvg &&
                    parsedSvg.cities
                  ) {
                    const shapePos = countryShapePositions[d.country];
                    if (!shapePos) return null;
                    const svgViewBox = parsedSvg.viewBox;
                    const svgCityPositions = parsedSvg.cities;

                    // Get cities for this country from the data
                    const citiesInCountry = (cityMovesData || []).filter(
                      (c) => c.country === d.country,
                    );

                    return citiesInCountry.map((cityData) => {
                      const svgPos = svgCityPositions[cityData.city];
                      if (!svgPos) return null; // city not in SVG

                      // Transform SVG coordinates to vis coordinates
                      // The <image> in Country.js is placed at x="-width/2", y=0 relative to the group at (shapePos.x, shapePos.y)
                      const cityVisX =
                        shapePos.x -
                        shapePos.shapeW / 2 +
                        (svgPos.x / svgViewBox.width) * shapePos.shapeW;
                      const cityVisY =
                        shapePos.y +
                        (svgPos.y / svgViewBox.height) * shapePos.shapeH;

                      // Line from diamond bottom to the city position
                      const startX = diamondPos.centerX;
                      const startY = diamondBottomY;
                      const endX = cityVisX;
                      const endY = cityVisY;
                      const dy = endY - startY;

                      const cp1x = startX;
                      const cp1y = startY + dy * curveCpOffset;
                      const cp2x = endX;
                      const cp2y = endY - dy * curveCpOffset;

                      return html`
                        <path
                          d="M ${startX},${startY} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${endX},${endY}"
                          stroke="${isFaded
                            ? `url(#gradient-light-${continentColor})`
                            : `url(#gradient-${continentColor})`}"
                          stroke-width="2"
                          fill="none"
                          style="transition: opacity 0.3s;cursor: pointer;"
                        />
                      `;
                    });
                  }

                  return html`
                    <path
                      d="M ${diamondPos.centerX},${diamondBottomY} C ${diamondPos.centerX +
                      curveCpSkew -
                      curveCpSpread},${diamondBottomY +
                      (miniDiamondCenterY - diamondBottomY) *
                        curveCpOffset} ${shapePos.x +
                      curveCpSkew +
                      curveCpSpread},${miniDiamondCenterY -
                      (miniDiamondCenterY - diamondBottomY) *
                        curveCpOffset} ${shapePos.x},${miniDiamondCenterY}"
                      stroke="var(--color-vis-${continentColor})"
                      stroke-width="2"
                      fill="none"
                      opacity="${isFaded ? 0.2 : 1}"
                      style="transition: opacity 0.3s;cursor: pointer;"
                      onmouseenter=${(event) => hoverCountry(event, d)}
                      onmouseleave=${() => setHoveredObject(null)}
                    />
                  `;
                })
              : null}
          </g>
          <g id="continent-labels-group">
            ${continentLabelPositions.map((cl) => {
              const labelY =
                height1 + height2 + height3 + height4 + height5 / 2;
              return html`
                <text
                  x="${cl.centerX}"
                  y="${labelY}"
                  text-anchor="middle"
                  dominant-baseline="central"
                  class="continent-label-text"
                >
                  ${cl.continent}
                </text>
              `;
            })}
          </g>
        </g>
      </svg>
      <${Tooltip} hoveredItem=${hoveredObject} />
    </div>
    <p class="vis-source">${config?.vis2?.source || "Source for Vis 2"}</p>
  </div>`;
}
