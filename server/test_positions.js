
const CommonUtils = require('vedic-astrology-api/lib/utils/common');
const d = CommonUtils.createDate(2025, 12, 13, 22, 8, 5.5);
try {
    const res = CommonUtils.calculatePlanetaryPositions(d, 28.6139, 77.2090);
    console.log(JSON.stringify(res.positions, null, 2));
} catch (e) { console.log(e); }
