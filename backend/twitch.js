import fetch from "node-fetch";

// 🔧 Normaliza o condition de acordo com o tipo de evento
function getCondition(type, broadcasterId) {
    switch (type) {
        case "channel.follow":
            return {
                broadcaster_user_id: broadcasterId,
                moderator_user_id: broadcasterId
            };
        case "channel.raid":
            return {
                from_broadcaster_user_id: "",   // Twitch sempre inclui, mesmo vazio
                to_broadcaster_user_id: broadcasterId
            };
        default:
            return { broadcaster_user_id: broadcasterId };
    }
}

function sameCondition(a, b) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    return keysA.every(k => String(a[k]) === String(b[k]));
}

async function hasSubscription(type, condition, clientId, accessToken) {
    const res = await fetch("https://api.twitch.tv/helix/eventsub/subscriptions", {
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Client-Id": clientId
        }
    });
    const data = await res.json();

    // console.log("🔎 Subs atuais:", JSON.stringify(data, null, 2));

    return data.data.some(
        sub =>
            sub.type === type &&
            sameCondition(sub.condition, condition)
    );
}

export async function createSub(type, version, condition, clientId, accessToken, callbackUrl, secret) {

    const exists = await hasSubscription(type, condition, clientId, accessToken);
    if (exists) {
        console.log(`⚠️ Já existe subscription para ${type}`);
        return;
    }
    console.log(condition);
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

    const events = [
        { type: "channel.follow", version: "2" },
        { type: "channel.subscribe", version: "1" },
        { type: "channel.cheer", version: "1" },
        { type: "channel.raid", version: "1" },
        { type: "channel.goal.begin", version: "1" },
        { type: "channel.goal.progress", version: "1" },
        { type: "channel.goal.end", version: "1" }
    ];

    // Cria/valida todas as subs
    for (const { type, version } of events) {
        const condition = getCondition(type, broadcasterId);
        await createSub(type, version, condition, clientId, userAccessToken, callbackUrl, clientSecret);
    }
}
