import React from "react";
import { AirLocationDemo } from "@/components/location";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Discover = () => {
  const navigate = useNavigate();

  return (
    <div className="h-svh flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">📡 Air Location System</h1>
            <p className="text-sm text-muted-foreground">Real-time GPS distance tracking with Haversine formula</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          <AirLocationDemo />
        </div>
      </div>
    </div>
  );
};

export default Discover;
