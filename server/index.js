const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let sensorData = {
    temperature: 0,
    humidity: 0
};

let deviceStatus = {
    heating: false,
    cooling: false
};

app.post('/sensor', (req, res) => {
    const { temperature, humidity } = req.body;
    sensorData = { temperature, humidity };
    console.log('Received sensor data:', sensorData); // Add this line
    res.status(200).send('Sensor data received');
});

app.get('/sensor', (req, res) => {
    res.json(sensorData);
});

app.get('/status', (req, res) => {
    res.json(deviceStatus);
});

app.post('/status', (req, res) => {
    const { heating, cooling } = req.body;
    deviceStatus = { heating, cooling };
    console.log('Updated device status:', deviceStatus); // Add this line
    res.status(200).send('Device status updated');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
