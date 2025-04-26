from flask import Flask, jsonify, request
from database_manager import NitroNimbusDatabase
from datetime import datetime, timedelta

app = Flask(__name__)
db = NitroNimbusDatabase()

# Connection status
arduino_connected = False

@app.route('/api/status')
def get_connection_status():
    return jsonify({'connected': arduino_connected})

@app.route('/api/toggle-connection', methods=['POST'])
def toggle_connection():
    global arduino_connected
    try:
        # Try to connect to Arduino
        if not arduino_connected:
            arduino_connected = db.connect_to_arduino()
        else:
            if db.serial_port and db.serial_port.is_open:
                db.serial_port.close()
            arduino_connected = False
        return jsonify({'connected': arduino_connected})
    except Exception as e:
        return jsonify({'error': str(e), 'connected': False})

@app.route('/api/latest')
def get_latest_readings():
    readings = db.get_latest_readings(limit=1)
    if readings:
        reading = readings[0]
        return jsonify({
            'timestamp': reading[1],
            'co_before': reading[2],
            'nox_before': reading[3],
            'co_after': reading[4],
            'nox_after': reading[5],
            'co_reduction': reading[6],
            'nox_reduction': reading[7]
        })
    return jsonify({'error': 'No readings available'})

@app.route('/api/statistics/today')
def get_today_statistics():
    stats = db.get_daily_statistics()
    if stats:
        return jsonify({
            'date': stats[1],
            'avg_co_before': stats[2],
            'avg_nox_before': stats[3],
            'avg_co_after': stats[4],
            'avg_nox_after': stats[5],
            'avg_co_reduction': stats[6],
            'avg_nox_reduction': stats[7],
            'max_co_before': stats[8],
            'max_nox_before': stats[9],
            'min_co_before': stats[10],
            'min_nox_before': stats[11]
        })
    return jsonify({'error': 'No statistics available'})

@app.route('/api/history/<int:hours>')
def get_history(hours):
    try:
        db.cursor.execute('''
            SELECT * FROM sensor_readings 
            WHERE timestamp >= datetime('now', ?)
            ORDER BY timestamp DESC
        ''', (f'-{hours} hours',))
        readings = db.cursor.fetchall()
        
        return jsonify([{
            'timestamp': reading[1],
            'co_before': reading[2],
            'nox_before': reading[3],
            'co_after': reading[4],
            'nox_after': reading[5],
            'co_reduction': reading[6],
            'nox_reduction': reading[7]
        } for reading in readings])
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True, port=5000) 