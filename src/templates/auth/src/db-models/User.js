module.exports = ({sequelize, container, Sequelize}) => {
  const User = sequelize.define('user', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false
    },
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['email']
      }
    ]
  });

  User.associate = models => {
    // User is associated to an application through ApplicationUser
    User.belongsToMany(models.Application, {
      through: models.ApplicationUser,
      as: 'applications',
      foreignKey: 'user_id',
      otherKey: 'application_id'
    });

    User.addScope('defaultScope', {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: models.Application,
          as: 'applications',
          through: { attributes: [] }
        }
      ]
    });
  }

  require('./hooks/User')(User, container);

  return User;
}
