import { getPaddleEnvironment } from "@/lib/paddle";

export function PaymentTestModeBanner() {
  try {
    if (getPaddleEnvironment() !== "sandbox") return null;
  } catch {
    return null;
  }

  return (
    <div className="w-full bg-orange-100 border-b border-orange-300 px-4 py-2 text-center text-xs text-orange-800">
      Test mode — payments don't charge real money.
    </div>
  );
}
