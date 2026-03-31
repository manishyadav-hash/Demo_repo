import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import logoSvg from "@/assets/spark-logo.svg";
import { cn } from "@/lib/utils";
const Logo = ({ url = "/", showText = true, imgClass = "size-[30px]", textClass, }) => (_jsxs(Link, { to: url, className: "flex items-center gap-2 w-fit", children: [_jsx("img", { src: logoSvg, alt: "Spark", className: cn(imgClass) }), showText && (_jsx("span", { className: cn("font-semibold text-lg leading-tight", textClass), children: "Spark." }))] }));
export default Logo;
