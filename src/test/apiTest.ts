import { supabase, ensureUserWithWallet, createReview, uploadReviewPhoto, addBookmark } from "../supabaseClient";

// API 테스트 함수들
export class ApiTester {

  // 유저 등록 테스트
  async testEnsureUser(address: string) {
    if (!address) return;
    try {
      await ensureUserWithWallet(address);
      console.log("유저 등록 성공!");
    } catch (error) {
      console.error("유저 등록 실패: " + error);
    }
  }

  // 리뷰 생성 테스트 (이미지 포함)
  async testCreateReview(address: string) {
    if (!address) return;
    try {
      // 먼저 테스트용 장소를 생성
      const { data: place, error: placeError } = await supabase
        .from("places")
        .insert({
          name: "테스트 카페",
          address_text: "서울시 강남구",
          latitude: 37.5665,
          longitude: 126.978,
        })
        .select("id")
        .single();

      if (placeError) throw placeError;

      // 테스트용 이미지 생성
      const createTestImage = (name: string) => {
        const canvas = document.createElement("canvas");
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ff0000";
          ctx.fillRect(0, 0, 100, 100);
          ctx.fillStyle = "#ffffff";
          ctx.font = "12px Arial";
          ctx.fillText(name, 10, 50);
        }
        return new Promise<File>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], `${name}.png`, {
                type: "image/png",
              });
              resolve(file);
            }
          });
        });
      };

      const image1 = await createTestImage("review-image-1");
      const image2 = await createTestImage("review-image-2");

      const review = await createReview({
        placeId: place.id,
        authorWallet: address,
        rating: 4.5,
        body: "테스트 리뷰입니다!",
      });

      // 이미지 업로드
      await uploadReviewPhoto({ walletAddress: address, reviewId: review.id, file: image1 });
      await uploadReviewPhoto({ walletAddress: address, reviewId: review.id, file: image2 });
      console.log("리뷰 생성 성공: " + review.id);
    } catch (error) {
      console.error("리뷰 생성 실패: " + error);
    }
  }

  // 북마크 테스트
  async testBookmark(address: string) {
    if (!address) return;
    try {
      // 먼저 테스트용 장소를 생성
      const { data: place, error: placeError } = await supabase
        .from("places")
        .insert({
          name: "테스트 식당",
          address_text: "서울시 홍대",
          latitude: 37.5563,
          longitude: 126.9226,
        })
        .select("id")
        .single();

      if (placeError) throw placeError;

      await addBookmark(place.id, address);
      console.log("북마크 추가 성공!");
    } catch (error) {
      console.error("북마크 실패: " + error);
    }
  }
}

// 이미지 로드 테스트
export async function testLoadImages() {
  try {
    const { getReviewsWithImages } = await import("../supabaseClient");
    const reviews = await getReviewsWithImages();
    console.log("리뷰와 이미지 데이터:", reviews);

    // 첫 번째 리뷰의 이미지 URL들 출력
    if (reviews.length > 0 && reviews[0].photos.length > 0) {
      const imageUrls = reviews[0].photos.map((photo: { url: string }) => photo.url);
      console.log(`첫 번째 리뷰 이미지 URL들:\n${imageUrls.join("\n")}`);
    } else {
      console.log("이미지가 있는 리뷰가 없습니다.");
    }
  } catch (error) {
    console.error("이미지 로드 실패: " + error);
  }
}
