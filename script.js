// Navigation
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    initializeCalendar();
    initializeGraphs();
    setupLocationAndAirQuality();
    setupEventListeners();
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetPage = item.dataset.page;
            switchPage(targetPage);
            updateNavigation(item);
        });
    });
}

function switchPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
        if (page.id === pageId) {
            page.classList.add('active');
        }
    });
}

function updateNavigation(activeItem) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    activeItem.classList.add('active');
}

// Calendar initialization
function initializeCalendar() {
    const calendarGrid = document.querySelector('.calendar-grid');
    if (!calendarGrid) return;

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Get first day of the month
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    
    // Clear existing calendar
    calendarGrid.innerHTML = '';
    
    // Add month and year header
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const monthHeader = document.createElement('div');
    monthHeader.className = 'calendar-month-header';
    monthHeader.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    calendarGrid.appendChild(monthHeader);
    
    // Add weekday headers
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    weekdays.forEach(day => {
        const weekdayHeader = document.createElement('div');
        weekdayHeader.className = 'calendar-weekday';
        weekdayHeader.textContent = day;
        calendarGrid.appendChild(weekdayHeader);
    });
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyCell);
    }
    
    // Add days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        
        // Mark today's date
        if (day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
            dayCell.classList.add('today');
        }
        
        // Add day number
        const dayNumber = document.createElement('span');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayCell.appendChild(dayNumber);
        
        calendarGrid.appendChild(dayCell);
    }
}

// Graph initialization
function initializeGraphs() {
    // NO Graph
    const noCtx = document.getElementById('no-graph').getContext('2d');
    window.noGraph = new Chart(noCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'NO Level (ppm)',
                data: [],
                borderColor: '#2196F3',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 0
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'NO (ppm)'
                    }
                }
            }
        }
    });

    // NOx Graph
    const noxCtx = document.getElementById('nox-graph').getContext('2d');
    window.noxGraph = new Chart(noxCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'NOx Level (ppm)',
                data: [],
                borderColor: '#2196F3',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 0
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'NOx (ppm)'
                    }
                }
            }
        }
    });
}

// Location and Air Quality
function setupLocationAndAirQuality() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            
            // Get city name using reverse geocoding
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
                .then(response => response.json())
                .then(data => {
                    const city = data.address.city || data.address.town || data.address.village || 'Unknown Location';
                    document.getElementById('current-location').textContent = city;
                    
                    // Simulate air quality data
                    updateAirQuality();
                });
        });
    }
}

function updateAirQuality() {
    const aqi = Math.floor(Math.random() * 100) + 1;
    const aqiStatus = getAQIStatus(aqi);
    
    document.getElementById('aqi-value').textContent = `AQI: ${aqi}`;
    document.getElementById('aqi-status').textContent = aqiStatus;
    document.getElementById('aqi-status').className = `aqi-status ${aqiStatus.toLowerCase()}`;
}

function getAQIStatus(aqi) {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy';
    return 'Hazardous';
}

// Data smoothing and stability improvements
const SMOOTHING_WINDOW = 5; // Number of readings to average
const MAX_HISTORY = 20; // Maximum number of data points to store

let coBeforeHistory = [];
let coAfterHistory = [];
let noxBeforeHistory = [];
let noxAfterHistory = [];
let timestamps = [];

function smoothData(dataArray) {
    if (dataArray.length < SMOOTHING_WINDOW) return dataArray;
    
    const smoothed = [];
    for (let i = 0; i < dataArray.length; i++) {
        const start = Math.max(0, i - Math.floor(SMOOTHING_WINDOW / 2));
        const end = Math.min(dataArray.length, i + Math.ceil(SMOOTHING_WINDOW / 2));
        const window = dataArray.slice(start, end);
        const average = window.reduce((sum, val) => sum + val, 0) / window.length;
        smoothed.push(average);
    }
    return smoothed;
}

function updateGraphs(data) {
    // Add new data point
    const now = new Date();
    timestamps.push(now.toLocaleTimeString());
    
    // Keep only last 20 data points
    if (timestamps.length > MAX_HISTORY) {
        timestamps.shift();
    }
    
    // Update NO graph
    if (window.noGraph) {
        window.noGraph.data.labels = timestamps;
        window.noGraph.data.datasets[0].data.push(data.no_level);
        
        if (window.noGraph.data.datasets[0].data.length > MAX_HISTORY) {
            window.noGraph.data.datasets[0].data.shift();
        }
        
        window.noGraph.update();
    }
    
    // Update NOx graph
    if (window.noxGraph) {
        window.noxGraph.data.labels = timestamps;
        window.noxGraph.data.datasets[0].data.push(data.nox_level);
        
        if (window.noxGraph.data.datasets[0].data.length > MAX_HISTORY) {
            window.noxGraph.data.datasets[0].data.shift();
        }
        
        window.noxGraph.update();
    }
}

function updateStats(coLevel, noxLevel, maxCO, maxNOx, totalReduction) {
    // Format numbers to 2 decimal places
    const formatNumber = (num) => parseFloat(num).toFixed(2);
    
    document.getElementById('co-level').textContent = `${formatNumber(coLevel)} ppm`;
    document.getElementById('nox-level').textContent = `${formatNumber(noxLevel)} ppm`;
    document.getElementById('max-co').textContent = `${formatNumber(maxCO)} ppm`;
    document.getElementById('max-nox').textContent = `${formatNumber(maxNOx)} ppm`;
    document.getElementById('emissions-reduced').textContent = formatNumber(totalReduction);
}

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Connection status handling
let isConnected = false;

async function checkConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/status`);
        const data = await response.json();
        isConnected = data.connected;
        updateConnectionStatus();
    } catch (error) {
        console.error('Error checking connection:', error);
        isConnected = false;
        updateConnectionStatus();
    }
}

function updateConnectionStatus() {
    const statusElement = document.getElementById('status');
    if (isConnected) {
        statusElement.textContent = 'Arduino Connected';
        statusElement.className = 'status connected';
    } else {
        statusElement.textContent = 'Arduino Disconnected';
        statusElement.className = 'status waiting';
    }
}

// Data fetching
async function fetchLatestData() {
    try {
        const response = await fetch(`${API_BASE_URL}/latest`);
        const data = await response.json();
        if (!data.error) {
            updateUI(data);
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

async function fetchTodayStatistics() {
    try {
        const response = await fetch(`${API_BASE_URL}/statistics/today`);
        const data = await response.json();
        if (!data.error) {
            updateStatistics(data);
        }
    } catch (error) {
        console.error('Error fetching statistics:', error);
    }
}

function updateUI(data) {
    // Update before filtration values
    document.getElementById('co-before').textContent = `${data.co_before.toFixed(2)} ppm`;
    document.getElementById('nox-before').textContent = `${data.nox_before.toFixed(2)} ppm`;
    
    // Update after filtration values
    document.getElementById('co-after').textContent = `${data.co_after.toFixed(2)} ppm`;
    document.getElementById('nox-after').textContent = `${data.nox_after.toFixed(2)} ppm`;
    
    // Update reduction rates
    document.getElementById('co-reduction').textContent = `${data.co_reduction.toFixed(1)}%`;
    document.getElementById('nox-reduction').textContent = `${data.nox_reduction.toFixed(1)}%`;
    
    // Update graphs
    updateGraphs(data);
    
    // Update last updated time
    document.getElementById('last-updated').textContent = new Date().toLocaleTimeString();
}

function updateStatistics(data) {
    document.getElementById('avg-co-before').textContent = `${data.avg_co_before.toFixed(2)} ppm`;
    document.getElementById('avg-nox-before').textContent = `${data.avg_nox_before.toFixed(2)} ppm`;
    document.getElementById('max-co-before').textContent = `${data.max_co_before.toFixed(2)} ppm`;
    document.getElementById('max-nox-before').textContent = `${data.max_nox_before.toFixed(2)} ppm`;
    document.getElementById('min-co-before').textContent = `${data.min_co_before.toFixed(2)} ppm`;
    document.getElementById('min-nox-before').textContent = `${data.min_nox_before.toFixed(2)} ppm`;
}

// Initialize data fetching
function initializeDataFetching() {
    // Check initial connection status
    checkConnection();
    
    // Fetch initial data
    fetchLatestData();
    fetchTodayStatistics();
    
    // Set up periodic updates
    setInterval(checkConnection, 5000); // Check connection every 5 seconds
    setInterval(fetchLatestData, 2000); // Update data every 2 seconds
    setInterval(fetchTodayStatistics, 60000); // Update statistics every minute
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    initializeCalendar();
    initializeGraphs();
    initializeDataFetching();
});

// Language selection
document.getElementById('language-select').addEventListener('change', (e) => {
    const language = e.target.value;
    // In a real app, this would update the UI language
    console.log(`Language changed to: ${language}`);
});

// Profile form handling
document.getElementById('profile-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('fullname');
    document.getElementById('user-name').textContent = name;
    // In a real app, this would save the profile data
    console.log('Profile updated:', { fullname: name });
});

function setupEventListeners() {
    // Profile form submission
    document.getElementById('profile-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const name = formData.get('fullname');
        document.getElementById('user-name').textContent = name;
        // In a real app, save to backend
    });

    // Language selection
    document.getElementById('language-select').addEventListener('change', (e) => {
        const language = e.target.value;
        // In a real app, update UI language
        console.log(`Language changed to: ${language}`);
    });

    // Add connection status toggle
    const connectionSection = document.querySelector('.connection-section');
    connectionSection.addEventListener('click', () => {
        isConnected = !isConnected;
        checkConnection();
    });

    // Add click handler for connection status
    document.getElementById('status').addEventListener('click', async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/toggle-connection`, {
                method: 'POST'
            });
            const data = await response.json();
            isConnected = data.connected;
            updateConnectionStatus();
        } catch (error) {
            console.error('Error toggling connection:', error);
        }
    });
}

// Initialize connection status
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    initializeCalendar();
    checkConnection(); // Set initial connection status
});

// Update current time
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const dateString = now.toLocaleDateString(undefined, { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    document.getElementById('current-time').textContent = `${dateString} ${timeString}`;
}

// Initialize Chart.js for graphs
let noChart, noxChart;

function initializeCharts() {
    const noCtx = document.getElementById('no-graph').getContext('2d');
    const noxCtx = document.getElementById('nox-graph').getContext('2d');

    noChart = new Chart(noCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'NO Input (ppm)',
                data: [],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }, {
                label: 'NO Output (ppm)',
                data: [],
                borderColor: 'rgb(255, 99, 132)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    noxChart = new Chart(noxCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'NOx Input (ppm)',
                data: [],
                borderColor: 'rgb(54, 162, 235)',
                tension: 0.1
            }, {
                label: 'NOx Output (ppm)',
                data: [],
                borderColor: 'rgb(255, 159, 64)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Update the UI with latest readings
function updateUI(readings) {
    if (!readings) return;

    // Update NO readings
    document.getElementById('latest-no').textContent = `${readings.no.output.toFixed(2)} ppm`;
    document.getElementById('co-reduction').textContent = `${readings.no.efficiency.toFixed(1)}%`;

    // Update NOx readings
    document.getElementById('latest-nox').textContent = `${readings.nox.output.toFixed(2)} ppm`;
    document.getElementById('nox-reduction').textContent = `${readings.nox.efficiency.toFixed(1)}%`;

    // Update last updated timestamp
    document.getElementById('last-updated').textContent = readings.timestamp.toLocaleTimeString();

    // Update environment data
    document.getElementById('temperature').textContent = `${readings.environment.temperature.toFixed(1)}°C`;
    document.getElementById('humidity').textContent = `${readings.environment.humidity.toFixed(1)}%`;
    document.getElementById('flow-rate').textContent = `${readings.environment.flowRate.toFixed(2)} m/s`;
}

// Update charts with historical data
function updateCharts() {
    const history = database.getReadingsHistory();
    const labels = history.map(r => r.timestamp.toLocaleTimeString());
    const noInputData = history.map(r => r.no.input);
    const noOutputData = history.map(r => r.no.output);
    const noxInputData = history.map(r => r.nox.input);
    const noxOutputData = history.map(r => r.nox.output);

    noChart.data.labels = labels;
    noChart.data.datasets[0].data = noInputData;
    noChart.data.datasets[1].data = noOutputData;
    noChart.update();

    noxChart.data.labels = labels;
    noxChart.data.datasets[0].data = noxInputData;
    noxChart.data.datasets[1].data = noxOutputData;
    noxChart.update();
}

// Main update function
function updateAll() {
    const readings = database.generateSensorReadings();
    database.storeReading(readings);
    updateUI(readings);
    updateCharts();
}

// Initialize and start auto-refresh
document.addEventListener('DOMContentLoaded', () => {
    initializeCharts();
    // Initial update
    updateAll();
    // Auto-refresh every 3 seconds
    setInterval(updateAll, 3000);
});

// Handle profile form submission
function handleProfileSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const name = formData.get('fullname');
    const language = formData.get('language');

    // Update UI
    document.getElementById('user-name').textContent = name;

    // Save to localStorage
    localStorage.setItem('userProfile', JSON.stringify({ name, language }));
}

// Load user profile
function loadUserProfile() {
    const profile = localStorage.getItem('userProfile');
    if (profile) {
        const { name, language } = JSON.parse(profile);
        document.getElementById('user-name').textContent = name;
        document.getElementById('fullname').value = name;
        document.getElementById('language-select').value = language;
    }
}

// Profile data handling
function saveProfileData() {
    const name = document.getElementById('fullname').value;
    const email = document.getElementById('email').value;
    const language = document.getElementById('language-select').value;
    
    const profileData = {
        name,
        email,
        language,
        lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('userProfile', JSON.stringify(profileData));
    updateUserGreeting(name);
    showNotification('Profile saved successfully!');
}

function loadProfileData() {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
        const profileData = JSON.parse(savedProfile);
        document.getElementById('fullname').value = profileData.name || '';
        document.getElementById('email').value = profileData.email || '';
        document.getElementById('language-select').value = profileData.language || 'en';
        updateUserGreeting(profileData.name);
    }
}

function updateUserGreeting(name) {
    const greetingElement = document.querySelector('.greeting-text h2');
    if (greetingElement && name) {
        const hour = new Date().getHours();
        let greeting = 'Good ';
        
        if (hour < 12) greeting += 'Morning';
        else if (hour < 18) greeting += 'Afternoon';
        else greeting += 'Evening';
        
        greetingElement.textContent = `${greeting}, ${name}!`;
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Initialize profile when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadProfileData();
    
    // Add event listener for profile form submission
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveProfileData();
        });
    }
});

// Constants for filter efficiency thresholds
const FILTER_EFFICIENCY_THRESHOLD = 50; // 50% reduction is considered effective
const UPDATE_INTERVAL = 2000; // Update every 2 seconds

// Activated Carbon Filter Algorithm Constants
const ACTIVATED_CARBON_EFFICIENCY = 0.85; // 85% base efficiency
const MAX_INPUT_CONCENTRATION = 1000; // ppm
const MIN_INPUT_CONCENTRATION = 0; // ppm
const FILTER_DEGRADATION_RATE = 0.0001; // per reading

let filterEfficiency = ACTIVATED_CARBON_EFFICIENCY;

// Simulate sensor readings with activated carbon filter
function simulateSensorReadings() {
    // Generate random input concentrations within realistic ranges
    const coInput = Math.random() * (MAX_INPUT_CONCENTRATION - MIN_INPUT_CONCENTRATION) + MIN_INPUT_CONCENTRATION;
    const noxInput = Math.random() * (MAX_INPUT_CONCENTRATION - MIN_INPUT_CONCENTRATION) + MIN_INPUT_CONCENTRATION;

    // Apply filter degradation
    filterEfficiency = Math.max(0.3, filterEfficiency - FILTER_DEGRADATION_RATE);

    // Calculate filtered output using activated carbon filter algorithm
    const coOutput = coInput * (1 - filterEfficiency);
    const noxOutput = noxInput * (1 - filterEfficiency);

    // Calculate reduction percentages
    const coReduction = ((coInput - coOutput) / coInput) * 100;
    const noxReduction = ((noxInput - noxOutput) / noxInput) * 100;

    return {
        no_before: coInput,
        no_after: coOutput,
        nox_before: noxInput,
        nox_after: noxOutput,
        no_reduction: coReduction,
        nox_reduction: noxReduction
    };
}

// Initialize charts for statistics page
function initializeCharts() {
    const coCtx = document.getElementById('co-graph')?.getContext('2d');
    const noxCtx = document.getElementById('nox-graph')?.getContext('2d');

    if (coCtx) {
        window.coChart = new Chart(coCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Before Filtration',
                        data: [],
                        borderColor: 'rgb(255, 99, 132)',
                        tension: 0.1
                    },
                    {
                        label: 'After Filtration',
                        data: [],
                        borderColor: 'rgb(54, 162, 235)',
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                animation: {
                    duration: 0
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'CO Level (ppm)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    }
                }
            }
        });
    }

    if (noxCtx) {
        window.noxChart = new Chart(noxCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Before Filtration',
                        data: [],
                        borderColor: 'rgb(255, 99, 132)',
                        tension: 0.1
                    },
                    {
                        label: 'After Filtration',
                        data: [],
                        borderColor: 'rgb(54, 162, 235)',
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                animation: {
                    duration: 0
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'NOx Level (ppm)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    }
                }
            }
        });
    }
}

// Update filter efficiency status
function updateFilterEfficiency(data) {
    // CO Filter Efficiency
    const coReduction = data.no_reduction || 0;
    const coEfficiencyStatus = document.getElementById('coEfficiencyStatus');
    const coFilterAlert = document.getElementById('co-filter-alert');
    
    if (coReduction < FILTER_EFFICIENCY_THRESHOLD) {
        coEfficiencyStatus.textContent = 'Low Efficiency';
        coEfficiencyStatus.className = 'status-text warning';
        coFilterAlert.classList.remove('hidden');
    } else {
        coEfficiencyStatus.textContent = 'Normal';
        coEfficiencyStatus.className = 'status-text normal';
        coFilterAlert.classList.add('hidden');
    }

    // NOx Filter Efficiency
    const noxReduction = data.nox_reduction || 0;
    const noxEfficiencyStatus = document.getElementById('noxEfficiencyStatus');
    const noxFilterAlert = document.getElementById('nox-filter-alert');
    
    if (noxReduction < FILTER_EFFICIENCY_THRESHOLD) {
        noxEfficiencyStatus.textContent = 'Low Efficiency';
        noxEfficiencyStatus.className = 'status-text warning';
        noxFilterAlert.classList.remove('hidden');
    } else {
        noxEfficiencyStatus.textContent = 'Normal';
        noxEfficiencyStatus.className = 'status-text normal';
        noxFilterAlert.classList.add('hidden');
    }
}

// Update UI with new readings
function updateReadings(data) {
    if (!data) return;

    // Update CO readings
    if (data.no_before !== undefined) {
        document.querySelector('#coBefore .value').textContent = data.no_before.toFixed(2);
    }
    if (data.no_after !== undefined) {
        document.querySelector('#coAfter .value').textContent = data.no_after.toFixed(2);
    }
    if (data.no_reduction !== undefined) {
        document.querySelector('#coReduction.value').textContent = data.no_reduction.toFixed(1);
    }

    // Update NOx readings
    if (data.nox_before !== undefined) {
        document.querySelector('#noxBefore .value').textContent = data.nox_before.toFixed(2);
    }
    if (data.nox_after !== undefined) {
        document.querySelector('#noxAfter .value').textContent = data.nox_after.toFixed(2);
    }
    if (data.nox_reduction !== undefined) {
        document.querySelector('#noxReduction.value').textContent = data.nox_reduction.toFixed(1);
    }

    // Update filter efficiency status
    updateFilterEfficiency(data);

    // Update graphs
    updateGraphs(data);
    
    // Update last updated timestamp
    document.getElementById('last-updated').textContent = new Date().toLocaleTimeString();
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

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize charts if on statistics page
    if (document.getElementById('co-graph')) {
        initializeCharts();
        
        // Start periodic updates
        setInterval(() => {
            const readings = simulateSensorReadings();
            updateReadings(readings);
        }, UPDATE_INTERVAL);
    }
});
