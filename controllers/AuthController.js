import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
/* eslint-disable import/no-named-as-default */
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.header('Authorization') || null;
    if (!authHeader) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const credentials = Buffer.from(authHeader.split(' ')[1],
      'base64').toString('utf-8');
    const [email, password] = credentials.split(':');
    if (!email || !password) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userCollection = await dbClient.usersCollection();
    const passwordHash = createHash('sha1').update(password).digest('hex');
    const user = await userCollection.findOne({ email, password: passwordHash });
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const token = uuidv4();
    await redisClient.set(`auth_${token}`, user._id.toString(), 24 * 60 * 60);
    res.status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.header('X-Token') || null;

    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const user = await redisClient.get(`auth_${token}`);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    res.status(204).send();
  }
}

export default AuthController;
