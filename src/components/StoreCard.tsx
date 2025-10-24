import React, { useState, useEffect } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { useAccount } from "wagmi";
import {
  addBookmark,
  removeBookmark,
  getMyBookmarks,
  ensurePlaceExists,
} from "../supabaseClient";

export interface StoreCardProps {
  title: string;
  photos: string[]; // 최소 0~2장 사용
  rating?: number; // 0~5
  ratingCount?: number;
  distanceMeters?: number; // 909m 같은 표기
  storeName?: string; // "패스트푸드"
  addressPreview?: string; // 두 줄 프리뷰
  placeId?: string; // Google Places API placeId
  placeAddress?: string; // 상세 주소
  latitude?: number; // 위도
  longitude?: number; // 경도
  bookmarked?: boolean;
  onToggleBookmark?: () => void;
  onViewDetails?: () => void;
}

const Stars: React.FC<{ rating?: number }> = ({ rating = 0 }) => {
  const full = Math.round(Math.min(5, Math.max(0, rating)));
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={i < full ? "text-orange-500 w-4" : "text-gray-300 w-4"}
        >
          ★
        </span>
      ))}
    </div>
  );
};

function formatDistance(m?: number) {
  if (m == null) return "";
  if (m >= 1000) return `${(m / 1000).toFixed(1)}km`;
  return `${Math.round(m)}m`;
}

const StoreCard: React.FC<StoreCardProps> = ({
  title,
  photos = [],
  rating = 0,
  ratingCount = 0,
  distanceMeters,
  storeName,
  addressPreview,
  placeId,
  placeAddress,
  latitude,
  longitude,
  bookmarked,
  onViewDetails,
}) => {
  const { address: appKitAddress } = useAppKitAccount();
  const { address: wagmiAddress } = useAccount();

  // Farcaster 자동 로그인과 일반 로그인 모두 지원
  const address = wagmiAddress || appKitAddress;
  const [isBookmarked, setIsBookmarked] = useState<boolean>(
    bookmarked || false
  );
  const [isBookmarkLoading, setIsBookmarkLoading] = useState<boolean>(false);

  const img1 = photos[0];
  const img2 = photos[1];

  // 북마크 상태 확인
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (!placeId || !address) return;

      try {
        const uuidPlaceId = await ensurePlaceExists(
          placeId,
          title,
          placeAddress,
          latitude,
          longitude
        );
        const bookmarks = await getMyBookmarks(address);
        const isBookmarkedInServer = bookmarks.some(
          (bookmark) => bookmark.place_id === uuidPlaceId
        );
        setIsBookmarked(isBookmarkedInServer);
      } catch (error) {
        console.error("북마크 상태 조회 실패:", error);
      }
    };

    checkBookmarkStatus();
  }, [placeId, address]);

  // 북마크 토글 핸들러
  const handleBookmarkToggle = async () => {
    if (!placeId || !address) {
      console.log("지갑을 연결해주세요.");
      return;
    }

    if (isBookmarkLoading) return;

    const originalBookmarkState = isBookmarked;
    setIsBookmarkLoading(true);

    // 즉시 UI 상태 변경 (Optimistic Update)
    setIsBookmarked(!isBookmarked);

    try {
      console.log("StoreCard 북마크 토글 - placeId:", placeId);
      const uuidPlaceId = await ensurePlaceExists(
        placeId,
        title,
        placeAddress,
        latitude,
        longitude
      );
      console.log("StoreCard 북마크 토글 - uuidPlaceId:", uuidPlaceId);

      if (originalBookmarkState) {
        // 북마크 해제
        await removeBookmark(uuidPlaceId, address);
      } else {
        // 북마크 추가
        await addBookmark(uuidPlaceId, address);
      }
    } catch (error) {
      console.error("북마크 처리 실패:", error);
      // 실패 시 원래 상태로 되돌리기
      setIsBookmarked(originalBookmarkState);
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  return (
    <div
      className="rounded-[24px] bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.04)] border border-gray-200 px-5 pt-6 pb-5 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onViewDetails}
    >
      {/* 제목 + 북마크 */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-location-content-700 text-gray-700">{title}</h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleBookmarkToggle();
          }}
          disabled={isBookmarkLoading}
          className={`p-2 rounded-full bg-white transition-colors ${
            isBookmarkLoading
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-gray-50"
          }`}
          aria-label={isBookmarked ? "북마크 해제" : "북마크 추가"}
        >
          <img
            src={
              isBookmarked ? "/icons/bookmark-added.svg" : "/icons/bookmark.svg"
            }
            className="w-5 h-5"
            alt={isBookmarked ? "Bookmarked" : "Not bookmarked"}
          />
        </button>
      </div>

      {/* 이미지 처리 */}
      {photos.length === 0 ? (
        // 이미지가 하나도 없으면 하나의 no Image 표시
        <div className="mt-5">
          <div className="flex h-[200px] justify-center items-center bg-gray-100 text-gray-500 rounded-[24px]">
            no Image
          </div>
        </div>
      ) : (
        // 이미지가 있으면 grid로 표시
        <div className="grid grid-cols-2 gap-4 mt-5">
          <div className="rounded-[24px] overflow-hidden h-[136px]">
            {img1 ? (
              <img
                src={img1}
                alt="photo 1"
                className="w-full h-[136px] object-cover"
              />
            ) : (
              <div className="flex h-[136px] justify-center items-center bg-gray-100 text-gray-500 rounded-[24px]">
                no Image
              </div>
            )}
          </div>
          <div className="rounded-[24px] overflow-hidden h-[136px]">
            {img2 ? (
              <img
                src={img2}
                alt="photo 2"
                className="w-full h-[136px] object-cover"
              />
            ) : (
              <div className="flex h-[136px] justify-center items-center bg-gray-100 text-gray-500 rounded-[24px]">
                no Image
              </div>
            )}
          </div>
        </div>
      )}

      {/* 별점/리뷰수/거리 */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <Stars rating={rating} />
          <span className="text-rating-count">({ratingCount})</span>
        </div>
        <div className="text-gray-500 text-body-content">
          At my location
          <span className="text-orange-500 font-semibold ml-1">
            {formatDistance(distanceMeters)}
          </span>
        </div>
      </div>

      {/* 가게명/주소 프리뷰 */}
      {storeName && (
        <div className="mt-4 text-teal-500 text-rating-count font-bold text-body-content">
          {storeName}
        </div>
      )}
      {addressPreview && (
        <p className="mt-1 text-gray-500 text-location-content-400 line-clamp-2">
          {addressPreview}
        </p>
      )}
    </div>
  );
};

export default StoreCard;
