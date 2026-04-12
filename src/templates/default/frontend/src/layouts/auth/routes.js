import AuthView from "../../views/auth";
import AuthRegisterView from "../../views/auth/register";
import NotLoggedMiddleware from "../../middlewares/NotLoggedMiddleware";

module.exports = [
  {
    name: "Auth",
    path: "/auth",
    component: AuthView,
    middlewares: [NotLoggedMiddleware],
  },
  {
    name: "Auth Register",
    path: "/auth/register",
    component: AuthRegisterView,
    middlewares: [NotLoggedMiddleware],
  }
]