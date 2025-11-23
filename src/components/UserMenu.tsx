import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount, useDisconnect } from "wagmi";
import { sdk } from "@farcaster/miniapp-sdk";
import { supabase } from "../supabaseClient";

interface UserMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const [sdkContext, setSdkContext] = useState<any>(null);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [pointsLoading, setPointsLoading] = useState<boolean>(true);
  const [userPfpUrl, setUserPfpUrl] = useState<string | null>(null);

  const walletAddress = address;

  useEffect(() => {
    const loadSdkContext = async () => {
      try {
        const context = await sdk.context;
        setSdkContext(context);
      } catch (error) {
        console.error("SDK Context error:", error);
      }
    };

    const loadUserPoints = async () => {
      if (walletAddress) {
        try {
          setPointsLoading(true);
          const { data, error } = await supabase
            .from("users")
            .select("points, user_pfp_url")
            .eq("wallet_address", walletAddress.toLowerCase())
            .single();

          if (error) {
            console.error("포인트 조회 실패:", error);
            setUserPoints(0);
            setUserPfpUrl(null);
          } else {
            setUserPoints(data?.points || 0);
            setUserPfpUrl(data?.user_pfp_url || null);
          }
        } catch (error) {
          console.error("포인트 조회 에러:", error);
          setUserPoints(0);
          setUserPfpUrl(null);
        } finally {
          setPointsLoading(false);
        }
      }
    };

    if (isOpen) {
      loadSdkContext();
      loadUserPoints();
    }
  }, [isOpen, walletAddress]);

  if (!isOpen) return null;

  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : "0x0000...0000";

  const handleBookmarkList = () => {
    navigate("/bookmarks");
    onClose();
  };

  const handleDisconnect = () => {
    try {
      disconnect();
    } catch (e) {
      console.warn("Wagmi disconnect failed (ignored):", e);
    }

    // 스토리지 정리
    try {
      const patterns = [
        /^wagmi(\.store|\.cachedConnector)?$/i,
        /^walletconnect/i,
        /^WALLETCONNECT/i,
        /^wc@/i,
        /^w3m/i,
        /^web3modal/i,
        /^appkit/i,
        /^@reown/i,
        /^metamask/i,
        /^coinbase/i,
        /^rainbow/i,
      ];
      const sweep = (storage: Storage) => {
        const keys: string[] = [];
        for (let i = 0; i < storage.length; i++) {
          const k = storage.key(i);
          if (k) keys.push(k);
        }
        keys.forEach((k) => {
          if (patterns.some((re) => re.test(k))) {
            try {
              storage.removeItem(k);
            } catch {}
          }
        });
      };
      sweep(localStorage);
      sweep(sessionStorage);
    } catch {}

    // SDK Context 초기화
    setSdkContext(null);

    // 자동 로그인 방지를 위한 플래그 설정 (5초간)
    localStorage.setItem("favoreat_disconnect_time", Date.now().toString());

    onClose();

    // React Router를 사용하여 라우팅 (페이지 새로고침 없이)
    navigate("/");
  };

  const handleHowToEarn = () => {
    // TODO: 포인트 적립 방법 화면 구현 시 라우팅
    console.log("How to earn clicked");
    onClose();
  };

  const handleLeaderboard = () => {
    // TODO: 리더보드 화면 구현 시 라우팅
    console.log("Leaderboard clicked");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/20">
      <div className="relative bg-gray-50 rounded-[16px] p-4 w-[243px] mt-[44px] mr-[16px]">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-4 h-4 bg-gray-200 rounded-[8px] flex items-center justify-center hover:bg-gray-300 transition-colors"
          aria-label="닫기"
        >
          <img
            src="/icons/cancel.svg"
            className="w-4 h-4 rounded-[8px]"
            alt="닫기"
          />
        </button>

        {/* 사용자 정보 */}
        <div className="flex flex-col items-center gap-12">
          {/* 프로필 + 주소 */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 text-[14px] rounded-full bg-[#e5e5e5] flex items-center justify-center font-semibold text-orange-600 overflow-hidden">
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
            </div>
            <p className="text-rating-count text-gray-900">{shortAddress}</p>
          </div>

          {/* 포인트 정보 */}
          <div className="flex flex-col items-center gap-0.5">
            <p className="text-rating-count text-gray-500">yumyum point</p>
            <p className="text-place-title text-gray-900">
              {pointsLoading
                ? "로딩 중..."
                : `${userPoints.toLocaleString()} YuP`}
            </p>
          </div>

          {/* 메뉴 버튼들 */}
          <div className="flex flex-col gap-2 w-full">
            {/* 북마크 리스트 */}
            <button
              onClick={handleBookmarkList}
              className="bg-white rounded-[16px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.24)] p-3 flex items-center gap-2 w-full hover:bg-gray-50 transition-colors"
            >
              <img
                src="/icons/bookmark-added.svg"
                className="w-4 h-4"
                alt="Bookmark"
              />
              <span className="text-mypage-content-600 text-gray-950">
                Bookmarks & Reviews
              </span>
            </button>

            {/* Disconnect Wallet */}
            <button
              onClick={handleDisconnect}
              className="bg-white rounded-[16px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.24)] p-3 flex items-center gap-2 w-full hover:bg-gray-50 transition-colors"
            >
              <img
                src="/icons/close.svg"
                className="w-4 h-4"
                alt="Disconnect"
              />
              <span className="text-mypage-content-600 text-gray-950">
                Disconnect Wallet
              </span>
            </button>
          </div>

          {/* 하단 버튼들 */}
          <div className="flex gap-1.5 w-full">
            <button
              onClick={handleHowToEarn}
              className="flex-1 bg-gray-200 rounded-[8px] p-2 hover:bg-gray-300 transition-colors"
            >
              <span className="text-mypage-content-600 text-gray-500">
                how to earn
              </span>
            </button>
            <button
              onClick={handleLeaderboard}
              className="flex-1 bg-gray-200 rounded-[8px] p-2 hover:bg-gray-300 transition-colors"
            >
              <span className="text-mypage-content-600 text-gray-500">
                Leader board
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserMenu;
