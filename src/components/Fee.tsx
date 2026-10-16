// New charge on top, the old one struck through underneath when an agent has offered a discount.
export default function Fee({ fee, original }: { fee: number | string; original: number | string }) {
  const f = Number(fee), o = Number(original);
  const offer = f < o;
  return (
    <span className="fee">
      {offer && <span className="tag">Offer</span>}
      <b className="amt">{f === 0 ? "Free" : `₹${f}`}</b>
      {offer && <s aria-label={`was ₹${o}`}>₹{o}</s>}
    </span>
  );
}
