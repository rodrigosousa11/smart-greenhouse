const serverUrl = 'https://se-kc56.onrender.com';
let authToken = localStorage.getItem('authToken');
let manualUpdateInProgress = false;
let debounceTimeout;

if (authToken) {
    showDashboard();
}

function showDashboard() {
    document.getElementById('login').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    fetchSensorData();
    fetchStatus();
    setInterval(fetchSensorData, 2500);
    setInterval(fetchStatus, 2500);
}

async function login() {
    authToken = document.getElementById('tokenInput').value;
    try {
        const response = await axios.get(`${serverUrl}/sensor`, {
            headers: {
                'Authorization': authToken
            }
        });
        localStorage.setItem('authToken', authToken);
        showDashboard();
    } catch (error) {
        document.getElementById('errorMessage').style.display = 'block';
        console.error('Invalid token:', error);
    }
}

function logout() {
    localStorage.removeItem('authToken');
    authToken = null;
    document.getElementById('login').style.display = 'flex';
    document.getElementById('dashboard').style.display = 'none';
}

async function fetchSensorData() {
    try {
        const response = await axios.get(`${serverUrl}/sensor`, {
            headers: {
                'Authorization': authToken
            }
        });
        const temperature = response.data.temperature;
        const humidity = response.data.humidity;
        updateCharts(temperature, humidity);
        updateCurrentValues(temperature, humidity);
    } catch (error) {
        console.error('Error fetching sensor data:', error);
    }
}

async function fetchStatus() {
    if (manualUpdateInProgress) {
        return;
    }

    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(async () => {
        try {
            const response = await axios.get(`${serverUrl}/status`, {
                headers: {
                    'Authorization': authToken
                }
            });

            deviceStatus = response.data;
            updateUIStatus(deviceStatus);
        } catch (error) {
            console.error('Error fetching status:', error);
        }
    }, 500);
}

function updateUIStatus(status) {
    const { heating, cooling, heatingThreshold, coolingThreshold, manualControl } = status;

    document.getElementById('heatingButton').innerText = heating ? 'Heating ON' : 'Heating OFF';
    document.getElementById('heatingButton').className = heating ? 'on' : 'off';
    document.getElementById('coolingButton').innerText = cooling ? 'Cooling ON' : 'Cooling OFF';
    document.getElementById('coolingButton').className = cooling ? 'on' : 'off';

    if (!manualUpdateInProgress) {
        document.getElementById('heatingThresholdInput').value = heatingThreshold;
        document.getElementById('coolingThresholdInput').value = coolingThreshold;
    }

    if (manualControl) {
        document.getElementById('manualControls').style.display = 'flex';
        document.getElementById('autoButton').innerText = 'Activate Auto Mode';
        document.getElementById('thresholdInputs').style.display = 'none';
    } else {
        document.getElementById('manualControls').style.display = 'none';
        document.getElementById('autoButton').innerText = 'Deactivate Auto Mode';
        document.getElementById('thresholdInputs').style.display = 'flex';
    }
}

async function updateThresholds() {
    manualUpdateInProgress = true;
    try {
        const heatingThreshold = parseFloat(document.getElementById('heatingThresholdInput').value);
        const coolingThreshold = parseFloat(document.getElementById('coolingThresholdInput').value);

        if (isNaN(heatingThreshold) || isNaN(coolingThreshold)) {
            alert('Please enter valid numeric values for thresholds.');
            return;
        }

        const newStatus = {
            ...deviceStatus,
            heatingThreshold: heatingThreshold,
            coolingThreshold: coolingThreshold,
        };

        await axios.post(`${serverUrl}/status`, newStatus, {
            headers: { 'Authorization': authToken }
        });

        deviceStatus = newStatus;
        updateUIStatus(deviceStatus);
    } catch (error) {
        console.error('Error updating thresholds:', error);
    } finally {
        manualUpdateInProgress = false;
    }
}

async function toggleHeating() {
    const newStatus = {
        ...deviceStatus,
        heating: !deviceStatus.heating,
    };
    await updateStatus(newStatus);
}

async function toggleCooling() {
    const newStatus = {
        ...deviceStatus,
        cooling: !deviceStatus.cooling,
    };
    await updateStatus(newStatus);
}

async function toggleAuto() {
    const newStatus = {
        ...deviceStatus,
        manualControl: !deviceStatus.manualControl,
    };
    await updateStatus(newStatus);
}

async function updateStatus(newStatus) {
    try {
        await axios.post(`${serverUrl}/status`, newStatus, {
            headers: { 'Authorization': authToken }
        });
        deviceStatus = newStatus;
        updateUIStatus(deviceStatus);
    } catch (error) {
        console.error('Error updating status:', error);
    }
}

let temperatureChart;
let humidityChart;

function updateCharts(temperature, humidity) {
    if (!temperatureChart) {
        const ctxTemperature = document.getElementById('temperatureChart').getContext('2d');
        temperatureChart = new Chart(ctxTemperature, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Temperature (°C)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    fill: false,
                    data: []
                }]
            },
            options: {
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'minute'
                        }
                    },
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
    }

    if (!humidityChart) {
        const ctxHumidity = document.getElementById('humidityChart').getContext('2d');
        humidityChart = new Chart(ctxHumidity, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Humidity (%)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    fill: false,
                    data: []
                }]
            },
            options: {
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'minute'
                        }
                    },
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
    }

    const now = new Date();
    temperatureChart.data.datasets[0].data.push({ x: now, y: temperature });
    humidityChart.data.datasets[0].data.push({ x: now, y: humidity });
    temperatureChart.update();
    humidityChart.update();
}

function updateCurrentValues(temperature, humidity) {
    document.getElementById('currentTemperature').innerText = `Temperature: ${temperature.toFixed(1)} °C`;
    document.getElementById('currentHumidity').innerText = `Humidity: ${humidity.toFixed(1)} %`;
}
