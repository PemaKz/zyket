module.exports = ({ sequelize, Sequelize }) => {
  // A tenant-scoped resource: every project belongs to one organization.
  const Project = sequelize.define('Project', {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    organizationId: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  }, {
    indexes: [{ fields: ['organizationId'] }],
  });

  return Project;
};
