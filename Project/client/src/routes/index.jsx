import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import BaseLayout from "@/layouts/base-layout";
import { Route, Routes } from "react-router-dom";
import { authRoutesPaths, protectedRoutesPaths } from "./routes";
import AppLayout from "@/layouts/app-layout";
import RouteGuard from "./route-guard";
const AppRoutes = () => {
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(RouteGuard, { requireAuth: false }), children: _jsx(Route, { element: _jsx(BaseLayout, {}), children: authRoutesPaths?.map((route) => (_jsx(Route, { path: route.path, element: route.element }, route.path))) }) }), _jsx(Route, { path: "/", element: _jsx(RouteGuard, { requireAuth: true }), children: _jsx(Route, { element: _jsx(AppLayout, {}), children: protectedRoutesPaths?.map((route) => (_jsx(Route, { path: route.path, element: route.element }, route.path))) }) })] }));
};
export default AppRoutes;
