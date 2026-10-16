import { TRACK_STEPS } from "@/lib/orderMachine";

export default function Tracker({ step }: { step: number }) {
  return (
    <div>
      <ol className="track" aria-label="Delivery progress">
        {TRACK_STEPS.map((label, i) => {
          const n = i + 1;
          return <li key={n} className={step > n ? "done" : step === n ? "now" : ""} aria-current={step === n ? "step" : undefined}>{label}</li>;
        })}
      </ol>
      {step === 0 && <small>Your agent hasn't set off yet.</small>}
    </div>
  );
}
