import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from "@/components/ui/form";
import Logo from "@/components/logo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Link } from "react-router-dom";
const SignIn = () => {
    const { login, isLoggingIn } = useAuth();
    const formSchema = z.object({
        email: z.string().email("Invalid email").min(1, "Email is required"),
        password: z.string().min(6, "Password must be at least 6 characters"),
    });
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });
    const onSubmit = (values) => {
        if (isLoggingIn)
            return;
        login(values);
    };
    return (_jsx("div", { className: "\r\n  flex\r\n   min-h-svh\r\n   items-center\r\n   justify-center bg-muted p-6\r\n   ", children: _jsx("div", { className: "w-full max-w-sm", children: _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-col items-center justify-center gap-3", children: [_jsx(Logo, {}), _jsx(CardTitle, { className: "text-xl", children: "Sign in to your account" })] }), _jsx(CardContent, { children: _jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "grid gap-4", children: [_jsx(FormField, { control: form.control, name: "email", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Email" }), _jsx(FormControl, { children: _jsx(Input, { type: "email", placeholder: "johndoe@example.com", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "password", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Password" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "******", type: "password", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs(Button, { disabled: isLoggingIn, type: "submit", className: "w-full", children: [isLoggingIn && _jsx(Spinner, {}), " Sign In"] }), _jsxs("div", { className: "text-center text-sm", children: ["Dont have an account?", " ", _jsx(Link, { to: "/sign-up", className: "underline", children: "Sign Up" })] })] }) }) })] }) }) }));
};
export default SignIn;
