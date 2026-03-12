import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Logo from "./logo";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle, } from "./ui/empty";
const EmptyState = ({ title = "No chat selected", description = "Pick a chat or start a new one...", }) => {
    return (_jsx(Empty, { className: "w-full h-full flex-1\r\n    flex items-center justify-center bg-muted/20", children: _jsxs(EmptyHeader, { children: [_jsx(EmptyMedia, { variant: "icon", children: _jsx(Logo, { showText: false }) }), _jsx(EmptyTitle, { children: title }), _jsx(EmptyDescription, { children: description })] }) }));
};
export default EmptyState;
