
try {
    const Vedic = require('vedic-astrology-api');
    console.log('Exports:', Object.keys(Vedic));
    // Try to find the constructor
    // Commonly these libs might have a default export or named exports like 'Horoscope', 'Planets'
} catch (e) {
    console.error(e);
}
