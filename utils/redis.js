import { promisify } from 'util';
import { createClient } from 'redis';

class RedisClient {
  constructor() {
    this.clientInst = createClient();
    this.isConnected = true;
    this.clientInst.on('error', (err) => {
      console.error('Redis client connection failed:', err.message || err.toString());
      this.isConnected = false;
    });
    this.clientInst.on('connect', () => {
      this.isConnected = true;
    });
  }

  isAlive() {
    return this.isConnected;
  }

  async get(key) {
    return promisify(this.clientInst.GET).bind(this.clientInst)(key);
  }

  async set(key, value, duration) {
    await promisify(this.clientInst.SETEX)
      .bind(this.clientInst)(key, duration, value);
  }

  async del(key) {
    await promisify(this.clientInst.DEL).bind(this.clientInst)(key);
  }
}

export const redisClient = new RedisClient();
export default redisClient;
