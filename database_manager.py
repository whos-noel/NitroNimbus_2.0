import serial
import sqlite3
import json
from datetime import datetime
import time

class NitroNimbusDatabase:
    def __init__(self, db_name='nitronimbus.db'):
        self.db_name = db_name
        self.conn = None
        self.cursor = None
        self.serial_port = None
        self.setup_database()
        
    def setup_database(self):
        """Initialize the SQLite database and create necessary tables"""
        self.conn = sqlite3.connect(self.db_name)
        self.cursor = self.conn.cursor()
        
        # Create sensor readings table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS sensor_readings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                co_before REAL,
                nox_before REAL,
                co_after REAL,
                nox_after REAL,
                co_reduction REAL,
                nox_reduction REAL
            )
        ''')
        
        # Create sensor statistics table
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS sensor_statistics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date DATE,
                avg_co_before REAL,
                avg_nox_before REAL,
                avg_co_after REAL,
                avg_nox_after REAL,
                avg_co_reduction REAL,
                avg_nox_reduction REAL,
                max_co_before REAL,
                max_nox_before REAL,
                min_co_before REAL,
                min_nox_before REAL
            )
        ''')
        
        self.conn.commit()
        
    def connect_to_arduino(self, port='COM3', baud_rate=9600):
        """Connect to Arduino via serial port"""
        try:
            self.serial_port = serial.Serial(port, baud_rate, timeout=1)
            print(f"Connected to Arduino on {port}")
            return True
        except serial.SerialException as e:
            print(f"Error connecting to Arduino: {e}")
            return False
            
    def read_serial_data(self):
        """Read and parse data from Arduino"""
        if not self.serial_port or not self.serial_port.is_open:
            print("Serial port not connected")
            return None
            
        try:
            line = self.serial_port.readline().decode('utf-8').strip()
            if line:
                return json.loads(line)
        except json.JSONDecodeError:
            print("Error decoding JSON data")
        except Exception as e:
            print(f"Error reading serial data: {e}")
        return None
        
    def store_sensor_reading(self, data):
        """Store a single sensor reading in the database"""
        try:
            self.cursor.execute('''
                INSERT INTO sensor_readings 
                (co_before, nox_before, co_after, nox_after, co_reduction, nox_reduction)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                data['co_before'],
                data['nox_before'],
                data['co_after'],
                data['nox_after'],
                data['co_reduction'],
                data['nox_reduction']
            ))
            self.conn.commit()
            return True
        except Exception as e:
            print(f"Error storing sensor reading: {e}")
            return False
            
    def update_statistics(self):
        """Update daily statistics in the database"""
        try:
            # Get today's date
            today = datetime.now().strftime('%Y-%m-%d')
            
            # Calculate statistics for today
            self.cursor.execute('''
                SELECT 
                    AVG(co_before) as avg_co_before,
                    AVG(nox_before) as avg_nox_before,
                    AVG(co_after) as avg_co_after,
                    AVG(nox_after) as avg_nox_after,
                    AVG(co_reduction) as avg_co_reduction,
                    AVG(nox_reduction) as avg_nox_reduction,
                    MAX(co_before) as max_co_before,
                    MAX(nox_before) as max_nox_before,
                    MIN(co_before) as min_co_before,
                    MIN(nox_before) as min_nox_before
                FROM sensor_readings
                WHERE date(timestamp) = ?
            ''', (today,))
            
            stats = self.cursor.fetchone()
            
            # Update or insert statistics
            self.cursor.execute('''
                INSERT OR REPLACE INTO sensor_statistics
                (date, avg_co_before, avg_nox_before, avg_co_after, avg_nox_after,
                 avg_co_reduction, avg_nox_reduction, max_co_before, max_nox_before,
                 min_co_before, min_nox_before)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (today,) + stats)
            
            self.conn.commit()
            return True
        except Exception as e:
            print(f"Error updating statistics: {e}")
            return False
            
    def get_latest_readings(self, limit=10):
        """Get the latest sensor readings"""
        try:
            self.cursor.execute('''
                SELECT * FROM sensor_readings 
                ORDER BY timestamp DESC 
                LIMIT ?
            ''', (limit,))
            return self.cursor.fetchall()
        except Exception as e:
            print(f"Error getting latest readings: {e}")
            return []
            
    def get_daily_statistics(self, date=None):
        """Get statistics for a specific date (defaults to today)"""
        if date is None:
            date = datetime.now().strftime('%Y-%m-%d')
        try:
            self.cursor.execute('''
                SELECT * FROM sensor_statistics 
                WHERE date = ?
            ''', (date,))
            return self.cursor.fetchone()
        except Exception as e:
            print(f"Error getting daily statistics: {e}")
            return None
            
    def run(self):
        """Main loop to read and store sensor data"""
        if not self.connect_to_arduino():
            return
            
        try:
            while True:
                data = self.read_serial_data()
                if data:
                    self.store_sensor_reading(data)
                    self.update_statistics()
                time.sleep(1)  # Wait for 1 second before next reading
        except KeyboardInterrupt:
            print("\nStopping data collection...")
        finally:
            if self.serial_port and self.serial_port.is_open:
                self.serial_port.close()
            if self.conn:
                self.conn.close()

if __name__ == "__main__":
    db_manager = NitroNimbusDatabase()
    db_manager.run() 