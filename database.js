// World Standard Algorithm for Activated Carbon Filtration
const ACTIVATED_CARBON_EFFICIENCY = {
    NO: {
        baseEfficiency: 0.85,  // 85% base efficiency for NO
        temperatureFactor: 0.002,  // 0.2% change per °C
        humidityFactor: 0.001,    // 0.1% change per %RH
        flowRateFactor: 0.003     // 0.3% change per m/s
    },
    NOx: {
        baseEfficiency: 0.80,  // 80% base efficiency for NOx
        temperatureFactor: 0.0015,
        humidityFactor: 0.0012,
        flowRateFactor: 0.0025
    }
};

// Simulated sensor data
let sensorData = {
    temperature: 25,  // °C
    humidity: 50,     // %RH
    flowRate: 1.0,    // m/s
    timestamp: new Date()
};

// Calculate filtration efficiency based on world standard algorithm
function calculateEfficiency(gasType, inputConcentration) {
    const params = ACTIVATED_CARBON_EFFICIENCY[gasType];
    if (!params) return 0;

    // Calculate environmental factors
    const tempEffect = 1 - (Math.abs(sensorData.temperature - 25) * params.temperatureFactor);
    const humidityEffect = 1 - (Math.abs(sensorData.humidity - 50) * params.humidityFactor);
    const flowEffect = 1 - (Math.abs(sensorData.flowRate - 1.0) * params.flowRateFactor);

    // Calculate total efficiency
    const totalEfficiency = params.baseEfficiency * tempEffect * humidityEffect * flowEffect;
    
    // Ensure efficiency stays within reasonable bounds
    return Math.max(0.5, Math.min(0.95, totalEfficiency));
}

// Generate simulated sensor readings
function generateSensorReadings() {
    // Simulate environmental variations
    sensorData.temperature += (Math.random() - 0.5) * 0.5;
    sensorData.humidity += (Math.random() - 0.5) * 1;
    sensorData.flowRate += (Math.random() - 0.5) * 0.1;
    sensorData.timestamp = new Date();

    // Generate input concentrations (simulated)
    const noInput = 100 + Math.random() * 50;  // ppm
    const noxInput = 80 + Math.random() * 40;  // ppm

    // Calculate filtered concentrations
    const noEfficiency = calculateEfficiency('NO', noInput);
    const noxEfficiency = calculateEfficiency('NOx', noxInput);

    const noOutput = noInput * (1 - noEfficiency);
    const noxOutput = noxInput * (1 - noxEfficiency);

    return {
        timestamp: sensorData.timestamp,
        no: {
            input: noInput,
            output: noOutput,
            efficiency: noEfficiency * 100
        },
        nox: {
            input: noxInput,
            output: noxOutput,
            efficiency: noxEfficiency * 100
        },
        environment: {
            temperature: sensorData.temperature,
            humidity: sensorData.humidity,
            flowRate: sensorData.flowRate
        }
    };
}

// Store readings in memory (simulated database)
let readingsHistory = [];
const MAX_HISTORY = 100;

function storeReading(reading) {
    readingsHistory.unshift(reading);
    if (readingsHistory.length > MAX_HISTORY) {
        readingsHistory.pop();
    }
}

// Get latest readings
function getLatestReadings() {
    return readingsHistory[0] || null;
}

// Get readings history for graph
function getReadingsHistory() {
    return readingsHistory;
}

// Export functions
window.database = {
    generateSensorReadings,
    storeReading,
    getLatestReadings,
    getReadingsHistory
}; 