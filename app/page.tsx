import { Converter } from "@/components/converter";

export default function Home() {
  return (
    <div className="relative mx-auto min-h-screen max-w-2xl px-5 pb-24">
      <header className="mb-8 flex items-center gap-3 border-b border-bord pt-8 pb-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
            VR
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight text-txt">
              VR Converter
            </h1>
            <p className="text-xs text-txt3">
              Turn any video into a VR experience
            </p>
          </div>
        </div>
      </header>

      <Converter />
    </div>
  );
}
