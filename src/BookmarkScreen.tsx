import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppKitAccount } from "@reown/appkit/react";
import { useAccount } from "wagmi";
import {
  getReviewsWithImages,
  getBookmarkPlacesWithReviews,
  supabase,
} from "./supabaseClient";
import Header from "./components/Header";
import ConnectWalletButton from "./components/ConnectWalletButton";
import UserMenu from "./components/UserMenu";

interface BookmarkData {
  id: string;
  name: string;
  address_text?: string;
  latitude?: number;
  longitude?: number;
  reviews: {
    id: string;
    rating: number;
    body?: string;
    created_at: string;
    author_wallet: string;
    photos: string[];
  }[];
  totalReviews: number;
  averageRating: number;
}

interface ReviewData {
  id: string;
  place_id: string;
  author_wallet: string;
  body?: string;
  rating: number;
  created_at: string;
  photos: string[];
  like_count: number;
  place: {
    id: string;
    name: string;
    address_text?: string;
    latitude?: number;
    longitude?: number;
  } | null;
}

const BookmarkScreen: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected, address } = useAccount();
  const { isConnected: isReownConnected, address: reownAddress } =
    useAppKitAccount();
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"bookmarks" | "reviews">(
    "bookmarks"
  );
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // 자동 로그인 시에는 useAccount, 그 외에는 useAppKitAccount 사용
  const isWalletConnected = isConnected || isReownConnected;
  const walletAddress = isConnected ? address : reownAddress;

  useEffect(() => {
    const loadData = async () => {
      if (isWalletConnected && walletAddress) {
        try {
          console.log("로딩 시작 - 지갑 주소:", walletAddress);
          const [bookmarkData, reviewData] = await Promise.all([
            getBookmarkPlacesWithReviews(walletAddress),
            getReviewsWithImages(undefined, walletAddress),
          ]);
          console.log("북마크 데이터:", bookmarkData);
          console.log("리뷰 데이터:", reviewData);
          console.log("리뷰 데이터 개수:", reviewData?.length || 0);
          setBookmarks(bookmarkData);
          setReviews(reviewData);
        } catch (error) {
          console.error("데이터 로드 실패:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    loadData();
  }, [isWalletConnected, walletAddress]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleBookmarkClick = (bookmark: BookmarkData) => {
    const slug = bookmark.name
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, "-")
      .replace(/^-+|-+$/g, "");
    navigate(`/store/${slug}`, {
      state: {
        displayName: bookmark.name,
        placeId: bookmark.id,
        distanceMeters: undefined,
      },
    });
  };

  const handleRemoveBookmark = async (placeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (!walletAddress) return;

      // 북마크를 찾기 위해 place_id로 검색
      const { data: bookmarkData, error: findError } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("place_id", placeId)
        .eq("wallet_address", walletAddress.toLowerCase())
        .single();

      if (findError) {
        console.error("북마크 찾기 실패:", findError);
        return;
      }

      if (bookmarkData) {
        // 북마크 삭제 (place_id와 wallet_address로 삭제)
        const { error: deleteError } = await supabase
          .from("bookmarks")
          .delete()
          .eq("place_id", placeId)
          .eq("wallet_address", walletAddress.toLowerCase());

        if (deleteError) {
          console.error("북마크 삭제 실패:", deleteError);
          return;
        }

        setBookmarks((prev) => prev.filter((b) => b.id !== placeId));
      }
    } catch (error) {
      console.error("북마크 제거 실패:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center">
        <div className="text-gray-600">북마크를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200">
      <Header
        leftElement={
          <button
            onClick={handleBack}
            className="bg-white/60 flex items-center"
          >
            <img src="/icons/chevron-left.svg" className="w-8 h-8" alt="뒤로" />
          </button>
        }
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

      <div className="p-5">
        {/* Toggle */}
        <div className="bg-gray-300 rounded-2xl mb-6">
          <div className="flex">
            <button
              onClick={() => setActiveTab("bookmarks")}
              className={`flex-1 rounded-2xl p-3 flex items-center justify-center gap-2 transition-all ${
                activeTab === "bookmarks"
                  ? "bg-white shadow-[0px_0px_4px_0px_rgba(0,0,0,0.24)]"
                  : ""
              }`}
            >
              <img
                src={
                  activeTab === "bookmarks"
                    ? "/icons/bookmark-added.svg"
                    : "/icons/bookmark.svg"
                }
                className="w-4 h-4"
                alt="Bookmark"
              />
              <p
                className={`text-xs font-semibold ${
                  activeTab === "bookmarks" ? "text-gray-950" : "text-gray-600"
                }`}
              >
                Bookmark List ({bookmarks.length})
              </p>
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`flex-1 rounded-2xl p-3 flex items-center justify-center gap-2 transition-all ${
                activeTab === "reviews"
                  ? "bg-white shadow-[0px_0px_4px_0px_rgba(0,0,0,0.24)]"
                  : ""
              }`}
            >
              <img
                src={
                  activeTab === "reviews"
                    ? "/icons/star-added.svg"
                    : "/icons/star.svg"
                }
                className="w-4 h-4"
                alt="Reviews"
              />
              <p
                className={`text-xs font-semibold ${
                  activeTab === "reviews" ? "text-gray-950" : "text-gray-600"
                }`}
              >
                My Reviews ({reviews.length})
              </p>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {activeTab === "bookmarks" ? (
            bookmarks.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[400px]">
                <img
                  src="/icons/box.svg"
                  alt="빈 상태"
                  className="w-16 h-16 mb-4 opacity-60"
                />
                <p className="text-gray-500">북마크한 식당이 아직 없습니다</p>
              </div>
            ) : (
              bookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  onClick={() => handleBookmarkClick(bookmark)}
                  className="bg-gray-50 rounded-2xl p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <p className="flex-1 text-base font-semibold text-gray-700 truncate">
                      {bookmark.name}
                    </p>
                    <button
                      onClick={(e) => handleRemoveBookmark(bookmark.id, e)}
                      className="bg-gray-100 p-1 rounded-lg flex items-center justify-center"
                    >
                      <img
                        src="/icons/trash.svg"
                        className="w-5 h-5"
                        alt="삭제"
                      />
                    </button>
                  </div>

                  {/* 리뷰 이미지들 표시 */}
                  {bookmark.reviews.length > 0 &&
                  bookmark.reviews[0].photos.length > 0 ? (
                    <div className="h-16 rounded-lg mb-4 flex gap-1">
                      {bookmark.reviews[0].photos
                        .slice(0, 2)
                        .map((photo, index) => (
                          <div
                            key={index}
                            className="flex-1 rounded-lg overflow-hidden"
                          >
                            <img
                              src={photo}
                              alt={`리뷰 이미지 ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="h-16 rounded-lg bg-gray-200 mb-4 flex items-center justify-center">
                      <span className="text-gray-500 text-sm">이미지 없음</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-teal-500">
                      Restaurant
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {bookmark.address_text || "주소 정보 없음"}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <div className="text-orange-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i}>
                              {i < Math.round(bookmark.averageRating)
                                ? "★"
                                : "☆"}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
              <img
                src="/icons/box.svg"
                alt="빈 상태"
                className="w-16 h-16 mb-4 opacity-60"
              />
              <p className="text-gray-500">작성한 리뷰가 아직 없습니다</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div
                key={review.id}
                onClick={() => {
                  if (review.place) {
                    const slug = review.place.name
                      .toLowerCase()
                      .replace(/[^a-z0-9가-힣]+/g, "-")
                      .replace(/^-+|-+$/g, "");
                    navigate(`/store/${slug}`, {
                      state: {
                        displayName: review.place.name,
                        placeId: review.place_id,
                        distanceMeters: undefined,
                      },
                    });
                  }
                }}
                className="bg-gray-50 rounded-2xl p-4 cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2 mb-4">
                  <p className="flex-1 text-base font-semibold text-gray-700 truncate">
                    {review.place?.name || "Unknown"}
                  </p>
                  <span className="text-xs text-gray-500">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-gray-700">
                    {review.body || "리뷰 내용 없음"}
                  </p>

                  {review.photos.length > 0 && (
                    <div className="flex gap-2">
                      {review.photos.slice(0, 3).map((photo, index) => {
                        // photo가 객체인 경우 url 속성 사용, 문자열인 경우 그대로 사용
                        const imageUrl =
                          typeof photo === "string"
                            ? photo
                            : (photo as any).url;
                        return (
                          <div
                            key={index}
                            className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center"
                          >
                            <img
                              src={imageUrl}
                              alt={`리뷰 이미지 ${index + 1}`}
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                console.error(
                                  `리뷰 이미지 로드 실패 [${index}]:`,
                                  imageUrl
                                );
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="text-orange-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i}>
                          {i < Math.floor(review.rating) ? "★" : "☆"}
                        </span>
                      ))}
                    </div>
                    <span>❤️ {review.like_count}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <UserMenu
        isOpen={isUserMenuOpen}
        onClose={() => setIsUserMenuOpen(false)}
      />
    </div>
  );
};

export default BookmarkScreen;
