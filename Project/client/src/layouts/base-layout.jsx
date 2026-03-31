import { jsx as _jsx } from "react/jsx-runtime";
import { Outlet } from "react-router-dom";
const BaseLayout = () => {
    return (_jsx("div", { className: "flex flex-col w-full h-auto", children: _jsx("div", { className: "w-full h-full flex items-center\r\n      justify-center\r\n    ", children: _jsx("div", { className: "w-full mx-auto h-auto", children: _jsx(Outlet, {}) }) }) }));
};
export default BaseLayout;
