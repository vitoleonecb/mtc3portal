import { createClient } from 'redis';

const client = createClient({ url: 'redis://127.0.0.1:6379' });

async function testRedis() {
    await client.connect();
    await client.set('hello','world');
    const value = await client.get('hello');
    console.log(`Redis says: ${value}`);
}

testRedis();