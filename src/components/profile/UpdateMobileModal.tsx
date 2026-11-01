"use client";

import { useState } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { useToast } from "@/components/ui/toast";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Phone, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { formatToE164, validatePhoneNumber } from "@/lib/validations";

const COUNTRY_CODES = [
  { code: "+91", label: "🇮🇳 +91 (India)" },
  { code: "+1", label: "🇺🇸 +1 (US / Canada)" },
  { code: "+44", label: "🇬🇧 +44 (UK)" },
  { code: "+65", label: "🇸🇬 +65 (Singapore)" },
  { code: "+971", label: "🇦🇪 +971 (UAE)" },
  { code: "+61", label: "🇦🇺 +61 (Australia)" },
  { code: "+49", label: "🇩🇪 +49 (Germany)" },
  { code: "+33", label: "🇫🇷 +33 (France)" },
  { code: "+60", label: "🇲🇾 +60 (Malaysia)" },
  { code: "+966", label: "🇸🇦 +966 (Saudi Arabia)" },
  { code: "+974", label: "🇶🇦 +974 (Qatar)" },
  { code: "+353", label: "🇮🇪 +353 (Ireland)" },
  { code: "+64", label: "🇳🇿 +64 (New Zealand)" },
];

interface UpdateMobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialPhone?: string | null;
  initialCountryCode?: string | null;
}

export function UpdateMobileModal({
  isOpen,
  onClose,
  onSuccess,
  initialPhone = "",
  initialCountryCode = "+91",
}: UpdateMobileModalProps) {
  const { user, updateUserPhoneNumber } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [countryCode, setCountryCode] = useState(initialCountryCode || "+91");
  const [phoneNumber, setPhoneNumber] = useState(
    initialPhone ? initialPhone.replace(/^\+\d{1,4}/, "") : ""
  );
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const cleanNum = phoneNumber.trim().replace(/\D/g, "");
    if (!cleanNum) {
      setValidationError("Mobile number is required");
      return;
    }

    const e164 = formatToE164(countryCode, cleanNum);
    if (!validatePhoneNumber(e164)) {
      setValidationError(
        countryCode === "+91"
          ? "Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)"
          : "Please enter a valid international mobile number in E.164 format"
      );
      return;
    }

    setLoading(true);
    try {
      if (!user) throw new Error("Not authenticated");

      // Update in Firestore through AuthContext helper
      await updateUserPhoneNumber(e164, countryCode);

      // Also call server API endpoint to sync server-side
      const token = await user.getIdToken();
      await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          countryCode,
          phoneNumber: cleanNum,
        }),
      });

      toastSuccess(
        "Profile Updated!",
        "Your mobile number has been saved successfully."
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error updating phone:", err);
      toastError(
        "Update Failed",
        err.message || "Failed to update mobile number. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Complete Your Profile">
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-teal-500/10 border border-teal-500/20 text-xs text-teal-700 dark:text-teal-300">
          <ShieldCheck className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
          <span>
            We use your mobile number strictly for crucial cohort schedules, live class reminders, and Google Drive access notifications.
          </span>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="modalPhoneNumber" required>
            Mobile Number
          </Label>
          <div className="flex gap-2">
            <select
              className="w-36 h-10 px-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
            <div className="flex-1">
              <Input
                id="modalPhoneNumber"
                type="tel"
                placeholder="9876543210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          {validationError && (
            <p className="text-xs text-red-500 font-medium">{validationError}</p>
          )}
          <p className="text-[11px] text-slate-500">
            Selected: <span className="font-mono font-semibold">{countryCode}</span>.
            Stored securely in standard E.164 format.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="text-xs text-slate-600 dark:text-slate-400"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Save Mobile Number
              </span>
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

