import { Server } from 'http';
import zlib from 'zlib';
import express, { Express } from 'express';
import bodyParser from 'body-parser';

const startExpressAppPromise = (app: Express, port: number): Promise<Server> => {
    return new Promise((resolve) => {
        const server = app.listen(port, () => resolve(server));
    });
};

const parseHeaders = (rawHeaders: string[], obj: any = {}) => {
    for (let i = 0; i < rawHeaders.length; i += 2) {
        // We don't want to normalize them.
        const key = rawHeaders[i].toString()/* .toLowerCase() */;
        let val = obj[key];

        if (!val) {
            obj[key] = rawHeaders[i + 1].toString();
        } else {
            if (!Array.isArray(val)) {
                val = [val];
                obj[key] = val;
            }

            val.push(rawHeaders[i + 1].toString());
        }
    }

    return obj;
};

const startDummyServer = async (port = 0): Promise<Server> => {
    const app = express();
    app.use(bodyParser.urlencoded({
        extended: true,
    }));
    app.use(bodyParser.json());

    app.get('/json', (_req, res) => {
        res.json({ test: 123 });
    });

    app.post('/jsonPost', (req, res) => {
        res.json(req.body);
    });

    app.get('/html', (_req, res) => {
        res.setHeader('content-type', 'text/html');
        res.send('<html></html>');
    });

    app.get('/headers', (req, res) => {
        res.json(parseHeaders(req.rawHeaders));
    });

    app.get('/query', (req, res) => {
        res.send(req.url.slice(req.url.indexOf('?') + 1));
    });

    app.get('/invalid-deflate', (_req, res) => {
        res.setHeader('content-encoding', 'deflate');
        res.send(zlib.deflateRawSync('ok'));
    });

    return startExpressAppPromise(app, port);
};

export {
    startDummyServer,
};
