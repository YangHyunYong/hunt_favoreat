import React from "react";
import { ApiTester, testLoadImages } from "./apiTest";

interface TestPanelProps {
  address?: string;
}

const TestPanel: React.FC<TestPanelProps> = ({ address }) => {
  const apiTester = new ApiTester();

  if (!address) return null;

  return (
    <div className="absolute top-32 left-4 right-4 z-10 bg-white p-3 rounded-lg shadow-lg">
      <div className="text-xs font-bold mb-2">API 테스트</div>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => apiTester.testEnsureUser(address)}
          className="px-2 py-1 bg-blue-500 text-white text-xs rounded"
        >
          유저등록
        </button>
        <button
          onClick={() => apiTester.testCreateReview(address)}
          className="px-2 py-1 bg-green-500 text-white text-xs rounded"
        >
          리뷰생성
        </button>
        <button
          onClick={() => apiTester.testBookmark(address)}
          className="px-2 py-1 bg-orange-500 text-white text-xs rounded"
        >
          북마크
        </button>
        <button
          onClick={testLoadImages}
          className="px-2 py-1 bg-purple-500 text-white text-xs rounded"
        >
          이미지로드
        </button>
      </div>
    </div>
  );
};

export default TestPanel;
