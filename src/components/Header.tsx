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
      className={`flex w-full px-2 justify-between items-center border-b border-gray-200 bg-white ${className}`}
    >
      {/* 왼쪽 요소 */}
      <div className="flex items-center">{leftElement}</div>

      {/* 중앙 요소 */}
      <div className="flex items-center">{centerElement}</div>

      {/* 오른쪽 요소 */}
      <div className="flex items-center">{rightElement}</div>
    </header>
  );
};

export default Header;
