/* eslint-disable import/no-named-as-default */
import dbClient from '../../utils/db';

describe('+ UserController Tests', () => {
  const sampleUser = {
    email: 'somesample@ex.com',
    password: 'goodPass159',
  };

  before(function (done) {
    this.timeout(10000);
    dbClient.usersCollection()
      .then((usersCollection) => {
        usersCollection.deleteMany({ email: sampleUser.email })
          .then(() => done())
          .catch((delErr) => done(delErr));
      }).catch((connErr) => done(connErr));
    setTimeout(done, 5000);
  });

  describe('+ POST: /users', () => {
    it('+ return error when email is missing', function (done) {
      this.timeout(5000);
      request.post('/users')
        .send({
          password: sampleUser.password,
        })
        .expect(400)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(res.body).to.deep.eql({ error: 'Missing email' });
          done();
        });
    });

    it('+ returns error when password is missing', function (done) {
      this.timeout(5000);
      request.post('/users')
        .send({
          email: sampleUser.email,
        })
        .expect(400)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(res.body).to.deep.eql({ error: 'Missing password' });
          done();
        });
    });

    it('+ returns success with valid email and password', function (done) {
      this.timeout(5000);
      request.post('/users')
        .send({
          email: sampleUser.email,
          password: sampleUser.password,
        })
        .expect(201)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(res.body.email).to.eql(sampleUser.email);
          expect(res.body.id.length).to.be.greaterThan(0);
          done();
        });
    });

    it('+ returns error when user already exists', function (done) {
      this.timeout(5000);
      request.post('/users')
        .send({
          email: sampleUser.email,
          password: sampleUser.password,
        })
        .expect(400)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(res.body).to.deep.eql({ error: 'Already exist' });
          done();
        });
    });
  });
});
