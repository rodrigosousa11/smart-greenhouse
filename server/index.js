const express = require('express');
const bodyParser = require('body-parser');
const app = express();

let temperature = 0;
let humidity = 0;
let heating = false;
let cooling = false;

app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Greenhouse Control Server');
});

app.get('/sensor', (req, res) => {
    res.json({ temperature, humidity });
});

app.post('/sensor', (req, res) => {
    temperature = req.body.temperature;
    humidity = req.body.humidity;
    res.sendStatus(200);
});

app.get('/heat', (req, res) => {
    heating = req.query.state === 'true';
    res.sendStatus(200);
});

app.get('/cool', (req, res) => {
    cooling = req.query.state === 'true';
    res.sendStatus(200);
});

app.get('/status', (req, res) => {
    res.json({ heating, cooling });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
