/* eslint-disable import/no-named-as-default */
import { expect } from 'chai';
import redisClient from '../../utils/redis';

describe('+ RedisClient Utility Tests', () => {
  before(function (done) {
    this.timeout(10000);
    setTimeout(done, 4000);
  });

  it('+ verify redisClient is operational', () => {
    expect(redisClient.isAlive()).to.equal(true);
  });

  it('+ correctly sets and gets a value', async function () {
    await redisClient.set('sampleKey', 246, 10);
    expect(await redisClient.get('sampleKey')).to.equal('246');
  });

  it('+ correctly sets and gets an expired value', async function () {
    await redisClient.set('tempKey', 135, 1);
    setTimeout(async () => {
      expect(await redisClient.get('tempKey')).to.not.equal('135');
    }, 2000);
  });

  it('+ correctly sets and gets a deleted value', async function () {
    await redisClient.set('valTestKey', 687, 10);
    await redisClient.del('valTestKey');
    setTimeout(async () => {
      console.log('del: valTestKey ->', await redisClient.get('valTestKey'));
      expect(await redisClient.get('valTestKey')).to.be.null;
    }, 2000);
  });
});
