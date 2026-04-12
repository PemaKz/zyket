import PanelDashboardView from "../../views/panel/dashboard";
import LoggedMiddleware from "../../middlewares/LoggedMiddleware";

export default [
  {
    name: "Panel Dashboard",
    path: "/dashboard",
    component: PanelDashboardView,
    middlewares: [LoggedMiddleware],
  }
]