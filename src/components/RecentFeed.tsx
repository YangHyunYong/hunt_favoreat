import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getReviewsWithImages, supabase } from "../supabaseClient";

// 이미지 크기 캐시 (메모리 + localStorage)
const imageSizeCache = new Map<string, { width: number; height: number }>();
const CACHE_KEY_PREFIX = "image_size_cache_";
const MAX_CACHE_SIZE = 500; // 최대 캐시 개수

// localStorage에서 캐시 로드
const loadCacheFromStorage = () => {
  try {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter((key) => key.startsWith(CACHE_KEY_PREFIX));
    cacheKeys.forEach((key) => {
      const url = key.replace(CACHE_KEY_PREFIX, "");
      if (!url) return; // 빈 URL은 무시
      const cached = localStorage.getItem(key);
      if (cached) {
        try {
          const { width, height } = JSON.parse(cached);
          imageSizeCache.set(url, { width, height });
        } catch (e) {
          // 파싱 실패 시 무시
        }
      }
    });
  } catch (e) {
    console.warn("캐시 로드 실패:", e);
  }
};

// localStorage에 캐시 저장
const saveCacheToStorage = (url: string, width: number, height: number) => {
  if (!url) return; // URL이 없으면 저장하지 않음
  try {
    // 캐시 크기 제한 (오래된 항목 제거)
    if (imageSizeCache.size >= MAX_CACHE_SIZE) {
      const firstKey = imageSizeCache.keys().next().value;
      if (firstKey) {
        imageSizeCache.delete(firstKey);
        localStorage.removeItem(CACHE_KEY_PREFIX + firstKey);
      }
    }

    imageSizeCache.set(url, { width, height });
    localStorage.setItem(
      CACHE_KEY_PREFIX + url,
      JSON.stringify({ width, height })
    );
  } catch (e) {
    // localStorage 용량 초과 시 메모리 캐시만 사용
    console.warn("캐시 저장 실패:", e);
  }
};

// 초기 캐시 로드
loadCacheFromStorage();

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
  placeId?: string;
}

interface RecentFeedProps {
  activeTab?: string;
}

const RecentFeed: React.FC<RecentFeedProps> = ({ activeTab }) => {
  const navigate = useNavigate();
  const [feedItems, setFeedItems] = useState<
    (FeedItem & { left: number; top: number })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [containerHeight, setContainerHeight] = useState<number>(0);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const ITEMS_PER_PAGE = 20;
  const INITIAL_LOAD_COUNT = 10; // 초기 로딩 시 더 적은 데이터만 먼저 로드

  // 사용자 이름과 아바타 가져오기
  const getUserInfo = (review: any) => {
    const user = review.users || null;
    const userName = user?.user_name || null;
    const userPfpUrl = user?.user_pfp_url || null;
    const walletAddress = review.author_wallet || "";

    // user_name이 있으면 사용, 없으면 지갑 주소 앞 두자리 (0x 제외)
    const displayName =
      userName || walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4);

    return {
      displayName,
      pfpUrl: userPfpUrl,
      walletAddress,
    };
  };

  // 이미지 크기 확인 함수 (캐싱 적용)
  const getImageDimensions = (
    url: string
  ): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      // 캐시 확인
      const cached = imageSizeCache.get(url);
      if (cached) {
        resolve(cached);
        return;
      }

      // 캐시에 없으면 이미지 로드
      const img = new Image();
      img.onload = () => {
        const dimensions = {
          width: img.naturalWidth,
          height: img.naturalHeight,
        };
        // 캐시에 저장
        saveCacheToStorage(url, dimensions.width, dimensions.height);
        resolve(dimensions);
      };
      img.onerror = () => {
        // 로드 실패 시 기본값 (정사각형)을 캐시에 저장하지 않음
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

  // 리뷰를 카드로 변환하는 함수
  const convertReviewsToItems = async (
    reviews: any[],
    startTop: { left: number; right: number },
    containerWidthValue?: number
  ): Promise<{
    items: (FeedItem & { left: number; top: number })[];
    endTop: { left: number; right: number };
  }> => {
    const convertedItems: (FeedItem & { left: number; top: number })[] = [];
    let leftColTop = startTop.left;
    let rightColTop = startTop.right;
    const itemGap = 16;
    const cardWidth = 160;

    // 컨테이너 너비를 기준으로 x축 여백 자동 계산
    const width = containerWidthValue || containerWidth || window.innerWidth;
    const totalCardsWidth = cardWidth * 2 + itemGap; // 두 개의 카드 + gap
    const sideMargin = Math.max(20, (width - totalCardsWidth) / 2); // 최소 20px 여백
    const leftColX = sideMargin;
    const rightColX = sideMargin + cardWidth + itemGap;
    const fullWidth = width - sideMargin * 2;

    // 이미지가 있는 리뷰들을 먼저 수집하고 병렬로 크기 확인
    const imageReviewData: Array<{
      review: any;
      photoUrl: string;
      userInfo: ReturnType<typeof getUserInfo>;
    }> = [];

    for (const review of reviews) {
      const photos = review.photos || [];
      const hasImage = photos.length > 0;

      if (hasImage) {
        const firstPhoto = photos[0];
        let photoUrl: string = "";
        if (typeof firstPhoto === "string") {
          photoUrl = firstPhoto;
        } else if (firstPhoto && typeof firstPhoto === "object") {
          photoUrl = (firstPhoto as any)?.url || "";
        }

        if (photoUrl) {
          imageReviewData.push({
            review,
            photoUrl,
            userInfo: getUserInfo(review),
          });
        }
      }
    }

    // 모든 이미지 크기를 병렬로 확인 (순차 처리보다 훨씬 빠름)
    const imageDimensions = await Promise.all(
      imageReviewData.map(({ photoUrl }) => getImageDimensions(photoUrl))
    );

    // 이미지 크기 맵 생성 (review.id -> dimensions)
    const imageSizeMap = new Map<string, { width: number; height: number }>();
    imageReviewData.forEach(({ review }, index) => {
      imageSizeMap.set(review.id, imageDimensions[index]);
    });

    // 각 리뷰의 이미지 크기를 확인하고 카드 타입 결정
    for (const review of reviews) {
      const photos = review.photos || [];
      const hasImage = photos.length > 0;
      const hasText = review.body && review.body.trim().length > 0;
      const userInfo = getUserInfo(review);
      const username = userInfo.displayName;
      const userAvatar = userInfo.pfpUrl;
      const likes = review.like_count || 0;
      const placeId = review.place_id;

      // 이미지가 있으면 이미지 카드 생성
      if (hasImage) {
        const firstPhoto = photos[0];
        // photo가 객체인 경우 url 속성 사용, 문자열인 경우 그대로 사용
        let photoUrl: string = "";
        if (typeof firstPhoto === "string") {
          photoUrl = firstPhoto;
        } else if (firstPhoto && typeof firstPhoto === "object") {
          photoUrl = (firstPhoto as any)?.url || "";
        }

        // photoUrl이 없으면 스킵
        if (!photoUrl) {
          continue;
        }

        // 병렬로 확인한 이미지 크기 사용
        const dimensions = imageSizeMap.get(review.id);
        if (!dimensions) continue;

        const { width: imgWidth, height: imgHeight } = dimensions;
        const cardType = getCardType(imgWidth, imgHeight);

        let width: number;
        let height: number;
        let x: number;
        let y: number;
        let useLeftCol: boolean;

        if (cardType.isFullWidth) {
          // w-full 카드는 leftColX부터 시작하고 337px 고정 너비
          width = fullWidth;
          height = cardType.height;
          x = leftColX; // 왼쪽 여백 적용

          // 공백 최소화: 두 열 중 더 낮은 높이에 배치하여 공백 채우기
          // 겹침 방지: 현재 가장 높은 위치에 배치
          y = Math.max(leftColTop, rightColTop);

          // 두 열 모두 같은 높이로 맞춤 (fullWidth 카드 높이만큼 증가)
          // 겹침 방지를 위해 현재 위치 + 높이 + 간격으로 설정
          leftColTop = y + height + itemGap;
          rightColTop = y + height + itemGap;
        } else {
          // 160x160 또는 160x240 카드
          width = cardType.width as number;
          height = cardType.height;

          // 겹침 방지: 더 낮은 열에 배치하되, 현재 위치를 정확히 계산
          useLeftCol = leftColTop <= rightColTop;
          x = useLeftCol ? leftColX : rightColX;
          y = useLeftCol ? leftColTop : rightColTop;

          // 겹침 방지: 배치 후 해당 열의 높이를 정확히 업데이트
          if (useLeftCol) {
            leftColTop = y + height + itemGap;
          } else {
            rightColTop = y + height + itemGap;
          }
        }

        convertedItems.push({
          id: `review-${review.id}-image`,
          type: "image",
          imageUrl: photoUrl,
          username,
          userAvatar,
          likes,
          width,
          height,
          left: x,
          top: y,
          placeId: review.place_id,
        });
      }

      // 텍스트가 있고 이미지가 없으면 텍스트 카드 생성 (160x160)
      if (hasText && !hasImage) {
        // 겹침 방지: 더 낮은 열에 배치하되, 현재 위치를 정확히 계산
        const useLeftCol = leftColTop <= rightColTop;
        const x = useLeftCol ? leftColX : rightColX;
        const y = useLeftCol ? leftColTop : rightColTop;
        const textCardHeight = 160;

        // 겹침 방지: 배치 후 해당 열의 높이를 정확히 업데이트
        if (useLeftCol) {
          leftColTop = y + textCardHeight + itemGap;
        } else {
          rightColTop = y + textCardHeight + itemGap;
        }

        convertedItems.push({
          id: `review-${review.id}-text`,
          type: "text",
          text: review.body || "",
          username,
          userAvatar,
          likes,
          width: 160,
          height: 160,
          left: x,
          top: y,
          placeId: placeId,
        });
      }
    }

    // 공백 영역을 placeholder 카드로 채우기
    // 각 열의 카드들을 top 기준으로 정렬
    const leftColItems = convertedItems
      .filter((item) => item.left === leftColX || item.width === fullWidth)
      .sort((a, b) => (a.top || 0) - (b.top || 0));
    const rightColItems = convertedItems
      .filter((item) => item.left === rightColX || item.width === fullWidth)
      .sort((a, b) => (a.top || 0) - (b.top || 0));

    // fullWidth 카드들의 위치를 추적 (두 열 모두를 차지하는 카드)
    const fullWidthItems = convertedItems.filter(
      (item) => item.width === fullWidth
    );

    // 특정 위치에 fullWidth 카드가 있는지 확인하는 함수
    const isFullWidthAtPosition = (top: number, height: number): boolean => {
      return fullWidthItems.some((item) => {
        const itemTop = item.top || 0;
        const itemHeight = item.height || 0;
        const itemBottom = itemTop + itemHeight;
        const checkBottom = top + height;
        // 겹치는지 확인
        return !(checkBottom <= itemTop || top >= itemBottom);
      });
    };

    let placeholderCounter = 0;
    const maxPlaceholders = 100;

    // 왼쪽 열의 공백 채우기
    let currentLeftTop = startTop.left;
    for (const item of leftColItems) {
      const itemTop = item.top || 0;
      const gap = itemTop - currentLeftTop;

      // gap이 itemGap보다 크면 공백이 있는 것
      if (gap > itemGap) {
        // 실제 사용 가능한 공간 (gap에서 itemGap 제외)
        let remainingSpace = gap - itemGap;

        // 남은 공간을 모두 채움 (160 제한 없이)
        // remainingSpace는 이미 gap - itemGap이므로, placeholder 높이는 remainingSpace 그대로 사용
        if (remainingSpace > 0 && placeholderCounter < maxPlaceholders) {
          // 최소 높이 제한 (16px 이상) - 작은 공간도 채워서 gap을 맞춰줌
          const minHeight = 16;
          if (remainingSpace >= minHeight) {
            const placeholderHeight = remainingSpace;

            // fullWidth 카드 영역과 겹치는지 확인
            if (!isFullWidthAtPosition(currentLeftTop, placeholderHeight)) {
              convertedItems.push({
                id: `placeholder-left-${Date.now()}-${placeholderCounter++}`,
                type: "text",
                text: "",
                username: "",
                userAvatar: undefined,
                likes: 0,
                width: 160,
                height: placeholderHeight,
                left: leftColX,
                top: currentLeftTop,
                placeId: undefined,
              });
              currentLeftTop += placeholderHeight + itemGap;
            }
          }
        }

        // 다음 실제 카드와의 gap이 정확히 itemGap이 되도록 조정
        currentLeftTop = itemTop - itemGap;
      }

      // 실제 카드 다음 위치로 이동
      currentLeftTop = itemTop + (item.height || 0) + itemGap;
    }

    // 오른쪽 열의 공백 채우기
    let currentRightTop = startTop.right;
    for (const item of rightColItems) {
      const itemTop = item.top || 0;
      const gap = itemTop - currentRightTop;

      // gap이 itemGap보다 크면 공백이 있는 것
      if (gap > itemGap) {
        // 실제 사용 가능한 공간 (gap에서 itemGap 제외)
        let remainingSpace = gap - itemGap;

        // 160x160 카드가 들어갈 수 있는 만큼 추가
        while (
          remainingSpace >= 160 + itemGap &&
          placeholderCounter < maxPlaceholders
        ) {
          // fullWidth 카드 영역과 겹치는지 확인
          if (isFullWidthAtPosition(currentRightTop, 160)) {
            // fullWidth 카드 영역이면 placeholder 추가하지 않음
            break;
          }

          convertedItems.push({
            id: `placeholder-right-${Date.now()}-${placeholderCounter++}`,
            type: "text",
            text: "",
            username: "",
            userAvatar: undefined,
            likes: 0,
            width: 160,
            height: 160,
            left: rightColX,
            top: currentRightTop,
            placeId: undefined,
          });
          currentRightTop += 160 + itemGap;
          remainingSpace -= 160 + itemGap;
        }

        // 남은 공간이 있으면 위아래 gap을 유지한 상태로 높이를 채움
        // remainingSpace는 이미 gap - itemGap이므로, placeholder 높이는 remainingSpace 그대로 사용
        if (remainingSpace > 0 && placeholderCounter < maxPlaceholders) {
          // 최소 높이 제한 (16px 이상)
          const minHeight = 16;
          if (remainingSpace >= minHeight) {
            const placeholderHeight = remainingSpace;

            // fullWidth 카드 영역과 겹치는지 확인
            if (!isFullWidthAtPosition(currentRightTop, placeholderHeight)) {
              convertedItems.push({
                id: `placeholder-right-${Date.now()}-${placeholderCounter++}`,
                type: "text",
                text: "",
                username: "",
                userAvatar: undefined,
                likes: 0,
                width: 160,
                height: placeholderHeight,
                left: rightColX,
                top: currentRightTop,
                placeId: undefined,
              });
              currentRightTop += placeholderHeight + itemGap;
            }
          }
        }

        // 다음 실제 카드와의 gap이 정확히 itemGap이 되도록 조정
        currentRightTop = itemTop - itemGap;
      }

      // 실제 카드 다음 위치로 이동
      currentRightTop = itemTop + (item.height || 0) + itemGap;
    }

    return {
      items: convertedItems,
      endTop: { left: currentLeftTop, right: currentRightTop },
    };
  };

  // 컨테이너 너비 감지
  useEffect(() => {
    const updateContainerWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      } else {
        setContainerWidth(window.innerWidth);
      }
    };

    updateContainerWidth();
    window.addEventListener("resize", updateContainerWidth);
    return () => window.removeEventListener("resize", updateContainerWidth);
  }, []);

  // 최신 리뷰 가져오기 (초기 로드)
  useEffect(() => {
    const fetchRecentReviews = async () => {
      try {
        setLoading(true);
        setOffset(0);
        setHasMore(true);

        // 초기 로딩 시 더 적은 데이터만 먼저 로드 (빠른 초기 표시)
        const reviews = await getReviewsWithImages(
          undefined,
          undefined,
          INITIAL_LOAD_COUNT,
          0
        );
        // console.log("최신 리뷰 데이터:", reviews);

        if (reviews.length < INITIAL_LOAD_COUNT) {
          setHasMore(false);
        }

        const result = await convertReviewsToItems(
          reviews,
          {
            left: 20,
            right: 20,
          },
          containerWidth
        );

        // 컨테이너 높이 계산
        const maxTop = Math.max(
          ...result.items.map((item) => (item.top || 0) + (item.height || 0)),
          0
        );
        setContainerHeight(maxTop + 20);

        setFeedItems(result.items);
        setOffset(INITIAL_LOAD_COUNT);

        // 나머지 데이터를 백그라운드에서 로드
        if (reviews.length === INITIAL_LOAD_COUNT) {
          // 즉시 나머지 데이터 로드 (사용자는 이미 초기 데이터를 볼 수 있음)
          const remainingReviews = await getReviewsWithImages(
            undefined,
            undefined,
            ITEMS_PER_PAGE - INITIAL_LOAD_COUNT,
            INITIAL_LOAD_COUNT
          );

          if (remainingReviews.length > 0) {
            const remainingResult = await convertReviewsToItems(
              remainingReviews,
              result.endTop,
              containerWidth
            );

            // 기존 아이템에 추가
            setFeedItems((prev) => [...prev, ...remainingResult.items]);

            // 컨테이너 높이 업데이트
            const newMaxTop = Math.max(
              ...remainingResult.items.map(
                (item) => (item.top || 0) + (item.height || 0)
              ),
              maxTop
            );
            setContainerHeight(newMaxTop + 20);
            setOffset(ITEMS_PER_PAGE);
          } else {
            setHasMore(false);
          }
        }
      } catch (error) {
        console.error("최신 리뷰 가져오기 실패:", error);
        setFeedItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentReviews();
  }, [containerWidth]);

  // 추가 리뷰 로드 함수
  const loadMoreReviews = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const currentOffset = offset;
      const reviews = await getReviewsWithImages(
        undefined,
        undefined,
        ITEMS_PER_PAGE,
        currentOffset
      );

      if (reviews.length < ITEMS_PER_PAGE) {
        setHasMore(false);
      }

      if (reviews.length === 0) {
        setLoadingMore(false);
        return;
      }

      // 기존 아이템의 ID 목록 추출 (중복 체크용)
      const existingIds = new Set(
        feedItems
          .map((item) => {
            // review-{reviewId}-image 또는 review-{reviewId}-text 형식에서 reviewId 추출
            const match = item.id.match(/^review-(.+?)-(image|text)$/);
            return match ? match[1] : null;
          })
          .filter(Boolean)
      );

      // 중복되지 않은 리뷰만 필터링
      const uniqueReviews = reviews.filter(
        (review) => !existingIds.has(review.id)
      );

      if (uniqueReviews.length === 0) {
        setLoadingMore(false);
        setHasMore(false);
        return;
      }

      // 현재 마지막 카드의 위치 계산 (itemGap 포함)
      const itemGap = 16;
      const cardWidth = 160;
      const currentMaxTop = Math.max(
        ...feedItems.map(
          (item) => (item.top || 0) + (item.height || 0) + itemGap
        ),
        20
      );

      // 동적으로 계산된 leftColX와 rightColX 사용
      const currentSideMargin = Math.max(
        20,
        (containerWidth || window.innerWidth - cardWidth * 2 - itemGap) / 2
      );
      const currentLeftColX = currentSideMargin;
      const currentRightColX = currentSideMargin + cardWidth + itemGap;
      const currentFullWidth =
        (containerWidth || window.innerWidth) - currentSideMargin * 2;

      const leftColTop = feedItems
        .filter(
          (item) =>
            Math.abs((item.left || 0) - currentLeftColX) < 1 ||
            item.width === currentFullWidth
        )
        .reduce(
          (max, item) =>
            Math.max(max, (item.top || 0) + (item.height || 0) + itemGap),
          20
        );

      const rightColTop = feedItems
        .filter(
          (item) =>
            Math.abs((item.left || 0) - currentRightColX) < 1 ||
            item.width === currentFullWidth
        )
        .reduce(
          (max, item) =>
            Math.max(max, (item.top || 0) + (item.height || 0) + itemGap),
          20
        );

      // 비동기 처리
      convertReviewsToItems(
        uniqueReviews,
        {
          left: Math.max(leftColTop, currentMaxTop),
          right: Math.max(rightColTop, currentMaxTop),
        },
        containerWidth
      ).then((result) => {
        const newItems = [...feedItems, ...result.items];

        // 컨테이너 높이 업데이트
        const maxTop = Math.max(
          ...newItems.map((item) => (item.top || 0) + (item.height || 0)),
          0
        );
        setContainerHeight(maxTop + 20);

        setFeedItems(newItems);
        setOffset(currentOffset + uniqueReviews.length);
        setLoadingMore(false);
      });
    } catch (error) {
      console.error("추가 리뷰 가져오기 실패:", error);
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, offset, feedItems]);

  // 스크롤 이벤트 핸들러
  useEffect(() => {
    const handleScroll = () => {
      if (loadingMore || !hasMore) return;

      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // 스크롤이 하단 200px 이내에 도달하면 추가 로드
      if (scrollTop + windowHeight >= documentHeight - 200) {
        loadMoreReviews();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadMoreReviews, loadingMore, hasMore]);

  // slug 생성 함수
  const toSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // 카드 클릭 핸들러
  const handleCardClick = async (item: FeedItem) => {
    if (!item.placeId) return;

    try {
      // places 테이블에서 가게 정보 조회
      const { data: placeData, error: placeError } = await supabase
        .from("places")
        .select("id, name, google_place_id, latitude, longitude")
        .eq("id", item.placeId)
        .single();

      if (placeError || !placeData) {
        console.error("가게 정보 조회 실패:", placeError);
        return;
      }

      const placeName = placeData.name || "store";
      const slug = toSlug(placeName);

      // google_place_id가 있으면 사용, 없으면 UUID 사용
      const finalPlaceId = placeData.google_place_id || placeData.id;

      navigate(`/store/${slug}`, {
        state: {
          placeId: finalPlaceId,
          displayName: placeName,
          latitude: placeData.latitude || undefined,
          longitude: placeData.longitude || undefined,
          // distanceMeters는 StoreDetailPage에서 계산
          returnTab: activeTab || "recent", // 현재 탭 정보 전달
        },
      });
    } catch (error) {
      console.error("카드 클릭 처리 실패:", error);
    }
  };

  const FeedCard: React.FC<{ item: FeedItem }> = ({ item }) => {
    if (item.type === "image" && item.imageUrl) {
      const isFullWidth =
        typeof item.width === "string" ||
        item.width === undefined ||
        item.width > 300;
      return (
        <div
          className="rounded-[16px] overflow-hidden bg-gray-200 cursor-pointer"
          style={{
            width: isFullWidth ? item.width || 337 : item.width || 160,
            height: item.height || 160,
          }}
          onClick={() => handleCardClick(item)}
        >
          <img
            src={item.imageUrl}
            alt="Feed"
            className="w-full h-full object-cover rounded-[16px]"
            style={{ display: "block" }}
            onError={(e) => {
              console.error("이미지 로드 실패:", item.imageUrl);
              // 이미지 로드 실패 시 placeholder 표시
              const img = e.target as HTMLImageElement;
              img.style.display = "none";
              const parent = img.parentElement;
              if (parent && !parent.querySelector(".error-placeholder")) {
                const placeholder = document.createElement("div");
                placeholder.className =
                  "error-placeholder absolute inset-0 bg-gray-200 rounded-[16px] flex items-center justify-center text-gray-500 text-xs";
                placeholder.textContent = "이미지를 불러올 수 없습니다";
                parent.appendChild(placeholder);
              }
            }}
            onLoad={() => {
              // console.log("이미지 로드 성공:", item.imageUrl);
            }}
          />

          {/* User info overlay */}
          <div className="absolute top-2 left-2 right-2 bg-[rgba(245,245,245,0.9)] flex gap-2 items-center rounded-[24px]">
            <div className="bg-[#e5e5e5] rounded-[24px] shrink-0 w-6 h-6 flex items-center justify-center overflow-hidden">
              {item.userAvatar ? (
                <img
                  src={item.userAvatar}
                  alt={item.username}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-red-500 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">
                    {item.username.slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <p className="text-[12px] font-semibold leading-[16px] text-gray-800">
              {item.username}
            </p>
          </div>

          {/* Likes overlay */}
          {item.likes > 0 && (
            <div className="absolute bottom-2 right-2 bg-[rgba(245,245,245,0.9)] px-2 py-1.5 rounded-[24px]">
              <p className="text-[10px] font-normal leading-[12px] text-gray-500">
                {item.likes > 99 ? "+99" : item.likes} like
                {item.likes !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
      );
    }

    if (item.type === "text") {
      // Placeholder 카드인지 확인 (id에 placeholder가 포함되고 text가 비어있음)
      const isPlaceholder = item.id.includes("placeholder") && !item.text;

      if (isPlaceholder) {
        // Placeholder 카드: 배경색 #ff4500, 중앙에 icon-filled.svg (#fff)
        return (
          <div
            className="rounded-[16px] flex items-center justify-center"
            style={{
              width: item.width || 160,
              height: item.height || 160,
              backgroundColor: "#ff4500",
            }}
          >
            <svg
              width="31"
              height="31"
              viewBox="0 0 31 31"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19.774 8.04431H19.7799C21.063 8.11179 22.2715 8.67475 23.1715 9.6156C24.1303 10.6181 24.6617 11.9683 24.6617 13.3676V14.9447L24.6559 15.2045C24.6274 15.8102 24.4993 16.4078 24.276 16.9711C24.0207 17.6146 23.6452 18.2028 23.1696 18.6996C22.6938 19.1963 22.1268 19.5925 21.4996 19.8636C21.1792 20.0022 20.8462 20.1053 20.5065 20.1742V21.225C20.5063 21.7771 20.0588 22.225 19.5065 22.225C18.9542 22.2249 18.5066 21.777 18.5065 21.225V19.2748C18.5066 18.8055 18.8302 18.4127 19.2662 18.3051V18.2748H19.5172C19.9237 18.275 20.3283 18.1913 20.7067 18.0277C21.0848 17.8641 21.4312 17.6228 21.7252 17.3158C22.0193 17.0086 22.2551 16.6416 22.4166 16.2347C22.5782 15.8274 22.6617 15.3882 22.6617 14.9447V13.3676C22.6617 12.4709 22.3205 11.6189 21.7262 10.9974C21.1334 10.3779 20.3388 10.038 19.5201 10.0375C18.701 10.0378 17.9056 10.3776 17.3121 10.9974C16.7173 11.6188 16.3753 12.4706 16.3746 13.3676V14.9701C16.3746 16.3648 15.8414 17.7108 14.8815 18.7084C14.1566 19.4613 13.2321 19.9688 12.2311 20.1732V21.225C12.2309 21.7771 11.7834 22.225 11.2311 22.225C10.6789 22.2249 10.2312 21.777 10.2311 21.225V20.1722C9.89622 20.1041 9.56796 20.0026 9.25159 19.8666C8.62487 19.5972 8.0576 19.2035 7.58167 18.7094C7.10566 18.215 6.7298 17.6295 6.47424 16.9886C6.25061 16.4278 6.122 15.8324 6.09338 15.2289L6.08752 14.9701V11.475C6.08752 10.9227 6.53524 10.475 7.08752 10.475C7.63981 10.475 8.08752 10.9227 8.08752 11.475V14.9701C8.08752 15.4092 8.17153 15.8434 8.33264 16.2474C8.49362 16.6511 8.72835 17.0155 9.02209 17.3207C9.31606 17.626 9.66305 17.8669 10.0416 18.0297C10.3729 18.172 10.7241 18.253 11.0797 18.2709L11.2321 18.2748C12.0531 18.2748 12.8496 17.9363 13.442 17.3207C14.0354 16.7038 14.3746 15.8586 14.3746 14.9701V13.3676L14.3815 13.1058C14.4441 11.8002 14.968 10.5535 15.8678 9.61365C16.829 8.61003 18.1426 8.03758 19.5211 8.03748H19.5289L19.774 8.04431ZM9.81311 10.6332C10.3651 10.6334 10.813 11.0812 10.8131 11.6332V13.5834C10.813 14.1353 10.3652 14.5831 9.81311 14.5834C9.26083 14.5834 8.81325 14.1355 8.81311 13.5834V11.6332C8.81324 11.081 9.26091 10.6332 9.81311 10.6332ZM12.7379 10.6332C13.29 10.6333 13.7378 11.0811 13.7379 11.6332V13.5834C13.7378 14.1354 13.2901 14.5832 12.7379 14.5834C12.1856 14.5834 11.7381 14.1355 11.7379 13.5834V11.6332C11.738 11.081 12.1857 10.6332 12.7379 10.6332Z"
                fill="#fff"
              />
            </svg>
          </div>
        );
      }

      // 실제 텍스트 카드
      if (item.text) {
        return (
          <div
            className="relative bg-gray-200 rounded-[16px] p-2 flex flex-col gap-2 cursor-pointer"
            style={{
              width: item.width || 160,
              height: item.height || 160,
            }}
            onClick={() => handleCardClick(item)}
          >
            {/* User info */}
            <div className="flex gap-2 items-center shrink-0">
              <div className="bg-[#e5e5e5] rounded-[24px] shrink-0 w-6 h-6 flex items-center justify-center overflow-hidden">
                {item.userAvatar ? (
                  <img
                    src={item.userAvatar}
                    alt={item.username}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">
                      {item.username?.slice(2, 4) || "??"}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-[12px] font-semibold leading-[16px] text-gray-800">
                {item.username || ""}
              </p>
            </div>

            {/* Text content - flex-1로 남은 공간 차지, overflow 처리 */}
            <div className="flex-1 flex flex-col justify-center min-h-0 overflow-hidden">
              <p className="text-[12px] font-normal leading-[14px] text-gray-700 whitespace-pre-wrap overflow-hidden text-ellipsis line-clamp-3">
                {item.text}
              </p>
            </div>

            {/* Likes overlay */}
            {item.likes > 0 && (
              <div className="absolute bottom-2 right-2 px-2 py-1.5 rounded-[24px]">
                <p className="text-[10px] font-normal leading-[12px] text-gray-500">
                  {item.likes > 99 ? "+99" : item.likes} like
                  {item.likes !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>
        );
      }
    }

    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[18px] font-semibold text-gray-700">Loading...</p>
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
    <div
      ref={containerRef}
      className="relative"
      style={{
        minHeight: containerHeight || "100vh",
      }}
    >
      <div>
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

export default RecentFeed;
