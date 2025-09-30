import fetch from 'node-fetch';

const CLIENT_ID = 'gp762nuuoqcoxypju8c569th9wz7q5';
const ACCESS_TOKEN = '3nf58gheiimd6d2bib2mth5gqbalom';
const username = 'k4lzan';

const res = await fetch(`https://api.twitch.tv/helix/users?login=${username}`, {
    headers: {
        'Client-ID': CLIENT_ID,
        'Authorization': `Bearer ${ACCESS_TOKEN}`
    }
});

const data = await res.json();
const BROADCASTER_ID = data.data[0].id; // ESTE É O NUMÉRICO
console.log('ID numérico do canal:', BROADCASTER_ID);

// access token 3nf58gheiimd6d2bib2mth5gqbalom
// client id gp762nuuoqcoxypju8c569th9wz7q5