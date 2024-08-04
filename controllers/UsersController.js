import Queue from 'bull/lib/queue';
/* eslint-disable import/no-named-as-default */
import sha1 from 'sha1';
import dbClient from '../utils/db';

const userEmailQueue = new Queue('email sending');

class UsersController {
  static async postNew(req, res) {
    const email = req.body ? req.body.email : null;
    const password = req.body ? req.body.password : null;

    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }
    if (!password) {
      res.status(400).json({ error: 'Missing password' });
      return;
    }
    const existingUser = await (await dbClient.usersCollection()).findOne({ email });

    if (existingUser) {
      res.status(400).json({ error: 'Already exist' });
      return;
    }
    const insertData = await (await dbClient.usersCollection())
      .insertOne({ email, password: sha1(password) });
    const newUserId = insertData.insertedId.toString();

    userEmailQueue.add({ newUserId });
    res.status(201).json({ email, id: newUserId });
  }
}

export default UsersController;
