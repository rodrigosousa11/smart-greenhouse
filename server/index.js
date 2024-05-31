const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

const AUTH_TOKEN = '123456';

app.use(cors());
app.use(express.json());

let sensorData = {
    temperature: 0,
    humidity: 0
};

let deviceStatus = {
    heating: false,
    cooling: false,
    manualControl: false,
    reactivateAuto: false
};

app.use((req, res, next) => {
    const token = req.headers['authorization'];
    if (token === AUTH_TOKEN) {
        next();
    } else {
        res.status(403).json({ error: 'Acesso negado' });
    }
});

app.post('/sensor', (req, res) => {
    console.log('Received /sensor POST request with body:', req.body);
    const { temperature, humidity } = req.body;
    if (temperature !== undefined && humidity !== undefined) {
        sensorData = { temperature, humidity };
        console.log('Valid sensor data received:', sensorData);
        res.status(200).send('Sensor data received');
    } else {
        console.log('Invalid sensor data received:', req.body);
        res.status(400).send('Invalid sensor data');
    }
});

app.get('/sensor', (req, res) => {
    console.log('Received /sensor GET request');
    res.json(sensorData);
});

app.get('/status', (req, res) => {
    console.log('Received /status GET request');
    res.json(deviceStatus);
});

app.post('/status', (req, res) => {
    console.log('Received /status POST request with body:', req.body);
    const { heating, cooling, manualControl, reactivateAuto } = req.body;
    if (heating !== undefined && cooling !== undefined && manualControl !== undefined && reactivateAuto !== undefined) {
        deviceStatus = { heating, cooling, manualControl, reactivateAuto };
        console.log('Valid device status received:', deviceStatus);
        res.status(200).send('Device status updated');
    } else {
        console.log('Invalid device status received:', req.body);
        res.status(400).send('Invalid device status');
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
