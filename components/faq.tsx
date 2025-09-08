"use client"

import { useState } from "react"

const faqs = [
  {
    question: "What is your minimum order quantity for bulk fabric orders?",
    answer:
      "Our minimum order quantity varies by fabric type, typically starting from 500 meters for standard fabrics and 1000 meters for custom specifications. We work with garment manufacturers and retailers of all sizes to accommodate their specific needs.",
  },
  {
    question: "Do you provide fabric samples before placing bulk orders?",
    answer:
      "Yes, we provide free fabric samples for all our products. Sample orders are processed within 3-5 business days and shipped worldwide. This allows fabric importers and manufacturers to evaluate quality before committing to larger orders.",
  },
  {
    question: "What are your payment terms for B2B fabric orders?",
    answer:
      "We offer flexible payment terms including T/T (Telegraphic Transfer), L/C (Letter of Credit), and for established clients, we provide 30-60 day payment terms. All transactions are secure and comply with international trade regulations.",
  },
  {
    question: "How do you ensure consistent quality across large fabric orders?",
    answer:
      "We maintain strict quality control processes including pre-production samples, in-line inspection during manufacturing, and final quality checks before shipment. All our facilities are ISO certified and follow international quality standards.",
  },
  {
    question: "What is your typical lead time for fabric manufacturing and delivery?",
    answer:
      "Lead times vary based on fabric type and order quantity. Standard fabrics: 15-20 days, custom fabrics: 25-35 days. We provide detailed production schedules and regular updates throughout the manufacturing process.",
  },
  {
    question: "Do you offer custom fabric development services?",
    answer:
      "Yes, we specialize in custom fabric development for clothing brands and manufacturers. Our R&D team works closely with clients to develop unique fabric compositions, colors, and finishes that meet specific requirements.",
  },
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="py-20 bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">Frequently Asked Questions</h2>
          <p className="text-xl text-slate-600">Common questions from fabric importers and manufacturers</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <button
                className="w-full px-6 py-6 text-left flex justify-between items-center hover:bg-slate-50 transition-colors"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="text-lg font-semibold text-slate-900 pr-4">{faq.question}</span>
                <div
                  className={`transform transition-transform duration-200 ${openIndex === index ? "rotate-180" : ""}`}
                >
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {openIndex === index && (
                <div className="px-6 pb-6">
                  <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
