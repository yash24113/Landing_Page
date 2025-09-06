"use client";

import type React from "react";
import { useState, useEffect, useCallback, useRef } from "react";

/* ---------------------------------------------
   Config (unchanged defaults still supported)
---------------------------------------------- */
interface ContactFormProps {
  onSuccess?: () => void;
  submitUrl?: string;
  submitHeaders?: Record<string, string>;
  draftKey?: string; // localStorage key to keep the created _id
}

const STORAGE_KEY = "fabricpro_contact_form";

const RAW_BASE =
  (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:7000/landing")
    .replace(/\/+$/, "");
const DEFAULT_CONTACT_URL = `${RAW_BASE}/contacts`;

const API_KEY_HEADER =
  process.env.NEXT_PUBLIC_API_KEY_HEADER || "x-api-key";
const ADMIN_EMAIL_HEADER =
  process.env.NEXT_PUBLIC_ADMIN_EMAIL_HEADER || "x-admin-email";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";
const ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";

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

  const [draftId, setDraftId] = useState<string>("");

  // debounce timer for autosave
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);

  /* ----------------------------
     Helpers: backend mapping
  ----------------------------- */
  function toBackendPayload() {
    // Map frontend keys → backend keys
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
     Create draft (POST) or
     update draft (PUT)
  ----------------------------- */
  const persistDraft = useCallback(
    async (immediate = false) => {
      if (isSavingRef.current) return; // avoid overlapping saves
      isSavingRef.current = true;

      try {
        const payload = toBackendPayload();

        // If no draft yet: create one
        if (!draftId) {
          const res = await fetch(submitUrl, {
            method: "POST",
            headers: buildAuthHeaders(submitHeaders),
            body: JSON.stringify(payload),
          });
          const json = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(json?.message || `POST ${res.status}`);

          const newId = json?.data?._id || json?._id || json?.id;
          if (newId) {
            setDraftId(newId);
            localStorage.setItem(draftKey, newId);
          }
        } else {
          // Update existing draft
          const res = await fetch(`${submitUrl}/${draftId}`, {
            method: "PUT",
            headers: buildAuthHeaders(submitHeaders),
            body: JSON.stringify(payload),
          });
          const json = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(json?.message || `PUT ${res.status}`);
        }

        // Save local checkpoint
        const dataToSave = {
          formData,
          currentStep,
          lastSaved: new Date().toISOString(),
          draftId: draftId || null,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
      } catch (e) {
        console.error("Autosave error:", e);
        // We won't alert on autosave; user continues typing
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
      persistDraft(false);
    }, 800); // 800ms debounce for onChange
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
     Load from localStorage
     & hydrate from backend if draftId exists
  ----------------------------- */
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        // load cached UI state
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.formData) {
            // Map back-end fields to frontend shape if needed
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

          // hydrate from backend in case local cache is old
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
                fabricTypes: Array.isArray(d.fabricTypesOfInterest)
                  ? d.fabricTypesOfInterest
                  : [],
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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    scheduleAutosave();
  };

  const handleBlur = () => {
    saveImmediately();
  };

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
     Step navigation (NO submit)
     >>> ONLY CHANGE HERE <<<
  ----------------------------- */
  const nextStep = async () => {
    // prevent any lingering success view when moving from step 2 -> 3
    setShowSuccess(false);

    const next = Math.min(currentStep + 1, 3);
    setCurrentStep(next);
    // save step movement immediately (so drafts know which step user reached)
    saveImmediately();
  };

  const prevStep = async () => {
    const prev = Math.max(currentStep - 1, 1);
    setCurrentStep(prev);
    saveImmediately();
  };

  /* ----------------------------
     Final submit (Step 3 only)
  ----------------------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep !== 3) return; // guard: only final step submits

    setIsSubmitting(true);
    try {
      // Flush any pending autosave before final submit
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      await persistDraft(true); // ensure latest edits are saved

      // Show success UI
      setShowSuccess(true);

      // Clear local caches so a new session starts fresh
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
          <p className="text-slate-600">Thank you! We’ll get back to you within 24 hours.</p>
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
                <div className="w-2 h-2 bg-amber-600 rounded-full animate-pulse"></div>
                <span className="text-amber-900">Saving...</span>
              </>
            ) : lastSaved ? (
              <>
                <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
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
          {currentStep === 1 ? "Company Information" : currentStep === 2 ? "Business Details" : "Requirements"}
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

        <div className="flex justify-between mt-8">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={prevStep}
              disabled={isSubmitting}
              className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Previous
            </button>
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={isSubmitting}
              className="ml-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              Next Step
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="ml-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Quote Request</span>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}







