import { existsSync, readFileSync } from 'fs';

const envConfig = () => {
  const currEnv = process.env.npm_lifecycle_event || 'dev';
  const envFilePath = currEnv.includes('test') || currEnv.includes('cover') ? '.env.test' : '.env';

  if (existsSync(envFilePath)) {
    const envFileLines = readFileSync(envFilePath, 'utf-8').trim().split('\n');

    for (const line of envFileLines) {
      const delimIdx = line.indexOf('=');
      const key = line.substring(0, delimIdx);
      const value = line.substring(delimIdx + 1);
      process.env[key] = value;
    }
  }
};

export default envConfig;
