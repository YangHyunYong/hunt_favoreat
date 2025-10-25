import React, { useState } from "react";
import { BottomSheet } from "react-spring-bottom-sheet";
import "react-spring-bottom-sheet/dist/style.css";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import ConnectWalletButton from "../components/ConnectWalletButton";
import UserMenu from "../components/UserMenu";
import { useAppKitAccount } from "@reown/appkit/react";
import { useAccount } from "wagmi";

const TempScreen: React.FC = () => {
  const { address: appKitAddress } = useAppKitAccount();
  const { address: wagmiAddress } = useAccount();
  const navigate = useNavigate();

  // Farcaster 자동 로그인과 일반 로그인 모두 지원
  const address = wagmiAddress || appKitAddress;

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleBack = () => {
    navigate(-1);
  };

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
