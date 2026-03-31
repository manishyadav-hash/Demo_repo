import React from "react";
import AsideBar from "./aside-bar";
import { useAutoLocationUpdate } from "@/hooks/use-auto-location-update";

const AppWrapper = ({ children }) => {
  useAutoLocationUpdate();
  
  return (
    <div className="h-dvh min-h-svh w-full overflow-hidden bg-background">
      <AsideBar />
      <main className="h-full min-h-0 pl-11 sm:pl-16 transition-all duration-300">
        {children}
      </main>
    </div>
  );
};

export default AppWrapper;
