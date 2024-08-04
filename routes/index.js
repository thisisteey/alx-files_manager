import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';

const configRoutes = (api) => {
  api.get('/status', AppController.getStatus);
  api.get('/stats', AppController.getStats);

  api.post('/users', UsersController.postNew);
};

export default configRoutes;
