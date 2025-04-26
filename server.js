const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Store sensor data
let sensorData = {
    co: { before: [], after: [] },
    nox: { before: [], after: [] }
};

// API endpoints
app.get('/api/sensor-data', (req, res) => {
    res.json(sensorData);
});

app.post('/api/sensor-data', (req, res) => {
    const { coBefore, coAfter, noxBefore, noxAfter } = req.body;
    
    // Add new data points
    sensorData.co.before.push(coBefore);
    sensorData.co.after.push(coAfter);
    sensorData.nox.before.push(noxBefore);
    sensorData.nox.after.push(noxAfter);
    
    // Keep only last 1000 data points
    if (sensorData.co.before.length > 1000) {
        sensorData.co.before.shift();
        sensorData.co.after.shift();
        sensorData.nox.before.shift();
        sensorData.nox.after.shift();
    }
    
    res.json({ success: true });
});

app.get('/api/air-quality', async (req, res) => {
    try {
        const { lat, lon } = req.query;
        // In a real app, this would fetch actual air quality data from an API
        const aqi = Math.floor(Math.random() * 100) + 1;
        const status = aqi < 50 ? 'Good' : aqi < 100 ? 'Moderate' : 'Poor';
        
        res.json({
            aqi,
            status,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch air quality data' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 