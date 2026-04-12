import AuthView from "../../views/auth";
import AuthRegisterView from "../../views/auth/register";
import NotLoggedMiddleware from "../../middlewares/NotLoggedMiddleware";

export default [
  {
    name: "Auth",
    path: "/",
    component: AuthView,
    middlewares: [NotLoggedMiddleware],
  },
  {
    name: "Auth Register",
    path: "/register",
    component: AuthRegisterView,
    middlewares: [NotLoggedMiddleware],
  }
]