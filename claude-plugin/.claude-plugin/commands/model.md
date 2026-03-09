# Create a Zyket Sequelize Model

Create a new Sequelize model file in the Zyket project.

## Instructions

Models live in `src/models/`. Each file must export a **function** (not a class) that receives `{ sequelize, Sequelize, container }` and returns a Sequelize model instance.

### Template

```js
const { DataTypes } = require("sequelize");

module.exports = ({ sequelize, Sequelize, container }) => {
  const $ModelName$ = sequelize.define("$ModelName$", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    // Add your fields here
  }, {
    tableName: "$table_name$",
    timestamps: true,
  });

  $ModelName$.associate = (models) => {
    // Define associations here
    // $ModelName$.belongsTo(models.User, { foreignKey: "userId" });
  };

  return $ModelName$;
};
```

### Steps:
1. Create `src/models/$ModelName$.js`.
2. Define all columns based on the user's description.
3. Add associations if the model relates to other models.
4. Optionally create a migration file in `src/models/migrations/`.
