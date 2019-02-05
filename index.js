const
    fs = require('fs'),
    path = require('path'),
    kefir = require('kefir'),
    express = require('express');

const readFileSteam = (filename)=> kefir.fromNodeCallback((cb)=> fs.readFile(filename, 'utf8', cb)).map(JSON.parse);

let app = express();
app.disable('x-powered-by');
app.get('/api/all.json', (req, res, next)=> {

    kefir
        .combine(
            ["profile", "company", "tag"].map((filename)=> readFileSteam(path.join(__dirname, '.data', [filename, 'json'].join('.')))),
            (profile, company, tag)=> ({ profile, company, tag })
        )
        .onValue((json)=> res
            .set('Cache-Control', 'public, max-age=3600')
            .json(json)
        )
        .onError((err)=> next(err));

});

app.use((req, res, next)=> next(false && res.set('Referrer-Policy', 'same-origin')), express.static(path.join(__dirname, 'public')));

app.listen(8080);