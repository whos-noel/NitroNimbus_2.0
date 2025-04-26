# Modular Exhaust Filter Monitor

A web application for monitoring NOx and CO levels before and after filtration in modular exhaust motor filters.

## Features

- Real-time monitoring of CO and NOx levels
- Interactive dashboard with live statistics
- Historical data visualization with line graphs
- Daily checkup calendar
- Local air quality monitoring
- Multi-language support (English and Indonesian)
- User profile management

## Setup Instructions

1. Install Node.js (if not already installed)
2. Clone this repository
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm start
   ```
5. Open your browser and navigate to `http://localhost:3000`

## Project Structure

- `index.html` - Main HTML file
- `styles.css` - CSS styles
- `script.js` - Frontend JavaScript
- `server.js` - Backend server
- `package.json` - Project dependencies

## API Endpoints

- `GET /api/sensor-data` - Get current sensor data
- `POST /api/sensor-data` - Update sensor data
- `GET /api/air-quality` - Get local air quality data

## Development

To run the server in development mode with auto-reload:
```bash
npm run dev
```

## Contributors

- Auralia Nur Rahma (nur.rahma1908@gmail.com)
- Jasmine Balqis Zahirah (jasminebalqiszahirah@gmail.com)
- Muhammad Farizarrasyiid (farizarrasyiid2@gmail.com)
- Davita S. M. A. Pandjaitan (davitapandjaitan@gmail.com) 