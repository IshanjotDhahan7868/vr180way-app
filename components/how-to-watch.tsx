export function HowToWatch() {
  return (
    <div className="rounded-2xl border border-bord bg-surf p-5">
      <h3 className="mb-3 text-sm font-medium text-txt">How to watch</h3>
      <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm text-txt2">
        <li>Convert and download the video to your phone</li>
        <li>Open it in a VR player app (or tap &quot;Watch in VR&quot; above)</li>
        <li>Select <strong className="text-txt">SBS</strong> or <strong className="text-txt">VR180</strong> mode</li>
        <li>Put your phone in a Google Cardboard headset</li>
      </ol>
      <p className="mt-3 text-xs text-txt3">
        Recommended apps: VaR&apos;s VR Video Player, KinoVR, Cardboard Camera
      </p>
    </div>
  );
}
