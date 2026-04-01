import { jsx as _jsx } from "react/jsx-runtime";
import { useAuth } from "@/hooks/use-auth";
import { Navigate, Outlet } from "react-router-dom";
const RouteGuard = ({ requireAuth }) => {
    const { user } = useAuth();
    if (requireAuth && !user)
        return _jsx(Navigate, { to: "/", replace: true });
    if (!requireAuth && user)
        return _jsx(Navigate, { to: "/chat", replace: true });
    return _jsx(Outlet, {});
};
export default RouteGuard;
