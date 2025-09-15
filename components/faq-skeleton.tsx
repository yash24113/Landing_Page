export function FAQSkeleton() {
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="h-10 bg-slate-200 rounded w-96 mx-auto mb-6 animate-pulse" />
          <div className="h-6 bg-slate-200 rounded w-80 mx-auto animate-pulse" />
        </div>

        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-pulse">
              <div className="flex justify-between items-center">
                <div className="h-5 bg-slate-200 rounded w-3/4" />
                <div className="w-5 h-5 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
