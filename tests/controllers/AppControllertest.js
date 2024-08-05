/* eslint-disable import/no-named-as-default */
import dbClient from '../../utils/db';

describe('+ AppController Tests', () => {
  before(function (done) {
    this.timeout(10000);
    Promise.all([dbClient.usersCollection(), dbClient.filesCollection()])
      .then(([usersCollection, filesCollection]) => {
        Promise.all([usersCollection.deleteManay({}), filesCollection.deleteMany({})])
          .then(() => done())
          .catch((delErr) => done(delErr));
      }).catch((connErr) => done(connErr));
  });

  describe('+ GET: /status', () => {
    it('+ returns online service status', function (done) {
      request.get('/status')
        .expect(200)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(res.body).to.deep.equal({ redis: true, db: true });
          done();
        });
    });
  });

  describe('+ GET: /stats', () => {
    it('+ returns stats about db collections', function (done) {
      request.get('/stats')
        .expect(200)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(res.body).to.deep.equal({ users: 0, files: 0 });
          done();
        });
    });

    it('+ returns updated stats after adding data', function (done) {
      this.timeout(10000);
      Promise.all([dbClient.usersCollection(), dbClient.filesCollection()])
        .then(([usersCollection, filesCollection]) => {
          Promise.all([
            usersCollection.insertMany([{ email: 'example@mail.com' }]),
            filesCollection.insertMany([
              { name: 'example.txt', type: 'file' },
              { name: 'image.png', type: 'image' },
            ])
          ])
            .then(() => {
              request.get('/stats')
                .expect(200)
                .end((err, res) => {
                  if (err) {
                    return done(err);
                  }
                  expect(res.body).to.deep.eql({ users: 1, files: 2 });
                  done();
                });
            })
            .catch((deleteErr) => done(deleteErr));
        }).catch((connectErr) => done(connectErr));
    });
  });
});
