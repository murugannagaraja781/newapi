
const { BirthChartGenerator } = require('vedic-astrology-api/lib/utils/birthchart');
const CommonUtils = require('vedic-astrology-api/lib/utils/common');

const date = CommonUtils.createDate(2025, 12, 13, 22, 18, 5.5);
const { positions, ayanamsa } = CommonUtils.calculatePlanetaryPositions(date, 13.0827, 80.2707);
const ascendant = CommonUtils.calculateAscendant(date, 13.0827, 80.2707);
const generator = new BirthChartGenerator();
const chart = generator.generateBirthChart(positions, ascendant);

console.log('House 1 keys:', Object.keys(chart.houses[1]));
console.log('House 1 data:', JSON.stringify(chart.houses[1], null, 2));
