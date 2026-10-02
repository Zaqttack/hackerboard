import { QRCodeSVG } from "qrcode.react";
import { Pushpin } from "./Pushpin.tsx";

type QRCardProps = {
  url: string;
};

export function QRCard({ url }: QRCardProps) {
  return (
    <div data-wall className="absolute top-[52px] right-16 z-30 w-[340px] rotate-2 drop-shadow-[0_12px_18px_rgba(40,20,0,0.4)]">
      <div className="bg-paper flex flex-col items-center gap-3.5 px-10 pt-9 pb-7">
        <div className="box-border flex h-[260px] w-[260px] bg-white p-5">
          <QRCodeSVG value={url} size={220} level="M" bgColor="#ffffff" fgColor="#1a1a1a" />
        </div>
        <div className="font-hand text-[34px] leading-none font-bold">Scan to join</div>
      </div>
      <Pushpin size={28} className="-top-2.5 left-[156px]" />
    </div>
  );
}
