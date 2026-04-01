import { API } from "@/lib/axios-client";
import { toast } from "sonner";
import { create } from "zustand";
//import { persist } from "zustand/middleware";
import { useSocket } from "./use-socket";
import {
    bindForegroundPushListener,
    registerPushTokenWithServer,
    removePushTokenFromServer,
} from "@/lib/push-notifications";
const getErrorMessage = (err, fallback) => {
    return err?.response?.data?.message || err?.message || fallback;
};

const schedulePushRegistration = () => {
    void registerPushTokenWithServer();
    setTimeout(() => {
        void registerPushTokenWithServer();
    }, 2000);
    setTimeout(() => {
        void registerPushTokenWithServer();
    }, 8000);
};

const normalizeUser = (user) => {
    if (!user)
        return user;
    return {
        ...user,
        _id: user._id || user.id,
    };
};
//Without Persist
export const useAuth = create()((set) => ({
    user: null,
    isSigningUp: false,
    isLoggingIn: false,
    isSendingOtp: false,
    isAuthStatusLoading: false,
    register: async (data) => {
        set({ isSigningUp: true });
        try {
            const response = await API.post("/auth/register", data);
            set({ user: normalizeUser(response.data.user) });
            useSocket.getState().connectSocket();
            void bindForegroundPushListener();
            schedulePushRegistration();
            toast.success("Register successfully");
        }
        catch (err) {
            toast.error(getErrorMessage(err, "Register failed"));
        }
        finally {
            set({ isSigningUp: false });
        }
    },
    login: async (data) => {
        set({ isLoggingIn: true });
        try {
            const response = await API.post("/auth/login", data);
            set({ user: normalizeUser(response.data.user) });
            useSocket.getState().connectSocket();
            void bindForegroundPushListener();
            schedulePushRegistration();
            toast.success("Login successfully");
        }
        catch (err) {
            toast.error(getErrorMessage(err, "Login failed"));
        }
        finally {
            set({ isLoggingIn: false });
        }
    },
    sendPhoneOtp: async (data) => {
        set({ isSendingOtp: true });
        try {
            const response = await API.post("/auth/send-phone-otp", data);
            toast.success(response?.data?.notification || "OTP sent successfully");
            return true;
        }
        catch (err) {
            toast.error(getErrorMessage(err, "Failed to send OTP"));
            return false;
        }
        finally {
            set({ isSendingOtp: false });
        }
    },
    loginWithPhoneOtp: async (data) => {
        set({ isLoggingIn: true });
        try {
            const response = await API.post("/auth/verify-phone-otp", data);
            set({ user: normalizeUser(response.data.user) });
            useSocket.getState().connectSocket();
            void bindForegroundPushListener();
            schedulePushRegistration();
            toast.success("OTP verified. Login successfully");
        }
        catch (err) {
            toast.error(getErrorMessage(err, "OTP verification failed"));
        }
        finally {
            set({ isLoggingIn: false });
        }
    },
    logout: async () => {
        try {
            await removePushTokenFromServer();
            await API.post("/auth/logout");
            set({ user: null });
            useSocket.getState().disconnectSocket();
            toast.success("Logout successfully");
        }
        catch (err) {
            toast.error(getErrorMessage(err, "Logout failed"));
        }
    },
    
    isAuthStatus: async () => {
        set({ isAuthStatusLoading: true });
        try {
            const response = await API.get("/auth/status");
            set({ user: normalizeUser(response.data.user) });
            useSocket.getState().connectSocket();
            void bindForegroundPushListener();
            schedulePushRegistration();
        }
        catch (err) {
            toast.error(getErrorMessage(err, "Authentication failed"));
            console.log(err);
            //set({ user: null})
        }
        finally {
            set({ isAuthStatusLoading: false });
        }
    },
}));
//With Persist
// export const useAuth = create<AuthState>()(
//   persist(
//     (set) => ({
//       user: null,
//       isSigningUp: false,
//       isLoggingIn: false,
//       isAuthStatusLoading: false,
//       register: async (data: RegisterType) => {
//         set({ isSigningUp: true });
//         try {
//           const response = await API.post("/auth/register", data);
//           set({ user: response.data.user });
//           useSocket.getState().connectSocket();
//           toast.success("Register successfully");
//         } catch (err: any) {
//           toast.error(err.response?.data?.message || "Register failed");
//         } finally {
//           set({ isSigningUp: false });
//         }
//       },
//       login: async (data: LoginType) => {
//         set({ isLoggingIn: true });
//         try {
//           const response = await API.post("/auth/login", data);
//           set({ user: response.data.user });
//           useSocket.getState().connectSocket();
//           toast.success("Login successfully");
//         } catch (err: any) {
//           toast.error(err.response?.data?.message || "Register failed");
//         } finally {
//           set({ isLoggingIn: false });
//         }
//       },
//       logout: async () => {
//         try {
//           await API.post("/auth/logout");
//           set({ user: null });
//           useSocket.getState().disconnectSocket();
//           toast.success("Logout successfully");
//         } catch (err: any) {
//           toast.error(err.response?.data?.message || "Register failed");
//         }
//       },
//       isAuthStatus: async () => {
//         set({ isAuthStatusLoading: true });
//         try {
//           const response = await API.get("/auth/status");
//           set({ user: response.data.user });
//           useSocket.getState().connectSocket();
//         } catch (err: any) {
//           toast.error(err.response?.data?.message || "Authentication failed");
//           console.log(err);
//           //set({ user: null})
//         } finally {
//           set({ isAuthStatusLoading: false });
//         }
//       },
//     }),
//     {
//       name: "spark:root",
//     }
//   )
// );
