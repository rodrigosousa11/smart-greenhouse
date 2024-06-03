#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

#define DHTPIN D4
#define DHTTYPE DHT11
#define HEATER_PIN D5
#define FAN_PIN D6

const char* ssid = "Vodafone-AD8126";
const char* password = "zVB6888Weq";
const char* serverUrl = "https://se-kc56.onrender.com";
const char* authToken = "123456";

DHT dht(DHTPIN, DHTTYPE);

bool heating = false;
bool cooling = false;
bool manualControl = false;

float heatingThreshold = 18.0;
float coolingThreshold = 25.0;

WiFiClientSecure wifiClient;

void updateDevices() {
    if (heating) {
        digitalWrite(HEATER_PIN, HIGH);
        digitalWrite(FAN_PIN, HIGH);
        Serial.println("Heater and Fan ON");
    } else if (cooling) {
        digitalWrite(HEATER_PIN, LOW);
        digitalWrite(FAN_PIN, HIGH);
        Serial.println("Fan ON, Heater OFF");
    } else {
        digitalWrite(HEATER_PIN, LOW);
        digitalWrite(FAN_PIN, LOW);
        Serial.println("Heater and Fan OFF");
    }
}

void sendStatusToServer() {
    HTTPClient http;
    String statusUrl = String(serverUrl) + "/status";
    http.begin(wifiClient, statusUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", authToken);

    StaticJsonDocument<200> doc;
    doc["heating"] = heating;
    doc["cooling"] = cooling;
    doc["manualControl"] = manualControl;
    doc["heatingThreshold"] = heatingThreshold;
    doc["coolingThreshold"] = coolingThreshold;
    String jsonData;
    serializeJson(doc, jsonData);

    Serial.print("Sending status JSON data: ");
    Serial.println(jsonData);

    int httpResponseCode = http.POST(jsonData);
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);

    if (httpResponseCode != 200) {
        int retryCount = 0;
        while (httpResponseCode != 200 && retryCount < 3) {
            delay(1000);
            httpResponseCode = http.POST(jsonData);
            Serial.print("Retry HTTP Response code: ");
            Serial.println(httpResponseCode);
            retryCount++;
        }
    }
    http.end();
}

void setup() {
    Serial.begin(115200);
    WiFi.begin(ssid, password);

    while (WiFi.status() != WL_CONNECTED) {
        delay(1000);
        Serial.println("Connecting to WiFi...");
    }

    Serial.println("Connected to WiFi");
    Serial.println(WiFi.localIP());

    wifiClient.setInsecure();

    dht.begin();
    pinMode(HEATER_PIN, OUTPUT);
    pinMode(FAN_PIN, OUTPUT);
    digitalWrite(HEATER_PIN, LOW);
    digitalWrite(FAN_PIN, LOW);
}

void loop() {
    if (WiFi.status() == WL_CONNECTED) {
        float h = dht.readHumidity();
        float t = dht.readTemperature();

        if (!isnan(h) && !isnan(t)) {
            Serial.print("Temperature: ");
            Serial.println(t);
            Serial.print("Humidity: ");
            Serial.println(h);

            if (!manualControl) {
                bool newHeating = (t < heatingThreshold);
                bool newCooling = (t > coolingThreshold);

                if (newHeating != heating || newCooling != cooling) {
                    heating = newHeating;
                    cooling = newCooling;
                    updateDevices();
                    sendStatusToServer();
                }
            }

            HTTPClient http;
            String sensorUrl = String(serverUrl) + "/sensor";
            http.begin(wifiClient, sensorUrl);
            http.addHeader("Content-Type", "application/json");
            http.addHeader("Authorization", authToken);

            StaticJsonDocument<200> doc;
            doc["temperature"] = t;
            doc["humidity"] = h;
            String jsonData;
            serializeJson(doc, jsonData);

            Serial.print("Sending JSON data: ");
            Serial.println(jsonData);

            int httpResponseCode = http.POST(jsonData);
            Serial.print("HTTP Response code: ");
            Serial.println(httpResponseCode);

            if (httpResponseCode != 200) {
                int retryCount = 0;
                while (httpResponseCode != 200 && retryCount < 3) {
                    delay(1000);
                    httpResponseCode = http.POST(jsonData);
                    Serial.print("Retry HTTP Response code: ");
                    Serial.println(httpResponseCode);
                    retryCount++;
                }
            }
            http.end();
        } else {
            Serial.println("Failed to read from DHT sensor!");
            delay(5000);
        }

        HTTPClient http;
        String statusUrl = String(serverUrl) + "/status";
        http.begin(wifiClient, statusUrl);
        http.addHeader("Authorization", authToken);
        int httpResponseCode = http.GET();
        Serial.print("HTTP Response code: ");
        Serial.println(httpResponseCode);
        if (httpResponseCode == 200) {
            String payload = http.getString();
            Serial.print("Received payload: ");
            Serial.println(payload);
            StaticJsonDocument<200> doc;
            deserializeJson(doc, payload);
            bool serverHeating = doc["heating"];
            bool serverCooling = doc["cooling"];
            bool serverManualControl = doc["manualControl"];
            float serverHeatingThreshold = doc["heatingThreshold"];
            float serverCoolingThreshold = doc["coolingThreshold"];

            manualControl = serverManualControl;
            if (manualControl) {
                heating = serverHeating;
                cooling = serverCooling;
            }

            heatingThreshold = serverHeatingThreshold;
            coolingThreshold = serverCoolingThreshold;

            updateDevices();
        } else {
            Serial.print("Error on HTTP request: ");
            Serial.println(httpResponseCode);
        }
        http.end();
    } else {
        Serial.println("WiFi not connected");
        WiFi.begin(ssid, password);
    }
    delay(2500);
}
