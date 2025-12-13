const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const chartRoutes = require('./routes/chartRoutes');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/charts', chartRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
