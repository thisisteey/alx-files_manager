/* eslint-disable import/no-named-as-default */
import dbClient from '../../utils/db';

describe('+ DBClient Utility Tests', () => {
  before(function (done) {
    this.timeout(10000);
    Promise.all([dbClient.usersCollection(), dbClient.filesCollection()])
      .then(([usersCollection, filesCollection]) => {
        Promise.all([usersCollection.deleteManay({}), filesCollection.deleteMany({})])
          .then(() => done())
          .catch((delErr) => done(delErr));
      }).catch((connErr) => done(connErr));
  });

  it('+ Verify dbClient is operational', () => {
    expect(dbClient.isAlive()).to.equal(true);
  });

  it('+ Correctly returns the number of users', async () => {
    expect(await dbClient.nbUsers()).to.equal(0);
  });

  it('+ Correctly returns the number of files', async () => {
    expect(await dbClient.nbFiles()).to.equal(0);
  });
});
