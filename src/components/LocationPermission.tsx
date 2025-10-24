import React from "react";

interface LocationPermissionProps {
  onAllow: () => void;
  onDeny: () => void;
}

const LocationPermission: React.FC<LocationPermissionProps> = ({
  onAllow,
  onDeny,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm text-center">
        <h2 className="text-xl font-bold mb-4">위치 정보 사용 요청</h2>
        <p className="text-sm text-gray-700 mb-6">
          이 앱은 사용자의 현재 위치를 기반으로 주변 매장을 보여드릴 수 있어요.
          위치 정보를 허용하시겠어요?
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onDeny}
            className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100"
          >
            거부
          </button>
          <button
            onClick={onAllow}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            허용
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPermission;
