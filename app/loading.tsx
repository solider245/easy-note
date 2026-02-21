// Server-side rendered loading state
// This component is rendered as static HTML on the server
// Users see this instantly while the client hydrates

export default function Loading() {
  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      {/* Static Sidebar Skeleton */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-32 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg" />
          </div>
          <div className="w-full h-10 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600" />
        </div>

        {/* Action Buttons */}
        <div className="p-4 space-y-2">
          <div className="w-full h-10 bg-blue-600 rounded-lg" />
          <div className="flex gap-2">
            <div className="flex-1 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="flex-1 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          </div>
        </div>

        {/* Note List */}
        <div className="flex-1 overflow-hidden p-4 space-y-3">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 space-y-2"
            >
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              </div>
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-full" />
              <div className="flex justify-between items-center">
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-16" />
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-12" />
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <div className="w-full h-9 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="w-full h-9 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>

      {/* Static Editor Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
        {/* Toolbar */}
        <div className="h-14 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg" />
            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg" />
            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg" />
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
          {/* Title */}
          <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg w-3/4 mb-6" />

          {/* Content Lines */}
          <div className="space-y-4">
            <div className="h-4 bg-gray-50 dark:bg-gray-800/50 rounded w-full" />
            <div className="h-4 bg-gray-50 dark:bg-gray-800/50 rounded w-full" />
            <div className="h-4 bg-gray-50 dark:bg-gray-800/50 rounded w-5/6" />
            <div className="h-4 bg-gray-50 dark:bg-gray-800/50 rounded w-full" />
            <div className="h-4 bg-gray-50 dark:bg-gray-800/50 rounded w-4/5" />
            <div className="h-4 bg-gray-50 dark:bg-gray-800/50 rounded w-full" />
            <div className="h-4 bg-gray-50 dark:bg-gray-800/50 rounded w-3/4" />
            <div className="h-4 bg-gray-50 dark:bg-gray-800/50 rounded w-full" />
            <div className="h-4 bg-gray-50 dark:bg-gray-800/50 rounded w-5/6" />
            <div className="h-4 bg-gray-50 dark:bg-gray-800/50 rounded w-full" />
          </div>
        </div>

        {/* Status Bar */}
        <div className="h-8 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
          <div className="w-32 h-4 bg-gray-100 dark:bg-gray-800 rounded" />
          <div className="w-24 h-4 bg-gray-100 dark:bg-gray-800 rounded" />
        </div>
      </div>
    </div>
  );
}
