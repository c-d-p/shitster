const express = require('express');
const ejs = require('ejs');
const path = require('path');
const tspotify = require('./spotify');
const { log } = require('console');

spotify = new tspotify.Spotify();

const app = express();
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname.slice(0,-3)+'public'));

var currentDeck;

// routes
app.get('/', (req, res) => {
    res.redirect('/home');
});

app.get('/home', (req, res) => {
    res.render("../../public/home.ejs");
});

app.get('/main', (req, res) => {
    res.render("../../public/main.ejs", { currentDeck });
});

app.get('/login', (req, res) => {
    res.redirect(spotify.spotifyApi.createAuthorizeURL(spotify.scopes));
});

app.get('/callback', (req, res) => {
    const error = req.query.error;
    const code = req.query.code;
    const state = req.query.state;

    if (error) {
        console.error('Callback Error:', error);
        res.send(`Callback Error: ${error}`);
        return;
    }

    spotify.spotifyApi
        .authorizationCodeGrant(code)
        .then(data => {
            const access_token = data.body['access_token'];
            const refresh_token = data.body['refresh_token'];
            const expires_in = data.body['expires_in'];

            spotify.spotifyApi.setAccessToken(access_token);
            spotify.spotifyApi.setRefreshToken(refresh_token);

            console.log(
                `Sucessfully retreived access token. Expires in ${expires_in}s.`
            );
            res.redirect('/home?logged=true');
            setInterval(async () => {
                const data = await spotify.spotifyApi.refreshAccessToken();
                const access_token = data.body['access_token'];
        
                console.log('The access token has been refreshed!');
                spotify.spotifyApi.setAccessToken(access_token);
              }, expires_in / 2 * 1000);
            })
        .catch(error => {
            console.error('Error getting Tokens:', error);
            res.send(`Error getting Tokens: ${error}`);
        });
});

app.get('/start', (req, res) => {
    
});

app.post('/resume', (req, res) => {
    spotify.resume();
});

app.post('/pause', (req, res) => {
    spotify.pause();
});

app.post('/load-deck', async (req, res) => {
    currentDeck = await spotify.loadDeck(req.body.deckName, req.body.mode);
    res.json(currentDeck);
});

app.get('/get-deck', (req, res) => {
    res.json(currentDeck);
});

app.post('/get-song-id', (req, res) => {
    let title = req.body.title;
    let artist = req.body.artist;

    spotify.getSongID(title, artist)
        .then(trackID => {
            res.json({"trackID": trackID});
        })
        .catch(err => {
            console.log('Error:', err);
            res.status(500).send('Something went wrong!');
        });
});

app.post('/get-song-details', (req, res) => {
    let trackID = req.body.trackID;

    spotify.spotifyApi.getTrack(trackID)
        .then(rsp => {
            year = rsp.body.album.release_date;
            image = rsp.body.album.images;
            res.json({"year": year, "image": image});
        })
        .catch(err => {
            console.log('Error:', err);
            res.status(500).send('Something went wrong!');
        });
});

app.post('/play-song', (req, res) => {
    console.log(req.body);
    spotify.playSong(req.body.trackID);
    res.send("Success!");
});

app.listen(3000, () => {
    console.log("Server started on port 3000");
    spotify.login
}); 