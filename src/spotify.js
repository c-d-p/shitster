const SpotifyWebApi = require('spotify-web-api-node');
const fs = require('fs');
const csv = require('csv-parser');

module.exports = {
    Spotify: class {
        constructor() {
            this.spotifyApi = new SpotifyWebApi({
                clientId: '99be5860d7c540539595be41bf31e5a3',
                clientSecret: '2c0092ac0b6e40faad82e98bf419fb72',
                redirectUri: 'http://localhost:3000/callback'
            });
    
            this.scopes = [
                'user-read-private', 
                'user-read-email',
                'user-modify-playback-state'
            ];
            this.state = "cdp-test-state-tmp";
        }
    
        getSongID(track, artist) {
            return this.spotifyApi.searchTracks(`track:${track} artist:${artist}`)
                .then(data => {
                    const trackID = data.body.tracks.items[0].id;
                    return trackID;
                })
                .catch(err => {
                    console.log('Something went wrong!', err);
                    throw err; // Re-throwing the error so it can be handled by the caller
                });
        }
    
        playSong(trackID) {
            console.log(trackID);
            this.spotifyApi.addToQueue(`spotify:track:${trackID}`).then(() => {console.log('after queue'); this.spotifyApi.skipToNext()});
        }

        resume() {
            this.spotifyApi.play();
        }

        pause() {
            this.spotifyApi.pause();
        }

        loadDeck(deckName, mode) {
            console.log(`Loading deck: ${deckName}; ${mode}`);
            if (mode == "deck") {
                return new Promise((resolve, reject) => {
                    this.deck = {mode: "deck", currentDeck: []};
                    fs.createReadStream(`../decks/${deckName}.csv`)
                        .pipe(csv())
                        .on('data', (data) => this.deck.currentDeck.push(data))
                        .on('end', () => {
                            console.log(this.deck);
                            resolve(this.deck);  // Resolve with the deck data
                        })
                        .on('error', (err) => {
                            reject(err);  // Reject if there's an error
                        });
                });
            } else if (mode == "public-playlist") {
                return new Promise((resolve, reject) => {
                    this.deck = {mode: "public-playlist", currentDeck: []};
                    this.spotifyApi.getPlaylist(deckName).then((loaded) => {
                        loaded.body.tracks.items.forEach(song => {
                            this.deck.currentDeck.push(song);
                        });
                        resolve(this.deck);
                    });
                });
            }
        }
    }
}
