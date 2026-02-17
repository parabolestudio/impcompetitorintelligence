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
  const scaleSize = d3
    .scaleLinear()
    .domain([3, 16])
    .range([17, 38])
    .clamp(true);
  const size = scaleSize(number);
  return size;
}

export const colorMappingByContinent = {
  "North America": "secondary-pink",
  Europe: "secondary-teal",
  Asia: "secondary-green",
  "South America": "secondary-blue",
  Africa: "secondary-purple",
  Oceania: "secondary-orange",
};

export const logoMapping = {
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

export const countryShapeMapping = {
  USA: {
    shapeFile: "usaLow 1.svg",
    countryLabel: "USA",
    shapeWidth: 222,
    shapeHeight: 155,
  },
  UK: {
    shapeFile: "unitedKingdomLow 1.svg",
    countryLabel: "UK",
    shapeWidth: 122,
    shapeHeight: 204,
  },
  Germany: {
    shapeFile: "germanyLow 1.svg",
    countryLabel: "Germany",
    shapeWidth: 60,
    shapeHeight: 81,
  },
  Belgium: {
    shapeFile: "belgiumLow 1.svg",
    countryLabel: "Belgium",
    shapeWidth: 44,
    shapeHeight: 36,
  },
  Netherlands: {
    shapeFile: "netherlandsLow 1.svg",
    countryLabel: "Netherlands",
    shapeWidth: 35,
    shapeHeight: 41,
  },
  Sweden: {
    shapeFile: "swedenLow 1.svg",
    countryLabel: "Sweden",
    shapeWidth: 25,
    shapeHeight: 54,
  },
  India: {
    shapeFile: "indiaLow 1.svg",
    countryLabel: "India",
    shapeWidth: 65,
    shapeHeight: 73,
  },
  Singapore: {
    shapeFile: "singaporeLow 1.svg",
    countryLabel: "Singapore",
    shapeWidth: 79,
    shapeHeight: 50,
  },
  Australia: {
    shapeFile: "australiaLow 1.svg",
    countryLabel: "Australia",
    shapeWidth: 99,
    shapeHeight: 93,
  },
  Switzerland: {
    shapeFile: "switzerlandLow 1.svg",
    countryLabel: "Switzerland",
    shapeWidth: 77,
    shapeHeight: 50,
  },
};
