import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
import { useAuth } from "./hooks/use-auth";
import AppRoutes from "./routes";
import { Spinner } from "./components/ui/spinner";
import Logo from "./components/logo";
import { useLocation } from "react-router-dom";
import { isAuthRoute } from "./routes/routes";
import CallProvider from "@/context/call-context";

function App() {
    const { pathname } = useLocation();
    const { user, isAuthStatus, isAuthStatusLoading } = useAuth();
    const isAuth = isAuthRoute(pathname);
    useEffect(() => {
        if (isAuth)
            return;
        isAuthStatus();
    }, [isAuthStatus, isAuth]);
    if (isAuthStatusLoading && !user) {
        return (_jsxs("div", { className: "flex min-h-svh h-dvh flex-col items-center\r\n       justify-center\r\n      ", children: [_jsx(Logo, { imgClass: "size-20", showText: false }), _jsx(Spinner, { className: "w-6 h-6" })] }));
    }
    return (_jsx(CallProvider, { children: _jsx(AppRoutes, {}) }));
}
export default App;
