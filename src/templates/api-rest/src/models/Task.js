module.exports = ({ sequelize, Sequelize }) => {
  const Task = sequelize.define('Task', {
    title: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    completed: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
  });

  return Task;
};
