const { Route, RequireAuthMiddleware } = require('zyket');

// Item endpoints: GET/PUT/DELETE /tasks/:id
module.exports = class TaskRoute extends Route {
  middlewares = {
    get: [new RequireAuthMiddleware()],
    put: [new RequireAuthMiddleware()],
    delete: [new RequireAuthMiddleware()],
  };

  async #find(container, id) {
    const { Task } = container.get('database').models;
    return Task.findByPk(id);
  }

  async get({ container, request }) {
    const task = await this.#find(container, request.params.id);
    if (!task) return { success: false, message: 'Task not found', status: 404 };
    return { task };
  }

  async put({ container, request }) {
    const task = await this.#find(container, request.params.id);
    if (!task) return { success: false, message: 'Task not found', status: 404 };

    const { title, completed, description } = request.body || {};
    await task.update({
      title: title ?? task.title,
      description: description ?? task.description,
      completed: completed ?? task.completed,
    });
    return { task };
  }

  async delete({ container, request }) {
    const task = await this.#find(container, request.params.id);
    if (!task) return { success: false, message: 'Task not found', status: 404 };

    await task.destroy();
    return { message: 'Task deleted' };
  }
};
