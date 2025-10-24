import React from "react";

interface HeaderProps {
  leftElement?: React.ReactNode;
  centerElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  className?: string;
}

const Header: React.FC<HeaderProps> = ({
  leftElement,
  centerElement,
  rightElement,
  className = "",
}) => {
  return (
    <header
      className={`flex w-full h-12 px-2 justify-between items-center border-b border-gray-200 bg-white ${className}`}
    >
      {/* 왼쪽 요소 */}
      <div className="flex items-center justify-start flex-[1] min-w-[40px]">
        {leftElement ?? <div />}
      </div>

      {/* 중앙 요소 */}
      <div className="flex items-center justify-center flex-[2]">
        {centerElement ?? <div />}
      </div>

      {/* 오른쪽 요소 */}
      <div className="flex items-center justify-end flex-[1] min-w-[40px]">
        {rightElement ?? <div />}
      </div>
    </header>
  );
};

export default Header;
