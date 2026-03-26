import "@/styles/globals.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import type { AppProps } from "next/app";
import dynamic from "next/dynamic";

const WalletProvider = dynamic(
  () => import("@/lib/wallet").then((m) => m.WalletProvider),
  { ssr: false }
);

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WalletProvider>
      <Component {...pageProps} />
    </WalletProvider>
  );
}
