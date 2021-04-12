const express = require('express');
const bodyParser = require('body-parser');

const startExpressAppPromise = (app, port) => {
    return new Promise((resolve) => {
        const server = app.listen(port, () => resolve(server));
    });
};

const startDummyServer = async (port) => {
    const app = express();
    app.use(bodyParser.urlencoded({
        extended: true,
    }));
    app.use(bodyParser.json());

    app.get('/json', (req, res) => {
        res.json({ test: 123 });
    });

    app.post('/jsonPost', (req, res) => {
        res.json(req.body);
    });

    app.get('/html', (req, res) => {
        res.setHeader('content-type', 'text/html');
        res.send('<html></html>');
    });

    return startExpressAppPromise(app, port);
};

module.exports = {
    startDummyServer,
};
