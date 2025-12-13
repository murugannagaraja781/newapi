
const { BirthChartGenerator } = require('vedic-astrology-api/lib/utils/birthchart');
const CommonUtils = require('vedic-astrology-api/lib/utils/common');

console.log('CommonUtils methods:', Object.keys(CommonUtils));

try {
    const gen = new BirthChartGenerator();
    console.log('Generator methods:', Object.getPrototypeOf(gen));
} catch (e) { console.log(e); }
