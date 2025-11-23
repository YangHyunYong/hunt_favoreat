import React from "react";

export type TabType = "recent" | "near-me" | "leaderboard";

interface NavigatorProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const Navigator: React.FC<NavigatorProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="fixed top-16 left-0 right-0 z-40 h-12 bg-white border-b border-gray-200 flex gap-2 items-center justify-center px-4">
      <button
        onClick={() => onTabChange("recent")}
        className={`flex-1 flex gap-2 items-center justify-center p-2 ${
          activeTab === "recent"
            ? "border-b-2 border-redorange-500"
            : "border-b-2 border-transparent"
        }`}
      >
        <p
          className={`text-[18px] font-semibold leading-[26px] tracking-[0.27px] ${
            activeTab === "recent" ? "text-redorange-500" : "text-gray-500"
          }`}
        >
          Recent
        </p>
      </button>
      <button
        onClick={() => onTabChange("near-me")}
        className={`flex-1 flex gap-2 items-center justify-center p-2 ${
          activeTab === "near-me"
            ? "border-b-2 border-redorange-500"
            : "border-b-2 border-transparent"
        }`}
      >
        <p
          className={`text-[18px] font-semibold leading-[26px] tracking-[0.27px] ${
            activeTab === "near-me" ? "text-redorange-500" : "text-gray-500"
          }`}
        >
          Near me
        </p>
      </button>
      <button
        onClick={() => onTabChange("leaderboard")}
        className={`flex-1 flex gap-2 items-center justify-center p-2 ${
          activeTab === "leaderboard"
            ? "border-b-2 border-redorange-500"
            : "border-b-2 border-transparent"
        }`}
      >
        <p
          className={`text-[18px] font-semibold leading-[26px] tracking-[0.27px] ${
            activeTab === "leaderboard" ? "text-redorange-500" : "text-gray-500"
          }`}
        >
          Leaderboard
        </p>
      </button>
    </div>
  );
};

export default Navigator;
