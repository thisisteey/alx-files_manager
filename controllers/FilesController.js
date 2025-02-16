import path from 'path';
import { env } from 'process';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import mime from 'mime-types';
import Queue from 'bull';
import { ObjectId } from 'mongodb';
/* eslint-disable import/no-named-as-default */
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const fileQueue = new Queue('fileQueue', {
  redis: {
    host: '127.0.0.1',
    port: 6379,
  },
});

class FilesController {
  static async getUserFromToken(req) {
    const token = req.header('X-Token') || null;
    if (!token) return null;
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return null;
    const userCollection = await dbClient.usersCollection();
    const user = await userCollection.findOne({ _id: ObjectId(userId) });
    if (!user) return null;
    return user;
  }

  static pathExists(path) {
    return new Promise((resolve) => {
      fs.access(path, fs.constants.F_OK, (err) => {
        resolve(!err);
      });
    });
  }

  static async saveFileToDisk(res, filePath, data, newFile) {
    await fs.promises.writeFile(filePath, data, 'utf-8');

    const insertData = await (await dbClient.filesCollection()).insertOne(newFile);
    const respFile = { ...newFile, id: insertData.insertedId };

    delete respFile._id;
    delete respFile.localPath;

    if (respFile.type === 'image') {
      fileQueue.add({ userId: respFile.userId, fileId: respFile.id });
    }
    res.status(201).json(respFile);
  }

  static async postUpload(req, res) {
    const user = await FilesController.getUserFromToken(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const validTypes = ['folder', 'file', 'image'];
    const {
      name, type, parentId, isPublic, data,
    } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Missing name' });
      return;
    }

    if ((!type || !validTypes.includes(type))) {
      res.status(400).json({ error: 'Missing type' });
      return;
    }

    if (!data && type !== 'folder') {
      res.status(400).json({ error: 'Missing data' });
      return;
    }

    if (parentId) {
      const fileCollection = await dbClient.filesCollection();
      const parentFile = await fileCollection.findOne({ _id: ObjectId(parentId) });

      if (!parentFile) {
        res.status(400).json({ error: 'Parent not found' });
        return;
      }
      if (parentFile.type !== 'folder') {
        res.status(400).json({ error: 'Parent is not a folder' });
        return;
      }
    }

    const newFile = {
      name,
      type,
      parentId: parentId || 0,
      isPublic: isPublic || false,
      userId: user._id.toString(),
    };

    if (type === 'folder') {
      const insertData = await (await dbClient.filesCollection()).insertOne(newFile);
      newFile.id = insertData.insertedId;
      delete newFile._id;
      res.status(201).json(newFile);
    } else {
      const uploadPath = env.FOLDER_PATH || '/tmp/files_manager';
      const fullFilePath = path.join(uploadPath, uuidv4());

      newFile.localPath = fullFilePath;
      const fileData = Buffer.from(data, 'base64');

      const dirExists = await FilesController.pathExists(uploadPath);
      if (!dirExists) {
        await fs.promises.mkdir(uploadPath, { recursive: true });
      }
      FilesController.saveFileToDisk(res, fullFilePath, fileData, newFile);
    }
  }

  static async getShow(req, res) {
    const fileId = req.params.id;
    const user = await FilesController.getUserFromToken(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const fileCollection = await dbClient.filesCollection();
    const fileData = await fileCollection.findOne({
      _id: ObjectId(fileId),
      userId: user._id.toString(),
    });

    if (!fileData) {
      res.status(404).json({ error: 'Not found' });
    } else {
      fileData.id = fileData._id;
      delete fileData._id;
      delete fileData.localPath;
      res.status(200).json(fileData);
    }
  }

  static async getIndex(req, res) {
    const user = await FilesController.getUserFromToken(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const {
      parentId, page,
    } = req.query;
    const fileCollection = await dbClient.filesCollection();

    const itemsPerPage = 20;
    const currPage = page || 1;
    const skipCount = (currPage - 1) * itemsPerPage;

    let qryFilter;
    if (!parentId) {
      qryFilter = { userId: user._id.toString() };
    } else {
      qryFilter = { userId: user._id.toString(), parentId };
    }

    const fileResult = await fileCollection.aggregate([
      { $match: qryFilter },
      { $skip: skipCount },
      { $limit: itemsPerPage },
    ]).toArray();

    const fmtdFiles = fileResult.map((file) => {
      const newFile = { ...file, id: file._id };
      delete newFile._id;
      delete newFile.localPath;
      return newFile;
    });
    res.status(200).json(fmtdFiles);
  }

  static async updateFileVis(req, res, visStats) {
    const fileId = req.params.id;
    const user = await FilesController.getUserFromToken(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const fileCollection = await dbClient.filesCollection();
    const fileInfo = await fileCollection.findOne({
      userId: user._id.toString(),
      _id: ObjectId(fileId),
    });
    if (!fileInfo) {
      res.status(404).json({ error: 'Not found' });
    } else {
      const visUpdate = { $set: { isPublic: visStats } };
      await fileCollection.updateOne({ _id: ObjectId(fileId) }, visUpdate);
      const updFileVis = await fileCollection.findOne({ _id: ObjectId(fileId) });
      updFileVis.id = updFileVis._id;
      delete updFileVis._id;
      res.status(200).json(updFileVis);
    }
  }

  static putPublish(req, res) {
    FilesController.updateFileVis(req, res, true);
  }

  static putUnpublish(req, res) {
    FilesController.updateFileVis(req, res, false);
  }

  static async getFile(req, res) {
    const fileId = req.params.id;
    const { size } = req.query;
    if (!fileId) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    const user = await FilesController.getUserFromToken(req);
    const fileCollection = await dbClient.filesCollection();
    const fileDits = await fileCollection.findOne({ _id: ObjectId(fileId) });
    if (!fileDits) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    if (!user && fileDits.isPublic === false) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    if (fileDits.isPublic === false && user && fileDits.userId !== user._id.toString()) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    if (fileDits.type === 'folder') {
      res.status(400).json({ error: 'A folder doesn\'t have content' });
      return;
    }

    const targetPath = size && fileDits.type === 'image'
      ? `${fileDits.localPath}_${size}`
      : fileDits.localPath;

    if (!(await FilesController.pathExists(targetPath))) {
      res.status(404).json({ error: 'Not found' });
    } else {
      res.set('Content-Type', mime.lookup(fileDits.name));
      res.status(200).sendFile(targetPath);
    }
  }
}

export default FilesController;
