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
    const { login, sendPhoneOtp, loginWithPhoneOtp, isLoggingIn, isSendingOtp } = useAuth();

    const emailLoginSchema = z.object({
        email: z.string().email("Invalid email").min(1, "Email is required"),
        password: z.string().min(6, "Password must be at least 6 characters"),
    });

    const otpLoginSchema = z.object({
        email: z.string().email("Invalid email").min(1, "Email is required"),
        phoneNumber: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
        otp: z.string().min(1, "OTP is required"),
    });

    const emailForm = useForm({
        resolver: zodResolver(emailLoginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const otpForm = useForm({
        resolver: zodResolver(otpLoginSchema),
        defaultValues: {
            email: "",
            phoneNumber: "",
            otp: "",
        },
    });

    const onEmailSubmit = (values) => {
        if (isLoggingIn)
            return;
        login(values);
    };

    const onSendOtp = async () => {
        const isValid = await otpForm.trigger(["phoneNumber"]);
        if (!isValid)
            return;
        const phoneNumber = otpForm.getValues("phoneNumber");
        await sendPhoneOtp({ phoneNumber });
    };

    const onOtpSubmit = (values) => {
        if (isLoggingIn)
            return;
        loginWithPhoneOtp(values);
    };

    return (
        <div
            className="
  flex
   min-h-svh
   items-center
   justify-center bg-muted p-6
   "
        >
            <div className="w-full max-w-sm">
                <Card>
                    <CardHeader className="flex flex-col items-center justify-center gap-3">
                        <Logo />
                        <CardTitle className="text-xl">Sign in to your account</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <Form {...emailForm}>
                            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="grid gap-4">
                                <FormField
                                    control={emailForm.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="johndoe@example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={emailForm.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <FormControl>
                                                <Input placeholder="******" type="password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button disabled={isLoggingIn} type="submit" className="w-full">
                                    {isLoggingIn && <Spinner />} Sign In
                                </Button>
                            </form>
                        </Form>

                        <div className="text-center text-xs text-muted-foreground">OR</div>

                        <Form {...otpForm}>
                            <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="grid gap-4">
                                <FormField
                                    control={otpForm.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email (same account)</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="johndoe@example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={otpForm.control}
                                    name="phoneNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone Number</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter 10-digit number" maxLength={10} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button type="button" variant="outline" className="w-full" onClick={onSendOtp} disabled={isSendingOtp}>
                                    {isSendingOtp && <Spinner />} Send OTP
                                </Button>

                                <FormField
                                    control={otpForm.control}
                                    name="otp"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>OTP</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter OTP (notification shows 12345)" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button disabled={isLoggingIn} type="submit" className="w-full">
                                    {isLoggingIn && <Spinner />} Verify OTP & Enter Room
                                </Button>
                            </form>
                        </Form>

                        <div className="text-center text-sm">
                            Dont have an account? <Link to="/sign-up" className="underline">Sign Up</Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SignIn;
