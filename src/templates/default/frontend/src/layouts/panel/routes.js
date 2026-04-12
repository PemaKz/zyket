import PanelDashboardView from "../../views/panel/dashboard";
import LoggedMiddleware from "../../middlewares/LoggedMiddleware";

module.exports = [
  {
    name: "Panel Dashboard",
    path: "/panel/dashboard",
    component: PanelDashboardView,
    middlewares: [LoggedMiddleware],
  }
]