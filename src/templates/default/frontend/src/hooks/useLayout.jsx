import React from 'react';
import { Route } from 'react-router-dom';

export default function useLayout(routeList) {
  
  const routes = routeList.map((route, index) => {
    const middlewares = route.middlewares ? [...route.middlewares].reverse() : [];
    let element = <route.component />;
    middlewares.forEach((middleware) => {
        element = React.createElement(middleware, {}, element);
    });
    return <Route key={index} path={route.path} element={element} />;
  });

  return {
    routes,
  };
}
