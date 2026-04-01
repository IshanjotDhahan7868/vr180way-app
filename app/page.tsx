import { Converter } from "@/components/converter";

export default function Home() {
  return (
    <div className="relative z-[1] mx-auto min-h-screen max-w-[740px] px-4 pb-20">
      {/* Header */}
      <header className="mb-6 flex items-baseline gap-3 border-b border-bord py-7">
        <span className="rounded-sm bg-cyan px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-[2px] text-bg">
          VR
        </span>
        <div className="flex items-baseline gap-1.5">
          <span className="font-body text-[26px] font-extrabold tracking-tighter text-cyan">
            180
          </span>
          <span className="font-mono text-[12px] tracking-[4px] text-mut">
            CONVERTER
          </span>
        </div>
        <span className="ml-auto font-mono text-[10px] tracking-[1px] text-mut max-sm:hidden">
          For Google Cardboard
        </span>
      </header>

      <Converter />
    </div>
  );
}
