import { scaleLinear } from "./lib.js";

let local = null;
if (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
) {
  local = true;
} else {
  local = false;
}
export const isLocal = local; // set to false to load from GitHub repo instead of local files

export const REPO_BASE_URL =
  "https://raw.githubusercontent.com/parabolestudio/impcompetitorintelligence/refs/heads/main/";

// see color variable definitions in styles.css for actual color values
// 15+ -> black
// 13-14 -> pink
// 11-12 -> purple
// 9-10 -> orange
// 7-8 -> green
// 5-6 -> blue
// 4 -> dark grey
// 3 -> light grey
export const colorMappingByNumber = {
  1: "neutral-grey2",
  2: "neutral-grey2",
  3: "neutral-grey2",
  4: "neutral-grey1",
  5: "secondary-teal",
  6: "secondary-teal",
  7: "secondary-green",
  8: "secondary-green",
  9: "secondary-orange",
  10: "secondary-orange",
  11: "secondary-purple",
  12: "secondary-purple",
  13: "secondary-pink",
  14: "secondary-pink",
  15: "main-dark-blue",
  16: "main-dark-blue",
  17: "main-dark-blue",
  18: "main-dark-blue",
  19: "main-dark-blue",
};
// TODO: make domain and range dynamic based on data
export function numberMovesScale(number) {
  const scaleSize = scaleLinear().domain([3, 16]).range([17, 38]).clamp(true);
  const size = scaleSize(number);
  return size;
}

export const colorMappingByContinent = {
  Americas: "secondary-pink",
  Europe: "secondary-teal",
  Asia: "secondary-green",
  Africa: "secondary-purple",
  Oceania: "secondary-orange",
};

export const logoMapping = {
  "Apollo Global Management": "Apollo_Global_Management.png",
  "Apollo Global Management, Inc.": "Apollo_Global_Management.png",
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
  "EQT Group": "EQT.png",
  "HarbourVest Partners": "HarbourVest_Partners.png",
  ICG: "ICG.png",
  "IFM Investors": "IFM_Investors.png",
  KKR: "Kohlberg_Kravis_Roberts.png",
  "Oaktree Capital Management, L.P.": "Oaktree.png",
  "Partners Group": "Partners_Group_Icon 2.png",
  PGIM: "PGIM.png",
  TPG: "TPG.png",
  "Warburg Pincus LLC": "Warburg_Pincus.png",
};

export const countryShapeMapping = {
  USA: {
    shapeFile: "usaLow_1_withCities.svg",
    countryLabel: "USA",
    aspectRatio: 222 / 155, // width / height from viewBox
    showCities: true,
  },
  UK: {
    shapeFile: "unitedKingdomLow_1_withCities.svg",
    countryLabel: "UK",
    aspectRatio: 122 / 204,
    showCities: true,
  },
  Germany: {
    shapeFile: "germanyLow 1.svg",
    countryLabel: "Germany",
    aspectRatio: 60 / 81,
    showCities: false,
  },
  Belgium: {
    shapeFile: "belgiumLow 1.svg",
    countryLabel: "Belgium",
    aspectRatio: 44 / 36,
    showCities: false,
  },
  Netherlands: {
    shapeFile: "netherlandsLow 1.svg",
    countryLabel: "Netherlands",
    aspectRatio: 35 / 41,
    showCities: false,
  },
  Sweden: {
    shapeFile: "swedenLow 1.svg",
    countryLabel: "Sweden",
    aspectRatio: 25 / 54,
    showCities: false,
  },
  India: {
    shapeFile: "indiaLow 1.svg",
    countryLabel: "India",
    aspectRatio: 65 / 73,
    showCities: false,
  },
  Singapore: {
    shapeFile: "singaporeLow 1.svg",
    countryLabel: "Singapore",
    aspectRatio: 79 / 50,
    showCities: false,
  },
  Australia: {
    shapeFile: "australiaLow 1.svg",
    countryLabel: "Australia",
    aspectRatio: 99 / 93,
    showCities: false,
  },
  Switzerland: {
    shapeFile: "switzerlandLow 1.svg",
    countryLabel: "Switzerland",
    aspectRatio: 77 / 50,
    showCities: false,
  },
  Luxembourg: {
    shapeFile: "luxembourgLow 1.svg",
    countryLabel: "Luxembourg",
    aspectRatio: 25 / 36,
    showCities: false,
  },
  Brazil: {
    shapeFile: "Brazil.svg",
    countryLabel: "Brazil",
    aspectRatio: 125 / 130,
    showCities: false,
  },
  Spain: {
    shapeFile: "Spain.svg",
    countryLabel: "Spain",
    aspectRatio: 130 / 97,
    showCities: false,
  },
  Canada: {
    shapeFile: "Canada.svg",
    countryLabel: "Canada",
    aspectRatio: 115 / 150,
    showCities: false,
  },
  "South Korea": {
    shapeFile: "South Korea.svg",
    countryLabel: "South Korea",
    aspectRatio: 85 / 136,
    showCities: false,
  },
  "New Zealand": {
    shapeFile: "New Zealand.svg",
    countryLabel: "New Zealand",
    aspectRatio: 95 / 128,
    showCities: false,
  },
  Japan: {
    shapeFile: "Japan.svg",
    countryLabel: "Japan",
    aspectRatio: 103 / 115,
    showCities: false,
  },
  SAR: {
    shapeFile: "SAR.svg",
    countryLabel: "SAR (Hong Kong and Macau)",
    aspectRatio: 126 / 63,
    showCities: false,
  },
  France: {
    shapeFile: "France.svg",
    countryLabel: "France",
    aspectRatio: 133 / 131,
    showCities: false,
  },
};
