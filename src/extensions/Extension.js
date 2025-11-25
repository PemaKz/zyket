module.exports = class Extension {
  name;

  constructor(_Name) {
    this.name = _Name;
  }

  load(container) {
    throw new Error("Load method not implemented");
  }
}