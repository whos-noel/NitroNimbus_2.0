import sqlite3
import matplotlib.pyplot as plt
from datetime import datetime
import pandas as pd
from matplotlib.dates import DateFormatter

def fetch_data():
    conn = sqlite3.connect('air_quality.db')
    query = '''
    SELECT timestamp, 
           no_level_before, nox_level_before,
           no_level_after, nox_level_after,
           no_efficiency, nox_efficiency
    FROM air_quality_data
    ORDER BY timestamp
    '''
    df = pd.read_sql_query(query, conn)
    conn.close()
    return df

def plot_levels(df):
    plt.figure(figsize=(12, 8))
    
    # Convert timestamp to datetime
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    # Plot NO levels
    plt.subplot(2, 1, 1)
    plt.plot(df['timestamp'], df['no_level_before'], 'b-', label='NO Before Filtration')
    plt.plot(df['timestamp'], df['no_level_after'], 'b--', label='NO After Filtration')
    plt.title('NO Levels Over Time')
    plt.ylabel('PPM')
    plt.legend()
    plt.grid(True)
    
    # Plot NOx levels
    plt.subplot(2, 1, 2)
    plt.plot(df['timestamp'], df['nox_level_before'], 'r-', label='NOx Before Filtration')
    plt.plot(df['timestamp'], df['nox_level_after'], 'r--', label='NOx After Filtration')
    plt.title('NOx Levels Over Time')
    plt.ylabel('PPM')
    plt.legend()
    plt.grid(True)
    
    # Format x-axis
    plt.gca().xaxis.set_major_formatter(DateFormatter('%Y-%m-%d %H:%M'))
    plt.xticks(rotation=45)
    
    plt.tight_layout()
    plt.savefig('pollutant_levels.png')
    plt.close()

def plot_efficiency(df):
    plt.figure(figsize=(12, 6))
    
    # Convert timestamp to datetime
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    # Plot efficiency
    plt.plot(df['timestamp'], df['no_efficiency'], 'b-', label='NO Efficiency')
    plt.plot(df['timestamp'], df['nox_efficiency'], 'r-', label='NOx Efficiency')
    plt.title('Filtration Efficiency Over Time')
    plt.ylabel('Efficiency (%)')
    plt.legend()
    plt.grid(True)
    
    # Format x-axis
    plt.gca().xaxis.set_major_formatter(DateFormatter('%Y-%m-%d %H:%M'))
    plt.xticks(rotation=45)
    
    plt.tight_layout()
    plt.savefig('filtration_efficiency.png')
    plt.close()

def print_statistics(df):
    print("\n=== Statistics ===")
    print("\nNO Levels:")
    print(f"Average Before Filtration: {df['no_level_before'].mean():.2f} ppm")
    print(f"Average After Filtration: {df['no_level_after'].mean():.2f} ppm")
    print(f"Average Efficiency: {df['no_efficiency'].mean():.2f}%")
    
    print("\nNOx Levels:")
    print(f"Average Before Filtration: {df['nox_level_before'].mean():.2f} ppm")
    print(f"Average After Filtration: {df['nox_level_after'].mean():.2f} ppm")
    print(f"Average Efficiency: {df['nox_efficiency'].mean():.2f}%")

def main():
    try:
        # Fetch data from database
        df = fetch_data()
        
        if df.empty:
            print("No data found in the database.")
            return
        
        # Generate plots
        plot_levels(df)
        plot_efficiency(df)
        
        # Print statistics
        print_statistics(df)
        
        print("\nGraphs have been saved as 'pollutant_levels.png' and 'filtration_efficiency.png'")
        
    except Exception as e:
        print(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    main() 