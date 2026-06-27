const { Route, RequireAuthMiddleware } = require('zyket');

// Collection endpoints: GET /tasks and POST /tasks
module.exports = class TasksRoute extends Route {
  middlewares = {
    get: [new RequireAuthMiddleware()],
    post: [new RequireAuthMiddleware()],
  };

  async get({ container }) {
    const { Task } = container.get('database').models;
    const tasks = await Task.findAll({ order: [['createdAt', 'DESC']] });
    return { tasks };
  }

  async post({ container, request }) {
    const { title, description } = request.body || {};
    if (!title) {
      return { success: false, message: 'title is required', status: 400 };
    }

    const { Task } = container.get('database').models;
    const task = await Task.create({ title, description });
    return { task, status: 201 };
  }
};
