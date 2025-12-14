// server/controllers/chartController.js
const { BirthChartGenerator } = require('vedic-astrology-api/lib/utils/birthchart');
const CommonUtils = require('vedic-astrology-api/lib/utils/common');
const { ImprovedNavamsaChart } = require('vedic-astrology-api/lib/utils/navamsachart');

// Sign name mapping: Vedic Sanskrit → English
const SIGN_MAP = {
    'Mesha': 'Aries',
    'Vrishabha': 'Taurus',
    'Mithuna': 'Gemini',
    'Karka': 'Cancer',
    'Simha': 'Leo',
    'Kanya': 'Virgo',
    'Tula': 'Libra',
    'Vrishchika': 'Scorpio',
    'Dhanu': 'Sagittarius',
    'Makara': 'Capricorn',
    'Kumbha': 'Aquarius',
    'Meena': 'Pisces'
};

const SIGN_TAMIL_MAP = {
    'Mesha': 'மேஷம்',
    'Vrishabha': 'ரிஷபம்',
    'Mithuna': 'மிதுனம்',
    'Karka': 'கடகம்',
    'Simha': 'சிம்மம்',
    'Kanya': 'கன்னி',
    'Tula': 'துலாம்',
    'Vrishchika': 'விருச்சிகம்',
    'Dhanu': 'தனுசு',
    'Makara': 'மகரம்',
    'Kumbha': 'கும்பம்',
    'Meena': 'மீனம்'
};

function normalizeSignName(vedic) {
    return SIGN_MAP[vedic] || vedic;
}

function getSignTamil(vedic) {
    return SIGN_TAMIL_MAP[vedic] || vedic;
}


// Helpers
function decimalToDMS(decimal) {
    if (isNaN(decimal)) return "0° 0' 0\"";
    const d = Math.floor(decimal);
    const mDec = (decimal - d) * 60;
    const m = Math.floor(mDec);
    const s = Math.round((mDec - m) * 60);
    return `${d}° ${m} ' ${s}"`;
}

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

// Dasha Calculation (Vimshottari Dasha - Precise)
function calculateDasha(positions, birthDate) {
    try {
        const moonLong = positions['Moon'].longitude;

        // Nakshatra calculation (27 nakshatras, each 13.333 degrees)
        const nakshatraSize = 13.333333;
        const nakshatraIndex = Math.floor(moonLong / nakshatraSize); // 0-26
        const degreeInNakshatra = moonLong % nakshatraSize;

        // Vimshottari Dasha lords in order (starting from Ashwini)
        const dashaLords = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];

        // Dasha years (total 120 years cycle)
        const dashaYears = {
            'Ketu': 7,
            'Venus': 20,
            'Sun': 6,
            'Moon': 10,
            'Mars': 7,
            'Rahu': 18,
            'Jupiter': 16,
            'Saturn': 19,
            'Mercury': 17
        };

        // Starting Dasha lord based on nakshatra
        const startingDashaIndex = nakshatraIndex % 9;
        const startingLord = dashaLords[startingDashaIndex];
        const totalDashaYears = dashaYears[startingLord];

        // Calculate remaining years in current dasha (precise calculation)
        const percentageInNakshatra = degreeInNakshatra / nakshatraSize;
        const yearsElapsedInDasha = totalDashaYears * percentageInNakshatra;
        const remainingYearsInDasha = totalDashaYears - yearsElapsedInDasha;

        // Build dasha sequence
        const dashaSequence = [];
        let currentIndex = startingDashaIndex;
        let currentDate = new Date(birthDate);
        let totalYears = 0;

        // Add current dasha (remaining portion)
        dashaSequence.push({
            lord: startingLord,
            startYear: 0,
            endYear: remainingYearsInDasha,
            startDate: new Date(currentDate),
            endDate: new Date(currentDate.getTime() + remainingYearsInDasha * 365.25 * 24 * 60 * 60 * 1000),
            duration: remainingYearsInDasha,
            isActive: true,
            elapsedYears: yearsElapsedInDasha
        });

        // Add next 8 complete dashas
        currentDate = new Date(currentDate.getTime() + remainingYearsInDasha * 365.25 * 24 * 60 * 60 * 1000);
        totalYears = remainingYearsInDasha;

        for (let i = 0; i < 8; i++) {
            currentIndex = (currentIndex + 1) % 9;
            const lord = dashaLords[currentIndex];
            const duration = dashaYears[lord];

            dashaSequence.push({
                lord: lord,
                startYear: totalYears,
                endYear: totalYears + duration,
                startDate: new Date(currentDate),
                endDate: new Date(currentDate.getTime() + duration * 365.25 * 24 * 60 * 60 * 1000),
                duration: duration,
                isActive: false,
                elapsedYears: 0
            });

            currentDate = new Date(currentDate.getTime() + duration * 365.25 * 24 * 60 * 60 * 1000);
            totalYears += duration;
        }

        // Get nakshatra name
        const nakshatraNames = [
            'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
            'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
            'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
        ];

        const nakshatraTamilNames = [
            'அஸ்வினி', 'பரணி', 'கிருத்திகை', 'ரோஹிணி', 'மிருகசீரிஷம்', 'திருவாதிரை', 'புனர்வசு', 'பூஷ்யம்', 'ஆயில்யம்',
            'மகம்', 'பூர்வ பல்குனி', 'உத்திர பல்குனி', 'ஹஸ்தம்', 'சித்திரை', 'சுவாதி', 'விசாகம்', 'அனுராதை', 'ஜ்யேஷ்டை',
            'மூலம்', 'பூர்வாஷாடம்', 'உத்திராஷாடம்', 'திருவோணம்', 'தனிஷ்டை', 'சதயம்', 'பூரட்டாதி', 'உத்திரட்டாதி', 'ரேவதி'
        ];

        return {
            system: 'Vimshottari',
            currentLord: startingLord,
            currentNakshatra: nakshatraNames[nakshatraIndex] || 'Unknown',
            currentNakshatraTamil: nakshatraTamilNames[nakshatraIndex] || 'Unknown',
            moonLongitude: moonLong.toFixed(2),
            nakshatraIndex: nakshatraIndex,
            degreeInNakshatra: degreeInNakshatra.toFixed(2),
            percentageInNakshatra: (percentageInNakshatra * 100).toFixed(2),
            yearsElapsedInCurrentDasha: yearsElapsedInDasha.toFixed(2),
            remainingYearsInCurrentDasha: remainingYearsInDasha.toFixed(2),
            sequence: dashaSequence
        };
    } catch (error) {
        console.error('Error in calculateDasha:', error);
        return {
            system: 'Vimshottari',
            error: error.message,
            sequence: []
        };
    }
}

function getPanchangam(positions, dateObj) {
    const moon = positions['Moon'].longitude;
    const sun = positions['Sun'].longitude;

    // Tithi
    let diff = moon - sun;
    if (diff < 0) diff += 360;
    const tithiVal = diff / 12;
    const tithiIdx = Math.floor(tithiVal);
    const paksha = tithiIdx < 15 ? "Shukla Paksha" : "Krishna Paksha";
    const tName = TITHI_NAMES[tithiIdx];

    // Nakshatra
    const nakData = CommonUtils.getNakshatraFromLongitude(moon);

    // Yoga
    let yogaSum = (moon + sun) % 360;
    const yogaIdx = Math.floor(yogaSum / (360 / 27));
    const yogaName = YOGA_NAMES[yogaIdx] || YOGA_NAMES[0];

    // Karana
    const karanaIdxTotal = Math.floor(diff / 6);
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

exports.getBirthChart = async (req, res) => {
    try {
        const { year, month, day, hour, minute, latitude, longitude, timezone } = req.body;

        // Validate required fields
        if (!year || !month || !day || hour === undefined || minute === undefined || latitude === undefined || longitude === undefined || !timezone) {
            return res.status(400).json({ error: "Invalid Input: All birth details (year, month, day, hour, minute, latitude, longitude, timezone) are required" });
        }

        // Validate coordinate ranges
        if (latitude < -90 || latitude > 90) {
            return res.status(400).json({ error: "Invalid latitude: must be between -90 and 90" });
        }
        if (longitude < -180 || longitude > 180) {
            return res.status(400).json({ error: "Invalid longitude: must be between -180 and 180" });
        }

        const birthDate = CommonUtils.createDate(year, month, day, hour, minute, timezone);

        // 1. Calculate Planetary Positions & Ascendant
        const { positions, ayanamsa } = CommonUtils.calculatePlanetaryPositions(birthDate, latitude, longitude);
        const ascendant = CommonUtils.calculateAscendant(birthDate, latitude, longitude);

        // 2. Generate Detailed Birth Chart
        const generator = new BirthChartGenerator();
        const chartData = generator.generateBirthChart(positions, ascendant);
        const { houses, planets } = chartData;

        // 2.5 Generate Navamsa Chart (using lib)
        const navamsaGen = new ImprovedNavamsaChart();
        const birthDetails = { year, month, day, hour, minute, latitude, longitude, timezone };
        // Navamsa Generator expects plain positions map, ayanamsa, ascendant, details
        // Note: positions uses "Sun": { longitude, ... }
        // navamsaGen expects { Sun: longitudeVal, ... }
        const simplePositions = {};
        Object.keys(positions).forEach(k => {
            simplePositions[k] = positions[k].longitude;
        });
        const navamsaChart = navamsaGen.generateNavamsaChart(simplePositions, ayanamsa, ascendant, birthDetails);

        // 3. Construct Response
        const responseData = {};

        // Birth Data
        responseData.birthData = {
            date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
            time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
            latitude,
            longitude,
            timezone
        };

        // Rasi (D1) - Normalized houses 1-12 (ordered array)
        responseData.rasi = [];
        for (let i = 1; i <= 12; i++) {
            const house = houses[i] || {};
            const vedicSign = house.sign || '';
            responseData.rasi.push({
                houseNumber: i,
                sign: normalizeSignName(vedicSign),
                signTamil: getSignTamil(vedicSign),
                lord: house.lord || '',
                planets: (house.planets && Array.isArray(house.planets)) ? house.planets.filter(p => p !== 'Lagna') : []
            });
        }

        // Keep houses for backward compatibility
        responseData.houses = {};
        Object.keys(houses).forEach(h => {
            responseData.houses[h] = {
                sign: houses[h].sign,
                signTamil: houses[h].signTamil,
                lord: houses[h].lord,
                lordTamil: houses[h].lordTamil,
                planets: houses[h].planets,
                signNumber: houses[h].signNumber,
                element: houses[h].element,
                elementTamil: houses[h].elementTamil,
                nature: houses[h].nature,
                natureTamil: houses[h].natureTamil,
                degrees: houses[h].degrees
            };
        });

        // Planets (House -> Name)
        responseData.planets = {};
        Object.keys(houses).forEach(h => {
            // Filter out Lagna for planets view if desired, but check requirement?
            // "houses with planets" -> houses output.
            // "planets as house-number -> planet-name array"
            // Usually excludes Lagna in 'planets' map.
            const pList = houses[h].planets.filter(p => p !== 'Lagna');
            if (pList.length > 0) responseData.planets[h] = pList;
        });

        // Raw Planets
        responseData.rawPlanets = {};
        Object.keys(planets).forEach(k => {
            const p = planets[k];
            const longVal = p.fullDegree !== undefined ? p.fullDegree : positions[k].longitude;
            const degreeInSign = longVal % 30;

            responseData.rawPlanets[k] = {
                sign: p.sign,
                signTamil: p.signTamil,
                nameTamil: p.tamilName,
                house: p.house,
                degree: String(p.normDegree !== undefined ? p.normDegree : degreeInSign),
                degreeFormatted: decimalToDMS(p.normDegree !== undefined ? p.normDegree : degreeInSign),
                longitude: longVal,
                nakshatra: p.nakshatra || "",
                nakshatraTamil: p.nakshatraTamil,
                nakshatraLord: p.nakshatraLord || "",
                nakshatraLordTamil: p.nakshatraLordTamil,
                dignity: p.dignity || { english: "Normal", tamil: "சாதாரணம்" },
                isRetrograde: p.isRetrograde || false
            };
        });

        // Positions
        responseData.positions = {};
        Object.keys(positions).forEach(k => {
            responseData.positions[k] = {
                longitude: positions[k].longitude,
                latitude: positions[k].latitude,
                speed: positions[k].speed
            };
        });

        // Details
        responseData.ascendant = ascendant;
        responseData.ayanamsa = ayanamsa;

        // Lagna Metadata
        const lagnaHouse = houses[1];
        responseData.lagna = {
            number: lagnaHouse.signNumber,
            name: lagnaHouse.sign,
            english: lagnaHouse.sign,
            tamil: lagnaHouse.signTamil,
            lord: lagnaHouse.lord,
            lordTamil: lagnaHouse.lordTamil,
            element: lagnaHouse.element,
            elementTamil: lagnaHouse.elementTamil,
            degrees: [lagnaHouse.degrees, lagnaHouse.degrees + 30] // Approximate end range
        };

        // Moon details
        const moonP = planets['Moon'] || {};
        const moonLong = positions['Moon'].longitude;
        const moonNak = CommonUtils.getNakshatraFromLongitude(moonLong);
        responseData.moonSign = {
            number: moonP.signNumber,
            name: moonP.sign,
            english: moonP.sign,
            tamil: moonP.signTamil,
            lord: moonP.lord,
            lordTamil: moonP.lordTamil,
            element: moonP.element,
            elementTamil: moonP.elementTamil,
            degrees: [0, 30] // Placeholder
        };
        responseData.moonNakshatra = {
            number: moonP.nakshatraNumber,
            name: moonNak.name,
            lord: moonNak.lord,
            rashi: moonP.sign,
            degrees: [0, 0], // Placeholder
            deity: '-',
            pada: moonP.pada || moonNak.pada
        };

        // Panchangam
        // Need Date Object for Vara
        // Note: JS Date month is 0-11. Input 'month' is likely 1-12 from req.body?
        // createDate generally assumes 1-12 if custom, but native Date is 0-11
        // vedic-astrology-api createDate(y, m, d...) uses 1-based month typically?
        // Let's assume input month is 1-12 (standard API).
        responseData.panchangam = getPanchangam(positions, new Date(year, month - 1, day, hour, minute));

        // Dasha (Vimshottari Dasha)
        responseData.dasha = calculateDasha(positions, birthDate);

        // Navamsa
        // Normalize navamsa into houses format (1-12)
        const navamsaHouses = {};
        const navamsaPositions = navamsaChart.navamsaPositions || {};

        // Map navamsa positions to houses
        Object.keys(navamsaPositions).forEach(key => {
            const value = navamsaPositions[key];

            // Skip non-house keys
            if (key === 'Lagna' || key === 'ascendant') return;

            // If value is a sign name, find its house number
            const signNames = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
            const signIndex = signNames.indexOf(value);

            if (signIndex !== -1) {
                const houseNum = signIndex + 1;
                if (!navamsaHouses[houseNum]) {
                    navamsaHouses[houseNum] = {
                        houseNumber: houseNum,
                        sign: value,
                        signTamil: value, // Will be mapped below
                        lord: '',
                        planets: []
                    };
                }
                // Add planet to this house
                if (key !== 'Lagna') {
                    navamsaHouses[houseNum].planets.push(key);
                }
            }
        });

        // Convert navamsa houses object to array with normalized sign names
        const navamsaHousesArray = [];
        const navamsaHousesObj = navamsaChart.houses || {};

        for (let i = 1; i <= 12; i++) {
            const house = navamsaHousesObj[i] || {};
            const vedicSign = house.sign || '';
            navamsaHousesArray.push({
                houseNumber: i,
                sign: normalizeSignName(vedicSign),
                signTamil: getSignTamil(vedicSign),
                lord: house.lord || '',
                planets: (house.planets && Array.isArray(house.planets)) ? house.planets.filter(p => p !== 'Lagna') : []
            });
        }

        responseData.navamsa = {
            houses: navamsaHousesArray,
            planets: navamsaChart.navamsaPositions,
            ascendant: navamsaChart.navamsaPositions['Lagna']
        };


        const response = {
            success: true,
            data: responseData
        };

        res.json(response);

    } catch (error) {
        console.error("Error in getBirthChart:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

