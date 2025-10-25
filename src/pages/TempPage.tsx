import React, { useState } from "react";
import { BottomSheet } from "react-spring-bottom-sheet";
import "react-spring-bottom-sheet/dist/style.css";
import Header from "../components/Header";
import ConnectWalletButton from "../components/ConnectWalletButton";
import UserMenu from "../components/UserMenu";

const TempScreen: React.FC = () => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <Header
        leftElement={<div></div>}
        rightElement={
          <ConnectWalletButton onOpenUserMenu={() => setIsUserMenuOpen(true)} />
        }
        centerElement={
          <div className="flex items-center gap-0.5 text-redorange-500 text-rating-count">
            <img src="/icons/logo.svg" alt="FavorEat" className="w-6 h-6" />
            FavorEat
          </div>
        }
      />

      {/* 메인 이미지 영역 */}
      <div className="relative w-full h-[calc(100vh-80px)]">
        <img
          src="/icons/main-image.png"
          alt="Main Image"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Bottom Sheet */}
      <div>
        <BottomSheet
          open={true}
          blocking={false}
          snapPoints={({ maxHeight }) => [0.08 * maxHeight, 0.42 * maxHeight]}
          defaultSnap={({ snapPoints }) => snapPoints[0]}
          onDismiss={() => {}}
        >
          <div className="p-3">
            <p className="text-center text-sm text-gray-500">
              지도를 탭해 주변 가게를 선택하세요
            </p>
          </div>
        </BottomSheet>
      </div>

      {/* UserMenu */}
      <UserMenu
        isOpen={isUserMenuOpen}
        onClose={() => setIsUserMenuOpen(false)}
      />
    </div>
  );
};

export default TempScreen;
