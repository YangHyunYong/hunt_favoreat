import React from "react";

interface ActionMenuProps {
  open: boolean;
  onDelete: () => void;
  onShare: () => void;
  className?: string;
}

const ActionMenu: React.FC<ActionMenuProps> = ({
  open,
  onDelete,
  onShare,
  className,
}) => {
  if (!open) return null;
  return (
    <div
      className={`absolute right-0 top-8 rounded-[20px] overflow-hidden border border-gray-200 shadow-[0_2px_12px_rgba(0,0,0,0.15)] bg-white ${
        className || ""
      }`}
    >
      <button
        type="button"
        className="flex w-full px-4 py-2.5 justify-center items-center gap-1 border-b border-gray-300 bg-gray-100"
        onClick={onDelete}
      >
        <span className="text-action-content">Delete</span>
        <img src="/icons/trash.svg" className="w-4 h-4" />
      </button>
      <button
        type="button"
        className="flex w-full px-4 py-2.5 justify-center items-center gap-1 bg-gray-100"
        onClick={onShare}
      >
        <span className="text-action-content">Share</span>
        <img src="/icons/share-06.svg" className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ActionMenu;
