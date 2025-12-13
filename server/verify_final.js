
const { getBirthChart } = require('./controllers/chartController');

// Mock Req/Res
const req = {
    body: {
        year: 2025,
        month: 12,
        day: 13,
        hour: 22,
        minute: 21,
        latitude: 13.0827,
        longitude: 80.2707,
        timezone: 5.5
    }
};

const res = {
    json: (data) => console.log(JSON.stringify(data, null, 2)),
    status: (code) => {
        console.log("Status:", code);
        return { json: (d) => console.log(d) };
    }
};

getBirthChart(req, res);
