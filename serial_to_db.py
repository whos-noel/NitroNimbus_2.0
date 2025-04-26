import serial
import json
import sqlite3
from datetime import datetime
import time

# Database setup
def init_db():
    conn = sqlite3.connect('air_quality.db')
    c = conn.cursor()
    
    # Create table if it doesn't exist
    c.execute('''CREATE TABLE IF NOT EXISTS air_quality_data
                 (timestamp DATETIME,
                  no_level_before REAL,
                  nox_level_before REAL,
                  no_level_after REAL,
                  nox_level_after REAL,
                  no_efficiency REAL,
                  nox_efficiency REAL)''')
    
    conn.commit()
    conn.close()

def calculate_efficiency(before, after):
    if before == 0:
        return 0
    return ((before - after) / before) * 100

def main():
    # Initialize database
    init_db()
    
    # Serial port configuration
    ser = serial.Serial('COM3', 9600)  # Change COM3 to your Arduino's port
    print("Connected to Arduino...")
    
    try:
        while True:
            if ser.in_waiting > 0:
                # Read the line and decode it
                line = ser.readline().decode('utf-8').strip()
                
                try:
                    # Parse JSON data
                    data = json.loads(line)
                    
                    # Calculate efficiency
                    no_efficiency = calculate_efficiency(data['no_level'], data['no_reduction'])
                    nox_efficiency = calculate_efficiency(data['nox_level'], data['nox_reduction'])
                    
                    # Connect to database
                    conn = sqlite3.connect('air_quality.db')
                    c = conn.cursor()
                    
                    # Insert data into database
                    c.execute('''INSERT INTO air_quality_data 
                                (timestamp, no_level_before, nox_level_before, 
                                 no_level_after, nox_level_after, 
                                 no_efficiency, nox_efficiency)
                                VALUES (?, ?, ?, ?, ?, ?, ?)''',
                            (datetime.now(),
                             data['no_level'],
                             data['nox_level'],
                             data['no_level'] - data['no_reduction'],
                             data['nox_level'] - data['nox_reduction'],
                             no_efficiency,
                             nox_efficiency))
                    
                    conn.commit()
                    conn.close()
                    
                    print(f"Data stored: NO Level: {data['no_level']:.2f} ppm, "
                          f"NOx Level: {data['nox_level']:.2f} ppm, "
                          f"NO Efficiency: {no_efficiency:.2f}%, "
                          f"NOx Efficiency: {nox_efficiency:.2f}%")
                    
                except json.JSONDecodeError:
                    print("Error decoding JSON data")
                except KeyError:
                    print("Missing data in JSON")
                
            time.sleep(1)  # Small delay to prevent CPU overuse
            
    except KeyboardInterrupt:
        print("\nProgram terminated by user")
    finally:
        ser.close()

if __name__ == "__main__":
    main() 