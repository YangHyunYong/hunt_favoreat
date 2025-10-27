import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import ConnectWalletButton from "../components/ConnectWalletButton";
import UserMenu from "../components/UserMenu";
import Navigator, { TabType } from "../components/Navigator";
import { getReviewsWithImages } from "../supabaseClient";

export interface FeedItem {
  id: string;
  type: "image" | "text";
  imageUrl?: string;
  text?: string;
  username: string;
  userAvatar?: string;
  likes: number;
  width?: number;
  height?: number;
  left?: number;
  top?: number;
}

// 피드 컨텐츠 컴포넌트 (MainPage에서도 사용 가능)
export const RecentFeedContent: React.FC = () => {
  const [feedItems, setFeedItems] = useState<
    (FeedItem & { left: number; top: number })[]
  >([]);
  const [loading, setLoading] = useState(true);

  // 지갑 주소를 짧은 형식으로 변환
  const formatWalletAddress = (wallet: string): string => {
    if (!wallet) return "unknown";
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  };

  // 이미지 크기 확인 함수
  const getImageDimensions = (
    url: string
  ): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        // 로드 실패 시 기본값 (정사각형)
        resolve({ width: 1, height: 1 });
      };
      img.src = url;
    });
  };

  // 이미지 비율에 따라 카드 타입 결정
  const getCardType = (
    width: number,
    height: number
  ): {
    width: number | string;
    height: number;
    isFullWidth: boolean;
  } => {
    const aspectRatio = width / height;

    // 가로가 세로보다 훨씬 긴 경우 (가로 직사각형) - w-full x 160
    if (aspectRatio > 1.5) {
      return { width: "100%", height: 160, isFullWidth: true };
    }
    // 세로가 가로보다 긴 경우 (세로 직사각형) - 160 x 240
    else if (aspectRatio < 0.8) {
      return { width: 160, height: 240, isFullWidth: false };
    }
    // 정사각형 또는 비슷한 경우 - 160 x 160
    else {
      return { width: 160, height: 160, isFullWidth: false };
    }
  };

  // 최신 리뷰 가져오기
  useEffect(() => {
    const fetchRecentReviews = async () => {
      try {
        setLoading(true);
        const reviews = await getReviewsWithImages();
        console.log("최신 리뷰 데이터:", reviews);

        // 리뷰를 FeedItem 형태로 변환
        const convertedItems: (FeedItem & { left: number; top: number })[] = [];
        let leftColTop = 20;
        let rightColTop = 20;
        const itemGap = 16;
        const leftColX = 28;
        const rightColX = 204;
        // px-7 = 28px 좌우 패딩, 컨텐츠 영역 너비 계산
        // w-full 카드는 leftColX부터 오른쪽 끝까지
        const fullWidth = 319; // 375 - 28 - 28 = 319px (px-7 좌우 패딩 제외)

        // 각 리뷰의 이미지 크기를 확인하고 카드 타입 결정
        for (const review of reviews.slice(0, 20)) {
          const photos = review.photos || [];
          const hasImage = photos.length > 0;
          const hasText = review.body && review.body.trim().length > 0;
          const username = formatWalletAddress(review.author_wallet);
          const likes = review.like_count || 0;

          // 이미지가 있으면 이미지 카드 생성
          if (hasImage) {
            const firstPhoto = photos[0];
            const photoUrl =
              typeof firstPhoto === "string"
                ? firstPhoto
                : firstPhoto.url || "";

            // 이미지 크기 확인
            const { width: imgWidth, height: imgHeight } =
              await getImageDimensions(photoUrl);
            const cardType = getCardType(imgWidth, imgHeight);

            let width: number;
            let height: number;
            let x: number;
            let y: number;
            let useLeftCol: boolean;

            if (cardType.isFullWidth) {
              // w-full 카드는 컨테이너 전체 너비 사용 (패딩 내부)
              width = fullWidth;
              height = cardType.height;
              x = 0; // 패딩 내부 시작점
              y = leftColTop;
              leftColTop += height + itemGap;
              // w-full 카드는 오른쪽 열 위치도 조정 (같은 높이만큼)
              if (rightColTop < leftColTop) {
                rightColTop = leftColTop;
              }
            } else {
              // 160x160 또는 160x240 카드
              width = cardType.width as number;
              height = cardType.height;
              // 더 낮은 열에 배치
              useLeftCol = leftColTop <= rightColTop;
              x = useLeftCol ? leftColX : rightColX;
              y = useLeftCol ? leftColTop : rightColTop;

              if (useLeftCol) {
                leftColTop += height + itemGap;
              } else {
                rightColTop += height + itemGap;
              }
            }

            convertedItems.push({
              id: `review-${review.id}-image`,
              type: "image",
              imageUrl: photoUrl,
              username,
              likes,
              width,
              height,
              left: x,
              top: y,
            });
          }

          // 텍스트가 있고 이미지가 없으면 텍스트 카드 생성 (160x160)
          if (hasText && !hasImage) {
            // 더 낮은 열에 배치
            const useLeftCol = leftColTop <= rightColTop;
            const x = useLeftCol ? leftColX : rightColX;
            let y = useLeftCol ? leftColTop : rightColTop;

            if (useLeftCol) {
              y = leftColTop;
              leftColTop += 160 + itemGap;
            } else {
              y = rightColTop;
              rightColTop += 160 + itemGap;
            }

            convertedItems.push({
              id: `review-${review.id}-text`,
              type: "text",
              text: review.body || "",
              username,
              likes,
              width: 160,
              height: 160,
              left: x,
              top: y,
            });
          }
        }

        setFeedItems(convertedItems);
      } catch (error) {
        console.error("최신 리뷰 가져오기 실패:", error);
        setFeedItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentReviews();
  }, []);

  const FeedCard: React.FC<{ item: FeedItem }> = ({ item }) => {
    if (item.type === "image" && item.imageUrl) {
      const isFullWidth =
        typeof item.width === "string" ||
        item.width === undefined ||
        item.width > 300;
      return (
        <div
          className="relative rounded-[16px] overflow-hidden"
          style={{
            width: isFullWidth ? "100%" : item.width || 160,
            height: item.height || 160,
          }}
        >
          <div className="absolute inset-0 bg-gray-200 rounded-[16px]">
            <img
              src={item.imageUrl}
              alt="Feed"
              className="w-full h-full object-cover rounded-[16px]"
            />
          </div>

          {/* User info overlay */}
          <div className="absolute top-2 left-2 right-2 bg-[rgba(245,245,245,0.9)] flex gap-2 items-center rounded-[24px] px-2 py-1.5">
            <div className="bg-[#ffe41c] rounded-[24px] shrink-0 w-6 h-6 flex items-center justify-center overflow-hidden">
              <div className="w-full h-full rounded-full bg-red-500" />
            </div>
            <p className="text-[12px] font-semibold leading-[16px] text-gray-800">
              {item.username}
            </p>
          </div>

          {/* Likes overlay */}
          {item.likes > 0 && (
            <div className="absolute bottom-2 right-2 bg-[rgba(245,245,245,0.9)] px-2 py-1.5 rounded-[24px]">
              <p className="text-[10px] font-normal leading-[12px] text-gray-500">
                {item.likes} like{item.likes !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
      );
    }

    if (item.type === "text" && item.text) {
      return (
        <div
          className="bg-gray-200 rounded-[16px] p-2 flex flex-col gap-2"
          style={{
            width: item.width || 160,
            height: item.height || 160,
          }}
        >
          <div className="flex gap-2 items-center">
            <div className="bg-[#ffe41c] rounded-[24px] shrink-0 w-6 h-6 flex items-center justify-center overflow-hidden">
              <div className="w-full h-full rounded-full bg-red-500" />
            </div>
            <p className="text-[12px] font-semibold leading-[16px] text-gray-800">
              {item.username}
            </p>
          </div>
          <div className="text-[12px] font-normal leading-[14px] text-gray-700 whitespace-pre-wrap">
            {item.text}
          </div>
          {item.likes > 0 && (
            <p className="text-[10px] font-normal leading-[12px] text-gray-500">
              {item.likes} like{item.likes !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (feedItems.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">최신 리뷰가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="relative px-7 py-5">
      <div style={{ minHeight: 800 }}>
        {/* Masonry layout - positioned absolutely */}
        {feedItems.map((item) => (
          <div
            key={item.id}
            className="absolute"
            style={{
              left: `${item.left}px`,
              top: `${item.top}px`,
            }}
          >
            <FeedCard item={item} />
          </div>
        ))}
      </div>
    </div>
  );
};

const RecentPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("recent");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <div className="bg-gray-100 min-h-screen">
      <Header
        leftElement={
          <div className="flex items-center gap-[2px]">
            <img
              src="/icons/icon-filled.svg"
              alt="Logo"
              className="h-[30.75px] w-auto"
            />
            <img
              src="/icons/favoreat.svg"
              alt="Favoreat"
              className="h-[14px] w-auto"
            />
          </div>
        }
        rightElement={
          <ConnectWalletButton onOpenUserMenu={() => setIsUserMenuOpen(true)} />
        }
      />

      <div className="pt-12">
        <Navigator activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Feed Container */}
        <RecentFeedContent />
      </div>

      <UserMenu
        isOpen={isUserMenuOpen}
        onClose={() => setIsUserMenuOpen(false)}
      />
    </div>
  );
};

export default RecentPage;
