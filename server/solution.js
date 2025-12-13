
const { BirthChartGenerator } = require('vedic-astrology-api/lib/utils/birthchart');
const CommonUtils = require('vedic-astrology-api/lib/utils/common');

// Inputs
const dateStr = "2025-12-13";
const timeStr = "22:08:12";
const lat = 13.0827; // Chennai
const lng = 80.2707;
const tz = 5.5;

function decimalToDMS(decimal) {
    if (isNaN(decimal)) return "0° 0' 0\"";
    const d = Math.floor(decimal);
    const mDec = (decimal - d) * 60;
    const m = Math.floor(mDec);
    const s = Math.round((mDec - m) * 60);
    return `${d}° ${m}' ${s}"`;
}

// Mappings
const TITHI_NAMES = [
    "Prathama", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Purnima",
    "Prathama", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Amavasya"
];
const YOGA_NAMES = [
    "Vishkambha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda", "Sukarma", "Dhriti", "Shula", "Ganda",
    "Vriddhi", "Dhruva", "Vyaghata", "Harshana", "Vajra", "Siddhi", "Vyatipata", "Variyan", "Parigha", "Shiva",
    "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma", "Indra", "Vaidhriti"
];
const KARANA_NAMES = [
    "Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti", "Shakuni", "Chatushpada", "Naga", "Kimstughna"
];

function getPanchangam(positions, dateObj) {
    const moon = positions['Moon'].longitude;
    const sun = positions['Sun'].longitude;

    // Tithi
    let diff = moon - sun;
    if (diff < 0) diff += 360;
    const tithiVal = diff / 12; // 0-29.99
    const tithiIdx = Math.floor(tithiVal);
    const paksha = tithiIdx < 15 ? "Shukla Paksha" : "Krishna Paksha";
    const tName = TITHI_NAMES[tithiIdx];

    // Nakshatra (Use Util)
    const nakData = CommonUtils.getNakshatraFromLongitude(moon);

    // Yoga
    let yogaSum = (moon + sun) % 360;
    const yogaIdx = Math.floor(yogaSum / (360 / 27));
    const yogaName = YOGA_NAMES[yogaIdx] || YOGA_NAMES[0];

    // Karana
    const karanaIdxTotal = Math.floor(diff / 6); // 0-59
    let karanaName = "";
    const k = karanaIdxTotal + 1; // 1-60
    if (k === 1) karanaName = "Kimstughna";
    else if (k >= 58) {
        if (k === 58) karanaName = "Shakuni";
        else if (k === 59) karanaName = "Chatushpada";
        else if (k === 60) karanaName = "Naga";
    } else {
        const m = (k - 2) % 7;
        karanaName = KARANA_NAMES[m];
    }

    // Vara
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const vara = days[dateObj.getDay()];

    return {
        tithi: `${paksha} ${tName}`,
        nakshatra: nakData.name,
        yoga: yogaName,
        karana: karanaName,
        vara: vara
    };
}

const year = 2025;
const month = 12;
const day = 13;
const hour = 22;
const minute = 8;

const birthDate = CommonUtils.createDate(year, month, day, hour, minute, tz);

// 1. Calculations
const { positions, ayanamsa } = CommonUtils.calculatePlanetaryPositions(birthDate, lat, lng);
const ascendant = CommonUtils.calculateAscendant(birthDate, lat, lng);

const generator = new BirthChartGenerator();
const chartData = generator.generateBirthChart(positions, ascendant);
const { houses, planets } = chartData;

// 2. Build Response
const response = {};

// Birth Data
response.birthData = {
    date: dateStr,
    time: timeStr,
    latitude: lat,
    longitude: lng,
    timezone: tz
};

// Houses logic
response.houses = {};
Object.keys(houses).forEach(h => {
    response.houses[h] = {
        sign: houses[h].sign,
        lord: houses[h].lord,
        planets: houses[h].planets
    };
});

// Planets logic (House -> Name)
response.planets = {};
Object.keys(houses).forEach(h => {
    const pList = houses[h].planets.filter(p => p !== 'Lagna');
    if (pList.length > 0) response.planets[h] = pList;
});

// Raw Planets
response.rawPlanets = {};
Object.keys(planets).forEach(k => {
    const p = planets[k];

    // Fallback for missing 'fullDegree' in 'p' if needed
    const longitude = p.fullDegree !== undefined ? p.fullDegree : positions[k].longitude;
    const degreeInSign = longitude % 30;

    // Nakshatra fallback if 'p' doesn't have it (should have)
    const nak = p.nakshatra || "";
    const nakLord = p.nakshatraLord || "";

    response.rawPlanets[k] = {
        sign: p.sign,
        house: p.house,
        degree: String(p.normDegree !== undefined ? p.normDegree : degreeInSign),
        degreeFormatted: decimalToDMS(p.normDegree !== undefined ? p.normDegree : degreeInSign),
        longitude: longitude,
        nakshatra: nak,
        nakshatraLord: nakLord,
        dignity: p.dignity || { english: "Normal", tamil: "சாதாரணம்" },
        isRetrograde: p.isRetrograde || false
    };
});

// Positions (Lat/Long/Speed)
response.positions = {};
// Filter keys to only include real planets if needed, but rule says "Compute positions... longitude & latitude from API... speed".
// positions object basically has them.
Object.keys(positions).forEach(k => {
    response.positions[k] = {
        longitude: positions[k].longitude,
        latitude: positions[k].latitude,
        speed: positions[k].speed
    };
});

// Ascendant
response.ascendant = ascendant;
response.ayanamsa = ayanamsa;

// Moon details
const moonP = planets['Moon'] || {};
// We can use the nakshatra util to get detailed name if needed
const moonLong = positions['Moon'].longitude;
const moonNak = CommonUtils.getNakshatraFromLongitude(moonLong); // Ensure logic is consistent

response.moonSign = {
    name: moonP.sign,
    lord: moonP.lord,
};
response.moonNakshatra = {
    name: moonNak.name,
    lord: moonNak.lord,
    pada: moonNak.pada
};

// Panchangam
response.panchangam = getPanchangam(positions, new Date(2025, 11, 13, 22, 8, 12));

console.log(JSON.stringify(response, null, 2));
