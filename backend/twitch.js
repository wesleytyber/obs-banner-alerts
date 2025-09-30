// import fetch from 'node-fetch';
// import dotenv from "dotenv";

// dotenv.config();

// const CLIENT_ID = process.env.CLIENT_ID;
// const CLIENT_SECRET = process.env.CLIENT_SECRET;
// const CALLBACK_URL = process.env.CALLBACK_URL;
// const BROADCASTER_ID = process.env.BROADCASTER_ID;

// let ACCESS_TOKEN = '';

// async function createSub(type, version, condition) {
//     const res = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
//         method: 'POST',
//         headers: {
//             'Client-ID': CLIENT_ID,
//             'Authorization': `Bearer ${ACCESS_TOKEN}`,
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             type,
//             version,
//             condition,
//             transport: {
//                 method: 'webhook',
//                 callback: CALLBACK_URL,
//                 secret: CLIENT_SECRET
//             }
//         })
//     });

//     const data = await res.json();
//     console.log(`📩 Assinatura ${type}:`, JSON.stringify(data, null, 2));
// }

// export async function setupEventSub() {
//     // 1️⃣ Obter App Access Token
//     const tokenRes = await fetch(
//         `https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`,
//         { method: 'POST' }
//     );
//     const tokenData = await tokenRes.json();
//     ACCESS_TOKEN = tokenData.access_token;
//     console.log('✅ Access token obtido:', ACCESS_TOKEN);

//     // 2️⃣ Criar todas as assinaturas
//     await createSub('channel.follow', '2', {
//         broadcaster_user_id: BROADCASTER_ID,
//         moderator_user_id: BROADCASTER_ID
//     });

//     await createSub('channel.subscribe', '1', {
//         broadcaster_user_id: BROADCASTER_ID
//     });

//     await createSub('channel.cheer', '1', {
//         broadcaster_user_id: BROADCASTER_ID
//     });

//     await createSub('channel.raid', '1', {
//         to_broadcaster_user_id: BROADCASTER_ID
//     });

//     await createSub("channel.goal.begin", "1", {
//         broadcaster_user_id: BROADCASTER_ID
//     });

//     await createSub("channel.goal.progress", "1", {
//         broadcaster_user_id: BROADCASTER_ID
//     });

//     await createSub("channel.goal.end", "1", {
//         broadcaster_user_id: BROADCASTER_ID
//     });

// }

import fetch from "node-fetch";

export async function createSub(type, version, condition, clientId, accessToken, callbackUrl, secret) {
    const res = await fetch("https://api.twitch.tv/helix/eventsub/subscriptions", {
        method: "POST",
        headers: {
            "Client-ID": clientId,
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            type,
            version,
            condition,
            transport: {
                method: "webhook",
                callback: callbackUrl,
                secret
            }
        })
    });

    const data = await res.json();
    console.log(`📩 Assinatura ${type}:`, JSON.stringify(data, null, 2));
}

export async function setupEventSub(userAccessToken, broadcasterId, clientId, callbackUrl, clientSecret) {
    console.log("🚀 Criando assinaturas para:", broadcasterId);

    await createSub("channel.follow", "2", {
        broadcaster_user_id: broadcasterId,
        moderator_user_id: broadcasterId
    }, clientId, userAccessToken, callbackUrl, clientSecret);

    await createSub("channel.subscribe", "1", {
        broadcaster_user_id: broadcasterId
    }, clientId, userAccessToken, callbackUrl, clientSecret);

    await createSub("channel.cheer", "1", {
        broadcaster_user_id: broadcasterId
    }, clientId, userAccessToken, callbackUrl, clientSecret);

    await createSub("channel.raid", "1", {
        to_broadcaster_user_id: broadcasterId
    }, clientId, userAccessToken, callbackUrl, clientSecret);

    await createSub("channel.goal.begin", "1", {
        broadcaster_user_id: broadcasterId
    }, clientId, userAccessToken, callbackUrl, clientSecret);

    await createSub("channel.goal.progress", "1", {
        broadcaster_user_id: broadcasterId
    }, clientId, userAccessToken, callbackUrl, clientSecret);

    await createSub("channel.goal.end", "1", {
        broadcaster_user_id: broadcasterId
    }, clientId, userAccessToken, callbackUrl, clientSecret);
}
