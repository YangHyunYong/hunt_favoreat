import React, { useState, useEffect } from "react";
import { getLeaderboard, getTodayReviewCounts } from "../supabaseClient";
import { useAccount } from "wagmi";

interface LeaderboardUser {
  wallet_address: string;
  user_name: string | null;
  user_pfp_url: string | null;
  points: number;
  todayReviewCount?: number; // 오늘 작성한 리뷰 개수 (weekly일 때만 사용)
}

const Leaderboard: React.FC = () => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"weekly" | "total">("weekly");
  const { address } = useAccount();

  const currentUserAddress = address;

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const data = await getLeaderboard();

        // weekly일 때는 오늘 작성한 리뷰 개수도 가져오기
        if (period === "weekly") {
          const walletAddresses = data.map((user) => user.wallet_address);
          const reviewCounts = await getTodayReviewCounts(walletAddresses);

          const usersWithCounts = data.map((user) => ({
            ...user,
            todayReviewCount: reviewCounts[user.wallet_address] || 0,
          }));

          setUsers(usersWithCounts);
        } else {
          setUsers(data);
        }
      } catch (error) {
        console.error("리더보드 데이터 가져오기 실패:", error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();

    // UTC 날짜가 바뀔 때 자동으로 갱신 (weekly일 때만)
    if (period === "weekly") {
      const getUTCDateString = () => {
        const now = new Date();
        return `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}`;
      };

      let currentUTCDate = getUTCDateString();

      // 1분마다 UTC 날짜 확인
      const interval = setInterval(() => {
        const newUTCDate = getUTCDateString();
        if (newUTCDate !== currentUTCDate) {
          currentUTCDate = newUTCDate;
          fetchLeaderboard();
        }
      }, 60000); // 1분마다 확인

      return () => clearInterval(interval);
    }
  }, [period]);

  // 포인트를 포맷팅 (쉼표 추가)
  const formatPoints = (points: number): string => {
    return points.toLocaleString();
  };

  // 사용자 이름 또는 지갑 주소 표시
  const getUserDisplayName = (user: LeaderboardUser): string => {
    if (user.user_name) {
      return user.user_name;
    }
    const addr = user.wallet_address;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // 현재 사용자인지 확인
  const isCurrentUser = (walletAddress: string): boolean => {
    if (!currentUserAddress) return false;
    return walletAddress.toLowerCase() === currentUserAddress.toLowerCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[18px] font-semibold text-gray-700">Loading...</p>
      </div>
    );
  }

  return (
    <div className="pt-28 bg-gray-100 min-h-screen">
      <div className="flex flex-col gap-4 p-6">
        {/* Weekly/Total 토글 */}
        <div className="bg-gray-200 rounded-[18px] p-1 flex gap-2">
          <button
            onClick={() => setPeriod("weekly")}
            className={`flex-1 rounded-[16px] px-4 py-2 transition-colors ${
              period === "weekly"
                ? "bg-redorange-500 text-white"
                : "text-gray-500"
            }`}
          >
            <p className="text-[15px] font-semibold leading-[24px] tracking-[0.15px] text-center">
              weekly
            </p>
          </button>
          <button
            onClick={() => setPeriod("total")}
            className={`flex-1 rounded-[16px] px-4 py-2 transition-colors ${
              period === "total"
                ? "bg-redorange-500 text-white"
                : "text-gray-500"
            }`}
          >
            <p className="text-[15px] font-semibold leading-[24px] tracking-[0.15px] text-center">
              total
            </p>
          </button>
        </div>

        {/* 리더보드 리스트 */}
        <div className="flex flex-col gap-3">
          {users.map((user, index) => {
            const rank = index + 1;
            const isCurrent = isCurrentUser(user.wallet_address);

            return (
              <div
                key={user.wallet_address}
                className={`bg-white rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] ${
                  isCurrent ? "border-2 border-[#ff4500]" : ""
                }`}
              >
                <div className="flex gap-2 items-center p-4">
                  {/* 순위 표시 (1-3등은 메달, 그 외는 숫자) */}
                  <div className="flex items-center justify-center shrink-0 size-[24px]">
                    {rank === 1 && (
                      <img
                        src="/icons/medal_first.svg"
                        alt="1st"
                        className="block max-w-none size-full"
                      />
                    )}
                    {rank === 2 && (
                      <img
                        src="/icons/medal_second.svg"
                        alt="2nd"
                        className="block max-w-none size-full"
                      />
                    )}
                    {rank === 3 && (
                      <img
                        src="/icons/medal_third.svg"
                        alt="3rd"
                        className="block max-w-none size-full"
                      />
                    )}
                    {rank > 3 && (
                      <p className="text-[16px] font-semibold leading-[24px] text-gray-500 text-center w-[24px]">
                        {rank}
                      </p>
                    )}
                  </div>

                  {/* 프로필 이미지 및 정보 */}
                  <div className="flex flex-1 gap-2 items-center min-w-0">
                    <div className="bg-[#e5e5e5] rounded-[24px] shrink-0 size-[32px] overflow-hidden">
                      {user.user_pfp_url ? (
                        <img
                          src={user.user_pfp_url}
                          alt={getUserDisplayName(user)}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-red-500 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white">
                            {getUserDisplayName(user).slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-start justify-center shrink-0 min-w-0">
                      <p className="text-[15px] font-semibold leading-[24px] text-gray-900 tracking-[0.15px] truncate w-full">
                        {getUserDisplayName(user)}
                      </p>
                      <div className="flex gap-2 items-center">
                        <p className="text-[10px] font-normal leading-[12px] text-gray-500">
                          {formatPoints(user.points)} YuP
                        </p>
                        {/* Weekly일 때 스탬프 표시 */}
                        {period === "weekly" && (
                          <div className="flex gap-[2px] items-center">
                            {Array.from({ length: 5 }).map((_, i) => {
                              const isChecked =
                                (user.todayReviewCount || 0) > i;
                              return (
                                <div
                                  key={i}
                                  className="relative shrink-0 size-[12px]"
                                >
                                  <img
                                    src={
                                      isChecked
                                        ? "/icons/icon-checked.svg"
                                        : "/icons/icon-unchecked.svg"
                                    }
                                    alt={isChecked ? "checked" : "unchecked"}
                                    className="block max-w-none size-full"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 트로피 아이콘 */}
                  <div className="relative shrink-0 size-[16px]">
                    <img
                      src="/icons/throphy.svg"
                      alt="trophy"
                      className="block max-w-none size-full"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {users.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <p className="text-gray-500">리더보드 데이터가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
