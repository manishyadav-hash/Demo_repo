import { jsx as _jsx } from "react/jsx-runtime";
import EmptyState from "@/components/empty-state";
const Chat = () => {
    return (_jsx("div", { className: "hidden lg:block h-svh", children: _jsx(EmptyState, {}) }));
};
export default Chat;
