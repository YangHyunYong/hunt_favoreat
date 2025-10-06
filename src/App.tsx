import { sdk } from "@farcaster/frame-sdk";
import { useEffect } from "react";
import { useSignMessage } from "wagmi"; // 서명은 wagmi 훅 사용(앱킷 어댑터가 provider 제공)
import { useAppKitAccount, useDisconnect } from "@reown/appkit/react";
import { modal } from "./wagmi";

function App() {
  useEffect(() => {
    sdk.actions.ready();
  }, []);
  return <ConnectMenu />;
}

function ConnectMenu() {
  const { isConnected, address } = useAppKitAccount();

  if (isConnected) {
    return (
      <>
        <div>Connected account:</div>
        <div>{address}</div>
        <SignButton />
        <SignOutButton />
      </>
    );
  }

  // 버튼 클릭 시 AppKit 모달로 지갑 연결
  return (
    <button type="button" onClick={() => modal.open()}>
      Connect
    </button>
  );
}

function SignButton() {
  const { signMessage, isPending, data, error } = useSignMessage();
  return (
    <>
      <button
        type="button"
        onClick={() => signMessage({ message: "hello world" })}
        disabled={isPending}
      >
        {isPending ? "Signing..." : "Sign message"}
      </button>
      {data && (
        <>
          <div>Signature</div>
          <div>{data}</div>
        </>
      )}
      {error && (
        <>
          <div>Error</div>
          <div>{error.message}</div>
        </>
      )}
    </>
  );
}

function SignOutButton() {
  const { disconnect } = useDisconnect();

  const hardLogout = () => {
    // 1) AppKit disconnect 시도 (Farcaster는 revokePermissions 미지원 → 실패해도 무시)
    try {
      disconnect();
    } catch (e) {
      // UnsupportedMethodError 등은 무시
      console.warn("AppKit disconnect failed (ignored):", e);
    }

    // 2) 자동 재연결을 막기 위해 캐시/세션 키 제거
    try {
      const patterns = [
        // wagmi
        /^wagmi(\.store|\.cachedConnector)?$/i,
        // WalletConnect v1/v2
        /^walletconnect/i,
        /^WALLETCONNECT/i,
        /^wc@/i,
        // Web3Modal / AppKit
        /^w3m/i,
        /^web3modal/i,
        /^appkit/i,
        /^@reown/i,
        // 일부 지갑 SDK 캐시
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

    // 3) 완전 초기화를 위해 새로고침 (AppKit 내부 상태까지 리셋)
    window.location.reload();
  };

  return (
    <button type="button" onClick={hardLogout}>
      Sign Out
    </button>
  );
}

export default App;
