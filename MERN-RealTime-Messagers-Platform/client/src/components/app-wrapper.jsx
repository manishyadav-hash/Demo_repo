import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect } from "react";
import AsideBar from "./aside-bar";
import { useAutoLocationUpdate } from "@/hooks/use-auto-location-update";
const AppWrapper = ({ children }) => {
    const { isTracking } = useAutoLocationUpdate();
    
    return (_jsxs("div", { className: "h-full", children: [_jsx(AsideBar, {}), _jsx("main", { className: "lg:pl-10 h-full", children: children })] }));
};
export default AppWrapper;
