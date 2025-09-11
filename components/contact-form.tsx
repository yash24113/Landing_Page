// components/contact-form.tsx
"use client";

import type React from "react";
import { useState, useEffect, useCallback, useRef } from "react";

/* ---------------------------------------------
   Config
---------------------------------------------- */
export interface ContactFormProps {
  onSuccess?: () => void;
  submitUrl?: string;
  submitHeaders?: Record<string, string>;
  /** localStorage key for the backend draft id (shared across instances) */
  draftKey?: string;
}

const STORAGE_KEY = "fabricpro_contact_form"; // UI state cache (shared)
const RAW_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:7000/landing").replace(/\/+$/, "");
const DEFAULT_CONTACT_URL = `${RAW_BASE}/contacts`;

const API_KEY_HEADER = process.env.NEXT_PUBLIC_API_KEY_HEADER || "x-api-key";
const ADMIN_EMAIL_HEADER = process.env.NEXT_PUBLIC_ADMIN_EMAIL_HEADER || "x-admin-email";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";

/** Public company info for the right-rail / section (env-driven, with fallbacks) */
const COMPANY_PHONE = process.env.NEXT_PUBLIC_COMPANY_PHONE || "+91 9925155141";
const COMPANY_EMAIL = process.env.NEXT_PUBLIC_COMPANY_EMAIL || "rajesh.goyal@amritafashions.com";
const COMPANY_ADDRESS =
  process.env.NEXT_PUBLIC_COMPANY_ADDRESS ||
  "404, Safal Prelude, Corporate Rd, Prahlad Nagar, Ahmedabad, Gujarat-380015";
const COMPANY_HOURS = process.env.NEXT_PUBLIC_COMPANY_HOURS || "Mon–Sat: 9:30 AM – 7:00 PM IST";

/** Minimal phone sanitizer for tel: links (keeps a single leading +, removes other non-digits) */
function sanitizeE164(value: string) {
  if (!value) return "";
  const hasPlus = value.trim().startsWith("+");
  const digits = value.replace(/\D/g, "");
  return hasPlus ? `+${digits}` : digits;
}

function buildAuthHeaders(extra?: Record<string, string>) {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (API_KEY) h[API_KEY_HEADER] = API_KEY;
  if (ADMIN_EMAIL) h[ADMIN_EMAIL_HEADER] = ADMIN_EMAIL;
  return { ...h, ...(extra || {}) };
}

/* ---------------------------------------------
   Component
---------------------------------------------- */
export function ContactForm({
  onSuccess,
  submitUrl = DEFAULT_CONTACT_URL,
  submitHeaders,
  draftKey = "contact_draft_id",
}: ContactFormProps = {}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    businessType: "",
    annualVolume: "",
    primaryMarkets: "",
    fabricTypes: [] as string[],
    specifications: "",
    timeline: "",
    message: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // quick transition overlay when moving 2 -> 3
  const [showStepAdvance, setShowStepAdvance] = useState(false);
  const stepAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [draftId, setDraftId] = useState<string>("");

  // debounce timer for autosave
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (stepAdvanceTimer.current) clearTimeout(stepAdvanceTimer.current);
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  /* ----------------------------
     Helpers: backend mapping
  ----------------------------- */
  function toBackendPayload() {
    return {
      companyName: formData.companyName,
      contactPerson: formData.contactPerson,
      email: formData.email,
      phoneNumber: formData.phone,
      businessType: formData.businessType,
      annualFabricVolume: formData.annualVolume,
      primaryMarkets: formData.primaryMarkets,
      fabricTypesOfInterest: formData.fabricTypes,
      specificationsRequirements: formData.specifications,
      timeline: formData.timeline,
      additionalMessage: formData.message,
    };
  }

  /* ----------------------------
     Create or update draft
  ----------------------------- */
  const persistDraft = useCallback(
    async (_immediate = false) => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;

      try {
        const payload = toBackendPayload();
        let newId = draftId;

        if (!draftId) {
          const res = await fetch(submitUrl, {
            method: "POST",
            headers: buildAuthHeaders(submitHeaders),
            body: JSON.stringify(payload),
          });
          const json = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(json?.message || `POST ${res.status}`);
          newId = json?.data?._id || json?._id || json?.id || "";
          if (newId) {
            setDraftId(newId);
            localStorage.setItem(draftKey, newId);
          }
        } else {
          const res = await fetch(`${submitUrl}/${draftId}`, {
            method: "PUT",
            headers: buildAuthHeaders(submitHeaders),
            body: JSON.stringify(payload),
          });
          const json = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(json?.message || `PUT ${res.status}`);
        }

        // Save UI snapshot so another instance (modal/section) clones progress
        const dataToSave = {
          formData,
          currentStep,
          lastSaved: new Date().toISOString(),
          draftId: newId || draftId || null,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));

        setLastSaved(new Date());
        setHasUnsavedChanges(false);
      } catch (e) {
        console.error("Autosave error:", e);
      } finally {
        isSavingRef.current = false;
      }
    },
    [draftId, formData, currentStep, submitUrl, submitHeaders, draftKey]
  );

  // Debounced autosave when form changes
  const scheduleAutosave = useCallback(() => {
    setHasUnsavedChanges(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void persistDraft(false);
    }, 800);
  }, [persistDraft]);

  // Immediate save on blur
  const saveImmediately = useCallback(() => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    setHasUnsavedChanges(true);
    void persistDraft(true);
  }, [persistDraft]);

  /* ----------------------------
     Load from localStorage & server
  ----------------------------- */
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.formData) {
            setFormData({
              companyName: parsed.formData.companyName ?? "",
              contactPerson: parsed.formData.contactPerson ?? "",
              email: parsed.formData.email ?? "",
              phone: parsed.formData.phone ?? "",
              businessType: parsed.formData.businessType ?? "",
              annualVolume: parsed.formData.annualVolume ?? "",
              primaryMarkets: parsed.formData.primaryMarkets ?? "",
              fabricTypes: parsed.formData.fabricTypes ?? [],
              specifications: parsed.formData.specifications ?? "",
              timeline: parsed.formData.timeline ?? "",
              message: parsed.formData.message ?? "",
            });
          }
          setCurrentStep(parsed.currentStep || 1);
          setLastSaved(parsed.lastSaved ? new Date(parsed.lastSaved) : null);
        }

        const savedDraft = localStorage.getItem(draftKey) || "";
        if (savedDraft) {
          setDraftId(savedDraft);
          // hydrate from backend
          try {
            const res = await fetch(`${submitUrl}/${savedDraft}`, {
              method: "GET",
              headers: buildAuthHeaders(submitHeaders),
            });
            const json = await res.json().catch(() => ({}));
            if (res.ok && json?.data) {
              const d = json.data;
              setFormData({
                companyName: d.companyName ?? "",
                contactPerson: d.contactPerson ?? "",
                email: d.email ?? "",
                phone: d.phoneNumber ?? "",
                businessType: d.businessType ?? "",
                annualVolume: d.annualFabricVolume ?? "",
                primaryMarkets: d.primaryMarkets ?? "",
                fabricTypes: Array.isArray(d.fabricTypesOfInterest) ? d.fabricTypesOfInterest : [],
                specifications: d.specificationsRequirements ?? "",
                timeline: d.timeline ?? "",
                message: d.additionalMessage ?? "",
              });
            }
          } catch (e) {
            console.warn("Could not hydrate draft from server:", e);
          }
        }
      } catch (error) {
        console.error("Error loading saved form data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadSavedData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ----------------------------
     Field handlers
  ----------------------------- */
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    scheduleAutosave();
  };

  const handleBlur = () => saveImmediately();

  const handleCheckboxChange = (fabricType: string) => {
    setFormData((prev) => {
      const updated = prev.fabricTypes.includes(fabricType)
        ? prev.fabricTypes.filter((t) => t !== fabricType)
        : [...prev.fabricTypes, fabricType];
      return { ...prev, fabricTypes: updated };
    });
    scheduleAutosave();
  };

  /* ----------------------------
     Step nav (no submit)
  ----------------------------- */
  const nextStep = async () => {
    saveImmediately();
    if (currentStep === 2) {
      setShowStepAdvance(true);
      stepAdvanceTimer.current = setTimeout(() => {
        setShowStepAdvance(false);
        setCurrentStep(3);
      }, 1200);
      return;
    }
    setCurrentStep((s) => Math.min(s + 1, 3));
  };

  const prevStep = async () => {
    setCurrentStep((s) => Math.max(s - 1, 1));
    saveImmediately();
  };

  /* ----------------------------
     Final submit (Step 3)
  ----------------------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep !== 3) return;

    setIsSubmitting(true);
    try {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      await persistDraft(true);

      setShowSuccess(true);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(draftKey);

      setTimeout(() => {
        setShowSuccess(false);
        onSuccess?.();
      }, 3000);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("There was an error submitting your form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ----------------------------
     UI
  ----------------------------- */
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <span className="ml-3 text-slate-600">Loading form...</span>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Quote Request Submitted!</h3>
          <p className="text-slate-600">Thank you! We&apos;ll get back to you within 24 hours.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      {/* Auto-save indicator */}
      <div className="mb-6" role="status" aria-live="polite">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            {hasUnsavedChanges ? (
              <>
                <div className="w-2 h-2 bg-amber-600 rounded-full animate-pulse" />
                <span className="text-amber-900">Saving...</span>
              </>
            ) : lastSaved ? (
              <>
                <div className="w-2 h-2 bg-emerald-600 rounded-full" />
                <span className="text-emerald-900">
                  Saved {lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  currentStep >= step ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
                }`}
              >
                {step}
              </div>
              {step < 3 && (
                <div className={`w-16 h-1 mx-2 transition-colors ${currentStep > step ? "bg-blue-600" : "bg-slate-200"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="text-sm text-slate-600">
          Step {currentStep} of 3:{" "}
          {currentStep === 1 ? "Company Yash" : currentStep === 2 ? "Business Details" : "Requirements"}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Company Name *</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                onBlur={handleBlur}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Your company name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Contact Person *</label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleInputChange}
                onBlur={handleBlur}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                onBlur={handleBlur}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="your@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                onBlur={handleBlur}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Business Type *</label>
              <select
                name="businessType"
                value={formData.businessType}
                onChange={handleInputChange}
                onBlur={handleBlur}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="">Select business type</option>
                <option value="garment-manufacturer">Garment Manufacturer</option>
                <option value="clothing-retailer">Clothing Retailer</option>
                <option value="fabric-importer">Fabric Importer</option>
                <option value="trading-company">Trading Company</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Annual Fabric Volume</label>
              <select
                name="annualVolume"
                value={formData.annualVolume}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="">Select volume range</option>
                <option value="under-10k">Under 10,000 meters</option>
                <option value="10k-50k">10,000 - 50,000 meters</option>
                <option value="50k-100k">50,000 - 100,000 meters</option>
                <option value="100k-500k">100,000 - 500,000 meters</option>
                <option value="over-500k">Over 500,000 meters</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Primary Markets</label>
              <input
                type="text"
                name="primaryMarkets"
                value={formData.primaryMarkets}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="e.g., North America, Europe, Asia"
              />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Fabric Types of Interest *</label>
              <div className="grid grid-cols-2 gap-3">
                {["Cotton", "Silk", "Polyester", "Blends", "Linen", "Wool", "Technical", "Denim"].map((fabric) => (
                  <label key={fabric} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.fabricTypes.includes(fabric)}
                      onChange={() => handleCheckboxChange(fabric)}
                      onBlur={handleBlur}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">{fabric}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Specifications & Requirements</label>
              <textarea
                name="specifications"
                value={formData.specifications}
                onChange={handleInputChange}
                onBlur={handleBlur}
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Weight, width, color requirements, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Timeline</label>
              <select
                name="timeline"
                value={formData.timeline}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="">Select timeline</option>
                <option value="immediate">Immediate (Within 1 month)</option>
                <option value="1-3-months">1-3 months</option>
                <option value="3-6-months">3-6 months</option>
                <option value="6-months-plus">6+ months</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Additional Message</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                onBlur={handleBlur}
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Any additional requirements or questions..."
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Primary on top (mobile), Secondary below; both full-width on mobile */}
          {currentStep < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={isSubmitting}
              className="order-1 sm:order-2 w-full sm:w-auto sm:ml-auto inline-flex justify-center px-7 py-3 rounded-xl
                         bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold
                         shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
            >
              Next Step
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="order-1 sm:order-2 w-full sm:w-auto sm:ml-auto inline-flex items-center justify-center rounded-xl
                         bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg
                         hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50
                         px-8 py-3"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  <span className="font-semibold">Submitting…</span>
                </>
              ) : (
                <span className="font-semibold leading-tight text-center">
                  <span className="block">Submit Quote</span>
                  <span className="block">Request</span>
                </span>
              )}
            </button>
          )}

          {currentStep > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              disabled={isSubmitting}
              className="order-2 sm:order-1 w-full sm:w-auto inline-flex justify-center px-6 py-3 rounded-xl border border-slate-200
                         bg-white text-slate-700 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Previous
            </button>
          ) : (
            <span className="order-2 sm:order-1 h-0 w-0 sm:w-px sm:h-px" />
          )}
        </div>

        {/* Space for sticky FABs on mobile so buttons don't get covered */}
        <div className="md:hidden h-[max(16px,env(safe-area-inset-bottom))]" />
      </form>
    </div>
  );
}
