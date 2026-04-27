import {
  connect,
  NatsConnection,
  StringCodec,
  Subscription as NatsSub,
} from "nats";

const sc = StringCodec();
let nc: NatsConnection | null = null;

export async function connectNats(
  serviceName: string,
): Promise<NatsConnection | null> {
  const url = process.env.NATS_URL || "nats://localhost:4222";
  try {
    nc = await connect({ servers: url, name: serviceName });
    console.log(`[${serviceName}] Connected to NATS at ${url}`);
    return nc;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[${serviceName}] Failed to connect to NATS:`, message);
    return null;
  }
}

export async function publish(subject: string, data: unknown): Promise<void> {
  if (!nc) return;
  nc.publish(subject, sc.encode(JSON.stringify(data)));
}

export async function subscribe(
  subject: string,
  handler: (data: unknown, msg: unknown) => Promise<void>,
): Promise<NatsSub | undefined> {
  if (!nc) return;
  const sub = nc.subscribe(subject);
  (async () => {
    for await (const msg of sub) {
      try {
        const data: unknown = JSON.parse(sc.decode(msg.data));
        await handler(data, msg);
      } catch (err) {
        console.error(`Error handling message on ${subject}:`, err);
      }
    }
  })();
  return sub;
}

export async function closeNats(): Promise<void> {
  if (nc) {
    await nc.drain();
    nc = null;
  }
}
