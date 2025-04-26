let port;
let isConnected = false;
let rawOutput = document.getElementById('raw-output');

// Connect to Arduino
async function connectToArduino() {
    try {
        port = await navigator.serial.requestPort();
        await port.open({ baudRate: 9600 });
        
        isConnected = true;
        updateConnectionStatus(true);
        startReadingData();
    } catch (error) {
        console.error('Error connecting to Arduino:', error);
        updateConnectionStatus(false);
    }
}

// Update connection status in UI
function updateConnectionStatus(connected = false) {
    const statusElement = document.getElementById('connection-status');
    const connectBtn = document.getElementById('connect-btn');
    
    if (connected) {
        statusElement.textContent = 'Connected';
        statusElement.className = 'status connected';
        connectBtn.textContent = 'Disconnect';
    } else {
        statusElement.textContent = 'Disconnected';
        statusElement.className = 'status disconnected';
        connectBtn.textContent = 'Connect to Arduino';
    }
}

// Parse data from Arduino
function parseData(line) {
    try {
        // Display raw data
        rawOutput.textContent = line;
        
        // Try to parse as JSON
        const data = JSON.parse(line);
        return data;
    } catch (error) {
        console.error('Error parsing data:', error);
        return null;
    }
}

// Update UI with new readings
function updateReadings(data) {
    if (!data) return;

    // Update NO and NOx levels for dashboard
    if (data.no_level !== undefined) {
        document.getElementById('latest-no')?.textContent = `${data.no_level.toFixed(2)} ppm`;
    }
    if (data.nox_level !== undefined) {
        document.getElementById('latest-nox')?.textContent = `${data.nox_level.toFixed(2)} ppm`;
    }
    
    // Update reduction percentages for dashboard
    if (data.no_reduction !== undefined) {
        document.getElementById('co-reduction')?.textContent = `${data.no_reduction.toFixed(1)}%`;
    }
    if (data.nox_reduction !== undefined) {
        document.getElementById('nox-reduction')?.textContent = `${data.nox_reduction.toFixed(1)}%`;
    }

    // Update statistics page readings
    if (data.no_before !== undefined) {
        document.getElementById('coBefore')?.textContent = `${data.no_before.toFixed(2)} ppm`;
    }
    if (data.no_after !== undefined) {
        document.getElementById('coAfter')?.textContent = `${data.no_after.toFixed(2)} ppm`;
    }
    if (data.nox_before !== undefined) {
        document.getElementById('noxBefore')?.textContent = `${data.nox_before.toFixed(2)} ppm`;
    }
    if (data.nox_after !== undefined) {
        document.getElementById('noxAfter')?.textContent = `${data.nox_after.toFixed(2)} ppm`;
    }
    if (data.no_reduction !== undefined) {
        document.getElementById('coReduction')?.textContent = `${data.no_reduction.toFixed(1)}%`;
    }
    if (data.nox_reduction !== undefined) {
        document.getElementById('noxReduction')?.textContent = `${data.nox_reduction.toFixed(1)}%`;
    }

    // Update graphs if they exist
    updateGraphs(data);
    
    // Update last updated timestamp
    document.getElementById('last-updated')?.textContent = new Date().toLocaleTimeString();
}

// Update graphs with new data
function updateGraphs(data) {
    const coGraph = window.coChart;
    const noxGraph = window.noxChart;

    if (coGraph && data.no_before !== undefined && data.no_after !== undefined) {
        const time = new Date().toLocaleTimeString();
        coGraph.data.labels.push(time);
        coGraph.data.datasets[0].data.push(data.no_before);
        coGraph.data.datasets[1].data.push(data.no_after);
        
        // Keep only last 20 data points
        if (coGraph.data.labels.length > 20) {
            coGraph.data.labels.shift();
            coGraph.data.datasets[0].data.shift();
            coGraph.data.datasets[1].data.shift();
        }
        
        coGraph.update();
    }

    if (noxGraph && data.nox_before !== undefined && data.nox_after !== undefined) {
        const time = new Date().toLocaleTimeString();
        noxGraph.data.labels.push(time);
        noxGraph.data.datasets[0].data.push(data.nox_before);
        noxGraph.data.datasets[1].data.push(data.nox_after);
        
        // Keep only last 20 data points
        if (noxGraph.data.labels.length > 20) {
            noxGraph.data.labels.shift();
            noxGraph.data.datasets[0].data.shift();
            noxGraph.data.datasets[1].data.shift();
        }
        
        noxGraph.update();
    }
}

// Read data from Arduino
async function startReadingData() {
    const textDecoder = new TextDecoderStream();
    port.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();

    try {
        while (isConnected) {
            const { value, done } = await reader.read();
            if (done) break;

            const lines = value.split('\n');
            for (const line of lines) {
                if (line.trim()) {
                    const data = parseData(line);
                    if (data) {
                        updateReadings(data);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error reading data:', error);
        updateConnectionStatus(false);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    rawOutput = document.getElementById('raw-output');
    const connectBtn = document.getElementById('connect-btn');
    connectBtn.addEventListener('click', async () => {
        if (!isConnected) {
            await connectToArduino();
        } else {
            if (port) {
                await port.close();
            }
            isConnected = false;
            updateConnectionStatus(false);
            rawOutput.textContent = 'Disconnected from Arduino';
        }
    });
}); 