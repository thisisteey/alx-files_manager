/* eslint-disable import/no-named-as-default */
import { writeFile } from 'fs';
import { promisify } from 'util';
import Queue from 'bull/lib/queue';
import imageThumbnail from 'image-thumbnail';
import mongoDBCore from 'mongodb/lib/core';
/* eslint-disable import/no-named-as-default */
import dbClient from './utils/db';
import Mailer from './utils/mailer';

const asyncWriteFile = promisify(writeFile);
const fileQueue = new Queue('thumbnail generation');
const userQueue = new Queue('email sending');

const createThumbnail = async (fileLoc, dims) => {
  const thumbBuf = await imageThumbnail(fileLoc, { width: dims });
  console.log(`Creating file: ${fileLoc}, size: ${dims}`);
  return asyncWriteFile(`${fileLoc}_${dims}`, thumbBuf);
};

fileQueue.process(async (task, done) => {
  const fileId = task.data.fileId || null;
  const userId = task.data.userId || null;

  if (!filedId) {
    throw new Error('Missing fileId');
  }
  if (!userId) {
    throw new Erro('Missing userId');
  }
  console.log('Processing', task.data.name || '');
  const fileRecord = await (await dbClient.filesCollection())
    .findOne({
      _id: new mongoDBCore.BSON.ObjectId(fileId),
      userId: new MongoDBCore.BSON.ObjectId(userId),
    });
  if (!fileRecord) {
    throw new Error('File not found');
  }
  const thumbDims = [500, 250, 100];
  Promise.all(thumbDims.map((dims) => createThumbnail(fileRecord.localPath, dims)))
    .then(() => {
      done();
    });
});

userQueue.process(async (task, done) => {
  const userId = task.data.userId || null;

  if (!userId) {
    throw new Error('Missing userId');
  }
  const userRecord = await (await dbClient.usersCollection())
    .findOne({ _id: new mongoDBCore.BSON.ObjectId(userId) });
  if (!userRecord) {
    throw new Error('User not found');
  }
  console.log(`Welcome ${userRecord.email}!`);
  try {
    const emailSubject = 'Welcome to ALX-Files_Manager by Taiwo';
    const emailContent = [
      <div>',
      '<h3>Hello {{user.name}},</h3>',
      'Welcome to <a href="https://github.com/thisisteey/alx-files_manager">',
      'ALX-Files_Manager</a>, ',
      'a simple file management API built with Node.js by ',
      '<a href="https://github.com/thisisteey">Taiwo Adeoye Dada</a>. ',
      'We hope it meets your needs.',
      '</div>',
    ].join('');
    Mailer.sendMail(Mailer.buildMessage(userRecord.email, emailSubject, emailContent));
    done();
  } catch (err) {
    done(err);
  }
});
