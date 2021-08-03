const express = require('express');
const bodyParser = require('body-parser');

const startExpressAppPromise = (app, port) => {
    return new Promise((resolve) => {
        const server = app.listen(port, () => resolve(server));
    });
};

const parseHeaders = (headers, obj = {}) => {
    for (let i = 0; i < headers.length; i += 2) {
        // We don't want to normalize them.
        const key = headers[i].toString()/* .toLowerCase() */;
        let val = obj[key];

        if (!val) {
            obj[key] = headers[i + 1].toString();
        } else {
            if (!Array.isArray(val)) {
                val = [val];
                obj[key] = val;
            }

            val.push(headers[i + 1].toString());
        }
    }

    return obj;
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

    app.get('/headers', (req, res) => {
        res.json(parseHeaders(req.rawHeaders));
    });

    return startExpressAppPromise(app, port);
};

module.exports = {
    startDummyServer,
};
