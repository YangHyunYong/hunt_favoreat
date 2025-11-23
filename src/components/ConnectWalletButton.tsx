import React, { useEffect, useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { ensureUserWithWallet, supabase } from "../supabaseClient";
import { sdk } from "@farcaster/miniapp-sdk";

interface ConnectWalletButtonProps {
  onOpenUserMenu?: () => void;
}

const ConnectWalletButton: React.FC<ConnectWalletButtonProps> = ({
  onOpenUserMenu,
}) => {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const [sdkContext, setSdkContext] = useState<any>(null);
  const [userPfpUrl, setUserPfpUrl] = useState<string | null>(null);

  const isWalletConnected = isConnected;
  const walletAddress = address;

  // ** 자동 로그인 시도 및 사용자 등록 **
  useEffect(() => {
    const tryAutoConnect = async () => {
      // disconnect 후 5초 이내인지 확인
      const disconnectTime = localStorage.getItem("favoreat_disconnect_time");
      if (disconnectTime) {
        const timeDiff = Date.now() - parseInt(disconnectTime);
        if (timeDiff < 5000) {
          return;
        }
      }

      // Farcaster 환경에서만 자동 연결 시도
      if (!isConnected) {
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
          // Farcaster SDK에서 사용자 정보 가져오기
          let userFid: number | null = null;
          let userName: string | null = null;
          let userPfpUrl: string | null = null;

          try {
            const context = await sdk.context;
            if (context?.user) {
              userFid = context.user.fid || null;
              userName =
                context.user.displayName || context.user.username || null;
              userPfpUrl = context.user.pfpUrl || null;
            }
          } catch (error) {
            console.log("Farcaster SDK context not available:", error);
          }

          await ensureUserWithWallet(
            walletAddress,
            userFid,
            userName,
            userPfpUrl
          );
          console.log("✅ User registered:", {
            walletAddress,
            userFid,
            userName,
            userPfpUrl,
          });
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
      setUserPfpUrl(null);
    }
  }, [isWalletConnected]);

  // users 테이블에서 user_pfp_url 가져오기
  useEffect(() => {
    const fetchUserPfpUrl = async () => {
      if (walletAddress) {
        try {
          const { data, error } = await supabase
            .from("users")
            .select("user_pfp_url")
            .eq("wallet_address", walletAddress.toLowerCase())
            .single();

          if (!error && data?.user_pfp_url) {
            setUserPfpUrl(data.user_pfp_url);
          } else {
            setUserPfpUrl(null);
          }
        } catch (error) {
          console.error("user_pfp_url 조회 실패:", error);
          setUserPfpUrl(null);
        }
      }
    };

    fetchUserPfpUrl();
  }, [walletAddress]);

  // Connect 버튼 클릭 핸들러
  const handleConnect = async () => {
    try {
      try {
        const context = await sdk.context;
        if (context?.user?.fid && connectors[0]) {
          connect({ connector: connectors[0] });
        }
      } catch (error) {
        console.log("Farcaster context not available:", error);
      }
    } catch (error) {
      console.error("Connect failed:", error);
    }
  };

  // 지갑이 연결되지 않았을 때 Connect 버튼 표시
  if (!isWalletConnected) {
    return (
      <button
        type="button"
        onClick={handleConnect}
        className="mr-3 text-[14px] font-semibold text-orange-600"
        aria-label="Connect Wallet"
      >
        Connect
      </button>
    );
  }

  // 지갑이 연결되었을 때 프로필 버튼 표시
  return (
    <button
      type="button"
      onClick={onOpenUserMenu}
      className="w-10 h-10 text-[14px] rounded-full bg-[#e5e5e5] flex items-center justify-center font-semibold text-orange-600"
      aria-label="User Menu"
      title={walletAddress}
    >
      {userPfpUrl ? (
        <img
          src={userPfpUrl}
          alt="Profile"
          className="w-10 h-10 rounded-full object-cover"
        />
      ) : sdkContext?.user?.pfpUrl && isConnected ? (
        <img
          src={sdkContext.user.pfpUrl}
          alt="Profile"
          className="w-10 h-10 rounded-full object-cover"
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
