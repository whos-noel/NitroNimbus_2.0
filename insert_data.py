import sqlite3
import serial
import json

def insert_data(data):
    conn = sqlite3.connect('air_quality.db')
    cursor = conn.cursor()
    
    query = '''
    INSERT INTO air_quality_data (timestamp, no_level_before, nox_level_before, 
                                  no_level_after, nox_level_after, no_efficiency, nox_efficiency)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    '''
    cursor.execute(query, (
        data['timestamp'], 
        data['co_before'], 
        data['nox_before'], 
        data['co_after'], 
        data['nox_after'], 
        data['co_reduction'], 
        data['nox_reduction']
    ))
    conn.commit()
    conn.close()

def main():
    ser = serial.Serial('COM3', 9600)  # Replace 'COM3' with your Arduino's port
    while True:
        try:
            line = ser.readline().decode('utf-8').strip()
            data = json.loads(line)
            insert_data(data)
            print("Data inserted:", data)
        except Exception as e:
            print("Error:", e)

if __name__ == "__main__":
    main()