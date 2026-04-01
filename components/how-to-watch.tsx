export function HowToWatch() {
  return (
    <div className="rounded-lg border border-bord bg-surf p-4">
      <div className="mb-2.5 font-mono text-[10px] tracking-[3px] text-cyan opacity-70">
        HOW TO WATCH
      </div>
      <ol className="flex list-decimal flex-col gap-1.5 pl-5">
        <li className="text-[13px] leading-relaxed">
          Convert &amp; download the .mp4 to your phone
        </li>
        <li className="text-[13px] leading-relaxed">
          Open a SBS video player app
        </li>
        <li className="text-[13px] leading-relaxed">
          Select <strong className="text-cyan">SBS Half</strong> or{" "}
          <strong className="text-cyan">VR180</strong> mode
        </li>
        <li className="text-[13px] leading-relaxed">
          Insert phone into Cardboard &middot; enjoy
        </li>
      </ol>
      <div className="mt-3 font-mono text-[11px] text-mut">
        Recommended:{" "}
        <span className="text-txt">VaR&apos;s VR Video Player</span> &middot;{" "}
        <span className="text-txt">KinoVR</span> &middot;{" "}
        <span className="text-txt">Cardboard Camera</span>
      </div>
    </div>
  );
}
