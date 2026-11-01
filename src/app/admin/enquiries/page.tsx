"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { useToast } from "@/components/ui/toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatIndianCurrency } from "@/lib/validations";
import {
  ShoppingBag,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  User,
  DollarSign,
  Tag,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  XCircle,
  ExternalLink,
  MessageCircle,
  Loader2,
  Check,
  RefreshCw,
} from "lucide-react";
import type { CourseEnquiry, CourseEnquiryStatus, Course } from "@/types";

export default function AdminEnquiriesPage() {
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [enquiries, setEnquiries] = useState<CourseEnquiry[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    new: 0,
    contacted: 0,
    awaiting_payment: 0,
    payment_under_verification: 0,
    payment_confirmed: 0,
    access_granted: 0,
    rejected: 0,
  });

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [courseFilter, setCourseFilter] = useState<string>("all");

  // Status update modal
  const [selectedEnquiry, setSelectedEnquiry] = useState<CourseEnquiry | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<CourseEnquiryStatus>("new");
  const [adminNotes, setAdminNotes] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Payment confirmation modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);

  // Grant access modal
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [isGrantingAccess, setIsGrantingAccess] = useState(false);

  const fetchEnquiries = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken(true);
      const queryParams = new URLSearchParams();
      if (statusFilter !== "all") queryParams.set("status", statusFilter);
      if (courseFilter !== "all") queryParams.set("courseId", courseFilter);
      if (searchQuery.trim()) queryParams.set("search", searchQuery.trim());

      const [enrRes, coursesRes] = await Promise.all([
        fetch(`/api/admin/enquiries?${queryParams.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/admin/courses", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (enrRes.ok) {
        const data = await enrRes.json();
        setEnquiries(data.enquiries || []);
        if (data.metrics) setMetrics(data.metrics);
      }

      if (coursesRes.ok) {
        const cData = await coursesRes.json();
        setCourses(cData.courses || []);
      }
    } catch (err: any) {
      console.error("Error fetching enquiries:", err);
      toastError("Load Error", err.message || "Failed to load enquiries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, [user, statusFilter, courseFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEnquiries();
  };

  const openStatusModal = (enquiry: CourseEnquiry) => {
    setSelectedEnquiry(enquiry);
    setNewStatus(enquiry.status);
    setAdminNotes(enquiry.adminNotes || "");
    setIsStatusModalOpen(true);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedEnquiry) return;
    setIsUpdatingStatus(true);
    try {
      const token = await user.getIdToken(true);
      const res = await fetch(`/api/admin/enquiries/${selectedEnquiry.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          adminNotes,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update status");
      }

      toastSuccess("Status Updated", `Enquiry marked as "${newStatus.replace("_", " ")}".`);
      setIsStatusModalOpen(false);
      fetchEnquiries();
    } catch (err: any) {
      toastError("Update Failed", err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const openPaymentModal = (enquiry: CourseEnquiry) => {
    setSelectedEnquiry(enquiry);
    setPaymentNotes("");
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedEnquiry) return;
    setIsConfirmingPayment(true);
    try {
      const token = await user.getIdToken(true);
      const res = await fetch(`/api/admin/enquiries/${selectedEnquiry.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentConfirmed: true,
          paymentNotes: paymentNotes.trim() || "Manual payment verification by administrator",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to confirm payment");
      }

      toastSuccess(
        "Payment Confirmed",
        `Payment verified for ${selectedEnquiry.studentName}. You may now grant course access.`
      );
      setIsPaymentModalOpen(false);
      fetchEnquiries();
    } catch (err: any) {
      toastError("Confirmation Failed", err.message);
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  const openGrantModal = (enquiry: CourseEnquiry) => {
    setSelectedEnquiry(enquiry);
    setIsGrantModalOpen(true);
  };

  const handleGrantAccess = async () => {
    if (!user || !selectedEnquiry) return;
    setIsGrantingAccess(true);
    try {
      const token = await user.getIdToken(true);
      const res = await fetch(
        `/api/admin/enquiries/${selectedEnquiry.id}/grant-access`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to grant course access");
      }

      const data = await res.json();
      toastSuccess("Course Access Granted", data.message);
      setIsGrantModalOpen(false);
      fetchEnquiries();
    } catch (err: any) {
      toastError("Grant Access Failed", err.message);
    } finally {
      setIsGrantingAccess(false);
    }
  };

  const getStatusBadge = (status: CourseEnquiryStatus) => {
    switch (status) {
      case "new":
        return (
          <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 font-semibold text-[10px]">
            New
          </Badge>
        );
      case "contacted":
        return (
          <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 font-semibold text-[10px]">
            Contacted
          </Badge>
        );
      case "awaiting_payment":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-semibold text-[10px]">
            Awaiting Payment
          </Badge>
        );
      case "payment_under_verification":
        return (
          <Badge className="bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 font-semibold text-[10px]">
            Payment Under Verification
          </Badge>
        );
      case "payment_confirmed":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold text-[10px]">
            Payment Confirmed
          </Badge>
        );
      case "access_granted":
        return (
          <Badge className="bg-teal-500/20 text-teal-600 dark:text-teal-300 border border-teal-500/40 font-bold text-[10px]">
            ✓ Access Granted
          </Badge>
        );
      case "rejected":
      case "cancelled":
        return (
          <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-semibold text-[10px]">
            Rejected / Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Recent";
    try {
      if (typeof timestamp.toDate === "function") {
        return timestamp.toDate().toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      if (timestamp._seconds) {
        return new Date(timestamp._seconds * 1000).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    } catch {
      return "Recorded";
    }
    return "Recent";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Course Purchase Enquiries
            </h1>
            <Badge variant="outline" className="text-teal-600 dark:text-teal-400 border-teal-500/30 text-xs">
              Admissions CRM
            </Badge>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Track student WhatsApp purchase enquiries, confirm manual payments, and grant course access.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => fetchEnquiries()}
          className="border-slate-300 dark:border-slate-700 text-xs gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 p-3 text-center">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Total</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{metrics.total}</p>
        </Card>

        <Card className="border-blue-500/20 bg-blue-500/5 dark:bg-blue-950/20 p-3 text-center">
          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">New</span>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">{metrics.new}</p>
        </Card>

        <Card className="border-purple-500/20 bg-purple-500/5 dark:bg-purple-950/20 p-3 text-center">
          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">Contacted</span>
          <p className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">{metrics.contacted}</p>
        </Card>

        <Card className="border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/20 p-3 text-center">
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Awaiting</span>
          <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">{metrics.awaiting_payment}</p>
        </Card>

        <Card className="border-cyan-500/20 bg-cyan-500/5 dark:bg-cyan-950/20 p-3 text-center">
          <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-medium">Verifying</span>
          <p className="text-xl font-bold text-cyan-600 dark:text-cyan-400 mt-1">{metrics.payment_under_verification}</p>
        </Card>

        <Card className="border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20 p-3 text-center">
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Confirmed</span>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{metrics.payment_confirmed}</p>
        </Card>

        <Card className="border-teal-500/30 bg-teal-500/10 dark:bg-teal-950/30 p-3 text-center">
          <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">Granted</span>
          <p className="text-xl font-bold text-teal-600 dark:text-teal-300 mt-1">{metrics.access_granted}</p>
        </Card>

        <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 p-3 text-center">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Rejected</span>
          <p className="text-xl font-bold text-slate-700 dark:text-slate-300 mt-1">{metrics.rejected}</p>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90 shadow-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search by student name, email, phone, or course..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 text-xs"
                />
              </div>
              <Button type="submit" size="sm" className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs">
                Search
              </Button>
            </form>

            <div className="flex items-center gap-2">
              {/* Course filter */}
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="h-10 px-3 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="all">All Courses</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 px-3 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="awaiting_payment">Awaiting Payment</option>
                <option value="payment_under_verification">Payment Under Verification</option>
                <option value="payment_confirmed">Payment Confirmed</option>
                <option value="access_granted">Access Granted</option>
                <option value="rejected">Rejected / Cancelled</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enquiries List */}
      <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90 shadow-md">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base text-slate-900 dark:text-white">
                Purchase Enquiries ({enquiries.length})
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Official course leads generated from student portal discovery cards
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <div className="space-y-3">
              <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            </div>
          ) : enquiries.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
              <ShoppingBag className="h-8 w-8 text-slate-400 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No Purchase Enquiries Found
              </p>
              <p className="text-xs text-slate-500">
                When students explore courses and click &quot;Get This Course&quot;, their purchase enquiries will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {enquiries.map((enr) => (
                <div
                  key={enr.id}
                  className="py-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 text-xs"
                >
                  {/* Left Column: Student & Course */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {enr.studentName}
                      </span>
                      {getStatusBadge(enr.status)}
                      <span className="text-[11px] text-slate-400">
                        • {formatDate(enr.createdAt)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-teal-500" />
                        {enr.studentEmail}
                      </span>
                      {enr.studentPhoneNumber && (
                        <span className="flex items-center gap-1 font-mono font-medium text-slate-800 dark:text-slate-200">
                          <Phone className="h-3 w-3 text-emerald-500" />
                          {enr.studentPhoneNumber}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Badge variant="outline" className="text-xs font-semibold text-teal-600 dark:text-teal-400 border-teal-500/30">
                        {enr.courseNameSnapshot}
                      </Badge>

                      <div className="flex items-center gap-1.5 text-xs">
                        {enr.actualPriceSnapshot > enr.currentPriceSnapshot && (
                          <span className="line-through text-slate-400 text-[11px]">
                            {formatIndianCurrency(enr.actualPriceSnapshot)}
                          </span>
                        )}
                        <span className="font-bold text-teal-600 dark:text-teal-400">
                          {formatIndianCurrency(enr.currentPriceSnapshot)}
                        </span>
                        {enr.discountSnapshot > 0 && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            {enr.discountSnapshot}% OFF
                          </span>
                        )}
                      </div>
                    </div>

                    {enr.adminNotes && (
                      <p className="text-[11px] text-slate-500 italic bg-slate-50 dark:bg-slate-800/40 p-1.5 rounded border border-slate-200 dark:border-slate-800 max-w-xl">
                        Notes: {enr.adminNotes}
                      </p>
                    )}

                    {enr.paymentConfirmedAt && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        ✓ Payment Confirmed: {formatDate(enr.paymentConfirmedAt)}
                      </p>
                    )}

                    {enr.accessGrantedAt && (
                      <p className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                        ✓ Access Activated: {formatDate(enr.accessGrantedAt)}
                      </p>
                    )}
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* Direct WhatsApp Chat with student if number present */}
                    {enr.studentPhoneNumber && (
                      <a
                        href={`https://wa.me/${enr.studentPhoneNumber.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 gap-1"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          <span>WhatsApp</span>
                        </Button>
                      </a>
                    )}

                    {/* Change Status */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openStatusModal(enr)}
                      className="h-8 text-xs border-slate-300 dark:border-slate-700"
                    >
                      Update Status
                    </Button>

                    {/* Manual Payment Confirmation */}
                    {enr.status !== "payment_confirmed" && enr.status !== "access_granted" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openPaymentModal(enr)}
                        className="h-8 text-xs border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 gap-1"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        Confirm Payment
                      </Button>
                    )}

                    {/* Grant Course Access */}
                    {enr.status !== "access_granted" ? (
                      <Button
                        size="sm"
                        onClick={() => openGrantModal(enr)}
                        className="h-8 text-xs bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold gap-1 shadow-sm"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Grant Access
                      </Button>
                    ) : (
                      <Badge className="bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30 h-8 px-2.5 font-bold">
                        Access Active
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── STATUS UPDATE MODAL ────────────────────────────────────────────── */}
      <Dialog
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Update Enquiry Status"
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Enquiry Status</Label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as CourseEnquiryStatus)}
              className="w-full h-10 px-3 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="awaiting_payment">Awaiting Payment</option>
              <option value="payment_under_verification">Payment Under Verification</option>
              <option value="payment_confirmed">Payment Confirmed</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Admin Notes</Label>
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Internal follow-up notes, coupon provided, payment reference..."
              className="text-xs"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsStatusModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isUpdatingStatus}
              className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold"
            >
              {isUpdatingStatus ? "Updating..." : "Save Status"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── CONFIRM PAYMENT MODAL ──────────────────────────────────────────── */}
      <Dialog
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Confirm Course Payment"
      >
        <form onSubmit={handleConfirmPayment} className="space-y-4">
          <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-700 dark:text-emerald-300 space-y-1">
            <p className="font-semibold">
              Verify receipt of ₹{selectedEnquiry?.currentPriceSnapshot?.toLocaleString("en-IN")}
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Confirm that the student has transferred funds via UPI, bank transfer, or payment gateway. Note: Confirming payment does not automatically grant access; you will click &quot;Grant Access&quot; afterwards.
            </p>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Payment Reference / Notes</Label>
            <Input
              type="text"
              placeholder="e.g. UPI Ref # 1234567890 / GPay screenshot verified"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPaymentModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isConfirmingPayment}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {isConfirmingPayment ? "Verifying..." : "Confirm Payment"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── GRANT ACCESS MODAL ─────────────────────────────────────────────── */}
      <Dialog
        isOpen={isGrantModalOpen}
        onClose={() => setIsGrantModalOpen(false)}
        title="Grant Course Access"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              You are granting full classroom access for:
            </p>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
              <p className="font-bold text-slate-900 dark:text-white">
                Course: {selectedEnquiry?.courseNameSnapshot}
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                Student: {selectedEnquiry?.studentName} ({selectedEnquiry?.studentEmail})
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                Amount: ₹{selectedEnquiry?.currentPriceSnapshot?.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          {selectedEnquiry?.status !== "payment_confirmed" && (
            <div className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>
                Payment status is currently &quot;{selectedEnquiry?.status}&quot;. Access can still be granted manually.
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsGrantModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isGrantingAccess}
              onClick={handleGrantAccess}
              className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold gap-1"
            >
              {isGrantingAccess ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Granting Access...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Confirm &amp; Grant Access
                </>
              )}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
