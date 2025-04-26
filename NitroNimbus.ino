#include <MQ135.h>

// Define sensor pins
const int sensor1Pin = A0; // Analog pin for sensor 1 (before filter)
const int sensor2Pin = A1; // Analog pin for sensor 2 (after filter)

// Initialize MQ135 sensors
MQ135 mq135_sensor1(A0); // Replace analogPin1 with the actual pin
MQ135 mq135_sensor2(A1); // Replace analogPin2 with the actual pin

// Calibration values
const float R0 = 10.0;  // Sensor resistance in clean air
const float RL = 10.0;  // Load resistance
const float VOLTAGE_REFERENCE = 5.0;
const float ADC_RESOLUTION = 1023.0;

void setup() {
  // Initialize Serial Communication
  Serial.begin(9600);
  while (!Serial) {
    ; // Wait for serial port to connect
  }

  // Calibrate sensors in clean air
  float rzero1 = mq135_sensor1.getRZero();
  float rzero2 = mq135_sensor2.getRZero();
  Serial.print("RZero values - Sensor1: ");
  Serial.print(rzero1);
  Serial.print(", Sensor2: ");
  Serial.println(rzero2);
}

void loop() {
  // Read raw sensor values
  float sensor1Value = analogRead(sensor1Pin);
  float sensor2Value = analogRead(sensor2Pin);
  
  // Convert to voltage
  float voltage1 = (sensor1Value / ADC_RESOLUTION) * VOLTAGE_REFERENCE;
  float voltage2 = (sensor2Value / ADC_RESOLUTION) * VOLTAGE_REFERENCE;
  
  // Calculate resistance
  float rs1 = ((VOLTAGE_REFERENCE * RL) / voltage1) - RL;
  float rs2 = ((VOLTAGE_REFERENCE * RL) / voltage2) - RL;
  
  // Calculate PPM values
  float co_before = mq135_sensor1.getPPM();
  float nox_before = mq135_sensor1.getPPM() * 0.5; // NOx is typically about half of CO
  float co_after = mq135_sensor2.getPPM();
  float nox_after = mq135_sensor2.getPPM() * 0.5;
  
  // Calculate reduction rates
  float co_reduction = ((co_before - co_after) / co_before) * 100;
  float nox_reduction = ((nox_before - nox_after) / nox_before) * 100;

  // Get current timestamp
  unsigned long timestamp = millis(); // Replace with RTC module if real-time is needed
  
  // Create JSON data
  String jsonData = "{";
  jsonData += "\"timestamp\":" + String(timestamp) + ",";
  jsonData += "\"co_before\":" + String(co_before, 2) + ",";
  jsonData += "\"nox_before\":" + String(nox_before, 2) + ",";
  jsonData += "\"co_after\":" + String(co_after, 2) + ",";
  jsonData += "\"nox_after\":" + String(nox_after, 2) + ",";
  jsonData += "\"co_reduction\":" + String(co_reduction, 1) + ",";
  jsonData += "\"nox_reduction\":" + String(nox_reduction, 1);
  jsonData += "}";
  
  // Send data
  Serial.println(jsonData);
  
  // Wait before next reading
  delay(2000);
}