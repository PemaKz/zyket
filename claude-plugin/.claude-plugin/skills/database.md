# Zyket – Database & Models

Zyket uses **Sequelize** as its ORM. The database service is activated when the `DATABASE_URL` environment variable is set.

## Configuration

```env
DATABASE_URL=mariadb://user:password@localhost:3306/mydb
DATABASE_DIALECT=mariadb   # or: postgresql
```

## Model Definition

Models live in `src/models/`. Each file must export a **function** (not a class) that receives `{ sequelize, container, Sequelize }` and returns a Sequelize model instance.

```js
// src/models/User.js
const { DataTypes } = require("sequelize");

module.exports = ({ sequelize, container, Sequelize }) => {
  const User = sequelize.define("User", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    role: {
      type: DataTypes.ENUM("user", "admin"),
      defaultValue: "user",
    },
  }, {
    tableName: "users",
    timestamps: true,
  });

  // Associations
  User.associate = (models) => {
    User.hasMany(models.Post, { foreignKey: "userId" });
  };

  return User;
};
```

## Accessing Models in Routes / Services

```js
async get({ container, request }) {
  const db = container.get("database");

  // Find all
  const users = await db.models.User.findAll();

  // Find by primary key
  const user = await db.models.User.findByPk(request.params.id);

  // Find one with condition
  const user = await db.models.User.findOne({ where: { email: "a@b.com" } });

  // Create
  const newUser = await db.models.User.create({ name: "Alice", email: "alice@example.com" });

  // Update
  await db.models.User.update({ name: "Bob" }, { where: { id: 1 } });

  // Destroy
  await db.models.User.destroy({ where: { id: 1 } });

  return { users };
}
```

## Sequelize Operators

```js
const { Op } = container.get("database");

await db.models.User.findAll({
  where: {
    createdAt: { [Op.gte]: new Date("2024-01-01") },
    name: { [Op.like]: "%alice%" },
  },
});
```

## Migrations

Migrations live in `src/models/migrations/` and follow the Umzug format:

```js
// src/models/migrations/001-create-users.js
module.exports = {
  async up({ context: { queryInterface, container } }) {
    await queryInterface.createTable("users", {
      id: { type: "INTEGER", primaryKey: true, autoIncrement: true },
      name: { type: "VARCHAR(255)", allowNull: false },
      email: { type: "VARCHAR(255)", allowNull: false, unique: true },
      created_at: { type: "DATETIME", allowNull: false },
      updated_at: { type: "DATETIME", allowNull: false },
    });
  },
  async down({ context: { queryInterface } }) {
    await queryInterface.dropTable("users");
  },
};
```

Run migrations from the entry point or a script:

```js
const db = kernel.container.get("database");
await db.runMigrations(); // default: src/models/migrations
await db.runMigrations("src/models/migrations/custom"); // custom path
```

## Dynamic Model Loading

Load a model at runtime (e.g. from an extension):

```js
const db = container.get("database");
await db.loadModel(require("./SomeModel"));
```
