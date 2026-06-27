const { Route, RequireAuthMiddleware } = require('zyket');
const RequireOrganization = require('../../middlewares/RequireOrganization');

// Tenant-scoped CRUD. RequireOrganization guarantees an active org and sets
// `request.organizationId`; every query is isolated to that organization.
module.exports = class ProjectsRoute extends Route {
  middlewares = {
    get: [new RequireAuthMiddleware(), new RequireOrganization()],
    post: [new RequireAuthMiddleware(), new RequireOrganization()],
  };

  async get({ container, request }) {
    const { Project } = container.get('database').models;
    const projects = await Project.findAll({
      where: { organizationId: request.organizationId },
      order: [['createdAt', 'DESC']],
    });
    return { projects };
  }

  async post({ container, request }) {
    const { name } = request.body || {};
    if (!name) {
      return { success: false, message: 'name is required', status: 400 };
    }

    const { Project } = container.get('database').models;
    const project = await Project.create({
      name,
      organizationId: request.organizationId,
    });
    return { project, status: 201 };
  }
};
