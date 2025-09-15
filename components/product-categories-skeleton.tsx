export function ProductCategoriesSkeleton() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="h-10 bg-slate-200 rounded w-96 mx-auto mb-6 animate-pulse" />
          <div className="h-6 bg-slate-200 rounded w-[600px] mx-auto animate-pulse" />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100 animate-pulse"
            >
              <div className="w-full h-48 bg-slate-200" />
              <div className="p-6">
                <div className="h-6 bg-slate-200 rounded w-32 mb-3" />
                <div className="h-4 bg-slate-200 rounded w-full mb-2" />
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-4" />

                <div className="space-y-2 mb-6">
                  {[1, 2, 3].map((feature) => (
                    <div key={feature} className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-slate-200 rounded-full mr-3" />
                      <div className="h-3 bg-slate-200 rounded w-20" />
                    </div>
                  ))}
                </div>

                <div className="h-12 bg-slate-200 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
