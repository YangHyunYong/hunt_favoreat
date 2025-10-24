import React, { useEffect, useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { useAccount, useConnect } from "wagmi";
import { modal } from "../wagmi";
import { ensureUserWithWallet } from "../supabaseClient";
import { sdk } from "@farcaster/miniapp-sdk";

interface ConnectWalletButtonProps {
  onOpenUserMenu?: () => void;
}

const ConnectWalletButton: React.FC<ConnectWalletButtonProps> = ({
  onOpenUserMenu,
}) => {
  const { isConnected, address } = useAccount();
  const { isConnected: isReownConnected, address: reownAddress } =
    useAppKitAccount();
  const { connect, connectors } = useConnect();
  const [sdkContext, setSdkContext] = useState<any>(null);

  // 자동 로그인 시에는 useAccount, 그 외에는 useAppKitAccount 사용
  const isWalletConnected = isConnected || isReownConnected;
  const walletAddress = isConnected ? address : reownAddress;

  // ** 자동 로그인 시도 및 사용자 등록 **
  useEffect(() => {
    const tryAutoConnect = async () => {
      // Farcaster 환경에서만 자동 연결 시도
      if (!isConnected && !isReownConnected) {
        try {
          const context = await sdk.context;
          if (context?.user?.fid) {
            // Farcaster 사용자가 있으면 자동 연결 시도
            connect({ connector: connectors[0] });
          }
        } catch (error) {
          // SDK context가 없으면 자동 연결하지 않음
          console.log("No Farcaster context, skipping auto-connect");
        }
      }
    };

    // 지갑 연결 시 사용자 자동 등록
    const registerUser = async () => {
      if (isWalletConnected && walletAddress) {
        try {
          await ensureUserWithWallet(walletAddress);
          console.log("✅ User:", walletAddress);
        } catch (error) {
          console.error("❌ User registration failed:", error);
        }
      }
    };

    // SDK Context 로드
    const loadSdkContext = async () => {
      try {
        const context = await sdk.context;
        setSdkContext(context);
      } catch (error) {
        console.error("SDK Context error:", error);
        setSdkContext(null);
      }
    };

    tryAutoConnect();
    loadSdkContext();
  }, []); // 의존성 배열을 빈 배열로 변경하여 한 번만 실행

  // 지갑 연결 시 사용자 등록
  useEffect(() => {
    const registerUser = async () => {
      if (isWalletConnected && walletAddress) {
        try {
          await ensureUserWithWallet(walletAddress);
          console.log("✅ User:", walletAddress);
        } catch (error) {
          console.error("❌ User registration failed:", error);
        }
      }
    };

    registerUser();
  }, [isWalletConnected, walletAddress]);

  // 지갑 연결이 끊어지면 SDK Context 초기화
  useEffect(() => {
    if (!isWalletConnected) {
      setSdkContext(null);
    }
  }, [isWalletConnected]);

  if (!isWalletConnected) {
    return (
      <button
        type="button"
        onClick={() => modal.open()}
        className="mr-3 text-[14px] font-semibold text-orange-600"
        aria-label="Connect Wallet"
      >
        Connect
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpenUserMenu}
      className="w-8 h-8 text-[14px] rounded-full bg-orange-100 flex items-center justify-center font-semibold text-orange-600"
      aria-label="User Menu"
      title={walletAddress}
    >
      {sdkContext?.user?.pfpUrl && isConnected && !isReownConnected ? (
        <img
          src={sdkContext.user.pfpUrl}
          alt="Profile"
          className="w-8 h-8 rounded-full"
        />
      ) : (
        <span className="text-[10px] font-bold">
          {walletAddress?.slice(2, 4).toUpperCase()}
        </span>
      )}
    </button>
  );
};

export default ConnectWalletButton;
