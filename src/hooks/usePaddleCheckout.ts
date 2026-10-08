import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { initializePaddle } from "@/lib/paddle";
import { createCheckoutTransaction } from "@/lib/billing.functions";
import type { PriceId } from "@/utils/payments.functions";

export type CheckoutOptions = {
  priceId: PriceId;
  analysisId?: string;
  successUrl?: string;
};

export function usePaddleCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createTransaction = useServerFn(createCheckoutTransaction);
  const disabledReason = null;

  const openCheckout = async (options: CheckoutOptions) => {
    setLoading(true);
    setError(null);
    try {
      await initializePaddle();
      const { transactionId } = await createTransaction({
        data: { priceId: options.priceId, analysisId: options.analysisId },
      });

      window.Paddle.Checkout.open({
        transactionId,
        settings: {
          displayMode: "overlay",
          successUrl: options.successUrl || `${window.location.origin}/checkout/success`,
          allowLogout: false,
          variant: "one-page",
        },
      });
      return true;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Checkout failed to open";
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { openCheckout, loading, error, disabledReason };
}
