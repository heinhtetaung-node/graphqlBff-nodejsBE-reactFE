const { connect, StringCodec } = require("nats");

const sc = StringCodec();
let nc = null;

async function connectNats(serviceName) {
  const url = process.env.NATS_URL || "nats://localhost:4222";
  try {
    nc = await connect({ servers: url, name: serviceName });
    console.log(`[${serviceName}] Connected to NATS at ${url}`);
    return nc;
  } catch (err) {
    console.error(`[${serviceName}] Failed to connect to NATS:`, err.message);
    // Non-fatal — services work without NATS, just no events
    return null;
  }
}

async function publish(subject, data) {
  if (!nc) return;
  nc.publish(subject, sc.encode(JSON.stringify(data)));
}

async function subscribe(subject, handler) {
  if (!nc) return;
  const sub = nc.subscribe(subject);
  (async () => {
    for await (const msg of sub) {
      try {
        const data = JSON.parse(sc.decode(msg.data));
        await handler(data, msg);
      } catch (err) {
        console.error(`Error handling message on ${subject}:`, err);
      }
    }
  })();
  return sub;
}

async function closeNats() {
  if (nc) {
    await nc.drain();
    nc = null;
  }
}

module.exports = { connectNats, publish, subscribe, closeNats };
