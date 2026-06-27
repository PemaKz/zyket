// Reuse the framework's session-based socket guard.
// Referenced from handlers via `guards = ["auth"];`
module.exports = require('zyket').AuthGuard;
