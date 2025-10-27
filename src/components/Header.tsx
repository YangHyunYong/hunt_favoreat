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
      className={`fixed top-0 left-0 right-0 z-50 flex w-full h-12 px-4 justify-between items-center bg-white ${className}`}
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
