import envConfig from '../utils/env_config';

const startServer = (api) => {
  envConfig();
  const port = process.env.PORT || 5000;
  const currEnv = process.env.npm_lifecycle_event || 'dev';
  api.listen(port, () => {
    console.log(`[${currEnv}] API has started listening at port:${port}`);
  });
};

export default startServer;
