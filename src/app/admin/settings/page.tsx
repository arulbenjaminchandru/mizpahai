"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { useToast } from "@/components/ui/toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { validatePhoneNumber } from "@/lib/validations";
import {
  Settings,
  Phone,
  MessageCircle,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Building,
} from "lucide-react";

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [whatsappNumber, setWhatsappNumber] = useState("+919894481283");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      if (!user) return;
      try {
        const token = await user.getIdToken(true);
        const res = await fetch("/api/settings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.whatsappNumber) {
            setWhatsappNumber(data.whatsappNumber);
          }
        }
      } catch (err) {
        console.error("Error loading settings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [user]);

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmed = whatsappNumber.trim();
    if (!validatePhoneNumber(trimmed)) {
      toastError(
        "Invalid Phone Number",
        "Please provide a valid phone number in E.164 format (e.g. +919894481283)."
      );
      return;
    }

    setIsSaving(true);
    try {
      const token = await user.getIdToken(true);
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          whatsappNumber: trimmed,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update settings");
      }

      toastSuccess(
        "Settings Saved",
        "WhatsApp Business Number configuration updated successfully."
      );
    } catch (err: any) {
      toastError("Save Failed", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Academy Configuration &amp; Settings
          </h1>
          <Badge variant="outline" className="text-teal-600 dark:text-teal-400 border-teal-500/30 text-xs">
            Global Settings
          </Badge>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Configure admissions communications, official WhatsApp contact routing, and platform policies.
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Contact & Social Configuration Card */}
        <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90 shadow-md">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base text-slate-900 dark:text-white">
                  Contact &amp; Social Configuration
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Official WhatsApp Business line used for student purchase enquiry pre-filled messages
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSaveContact} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="whatsapp" className="text-xs">
                  WhatsApp Business Number
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="whatsapp"
                      type="text"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="+919894481283"
                      className="pl-9 h-10 text-xs font-mono"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSaving || loading}
                    className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs gap-1.5 shrink-0"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        Save Number
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Standard international format with country code (e.g. <span className="font-mono text-teal-500">+919894481283</span>).
                  All student WhatsApp enquiries will open a chat with this recipient.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-teal-500/20 bg-teal-500/5 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-teal-700 dark:text-teal-300">
                  <ShieldCheck className="h-4 w-4 text-teal-500" />
                  <span>Verified Communications Standard</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Default: <strong>+91-9894481283</strong> (Founder &amp; Mentor Arul Benjamin).
                  Students who click &quot;Get This Course&quot; will be routed to WhatsApp Web / Mobile with their pre-filled course enquiry.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

