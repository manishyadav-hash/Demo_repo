import { API } from "@/lib/axios-client";
import { toast } from "sonner";
import { create } from "zustand";
//import { persist } from "zustand/middleware";
import { useSocket } from "./use-socket";
const getErrorMessage = (err, fallback) => {
    return err?.response?.data?.message || err?.message || fallback;
};
//Without Persist
export const useAuth = create()((set) => ({
    user: null,
    isSigningUp: false,
    isLoggingIn: false,
    isAuthStatusLoading: false,
    register: async (data) => {
        set({ isSigningUp: true });
        try {
            const response = await API.post("/auth/register", data);
            set({ user: response.data.user });
            useSocket.getState().connectSocket();
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
            set({ user: response.data.user });
            useSocket.getState().connectSocket();
            toast.success("Login successfully");
        }
        catch (err) {
            toast.error(getErrorMessage(err, "Login failed"));
        }
        finally {
            set({ isLoggingIn: false });
        }
    },
    logout: async () => {
        try {
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
            set({ user: response.data.user });
            useSocket.getState().connectSocket();
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
