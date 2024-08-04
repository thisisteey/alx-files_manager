import express from 'express';

const configMiddlewares = (api) => {
  api.use(express.json({ limit: '200mb' }));
};

export default configMiddlewares;
