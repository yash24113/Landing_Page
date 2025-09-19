export function ContactFormSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 animate-pulse">
      <div className="space-y-6">
        {/* Progress indicator skeleton */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-slate-200" />
                {step < 3 && <div className="w-16 h-1 mx-2 bg-slate-200" />}
              </div>
            ))}
          </div>
          <div className="h-4 bg-slate-200 rounded w-48" />
        </div>

        {/* Form fields skeleton */}
        {[1, 2, 3, 4].map((field) => (
          <div key={field}>
            <div className="h-4 bg-slate-200 rounded w-32 mb-2" />
            <div className="h-12 bg-slate-200 rounded-lg" />
          </div>
        ))}

        {/* Button skeleton */}
        <div className="flex justify-between mt-8">
          <div className="h-12 bg-slate-200 rounded-lg w-24" />
          <div className="h-12 bg-slate-200 rounded-lg w-32" />
        </div>
      </div>
    </div>
  )
}
