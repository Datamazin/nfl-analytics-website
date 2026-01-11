export default function ChartSkeleton() {
  return (
    <div className="w-full h-[300px] md:h-[400px] animate-pulse bg-gray-200 rounded-lg flex items-center justify-center">
      <div className="space-y-4 w-full px-8">
        <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto"></div>
        <div className="space-y-3">
          <div className="h-3 bg-gray-300 rounded"></div>
          <div className="h-3 bg-gray-300 rounded w-5/6"></div>
          <div className="h-3 bg-gray-300 rounded w-4/6"></div>
          <div className="h-3 bg-gray-300 rounded w-3/6"></div>
        </div>
      </div>
    </div>
  );
}
