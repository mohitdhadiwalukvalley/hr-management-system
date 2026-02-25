const PlaceholderPage = ({ title }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600 mt-2">
          This module is coming soon. Stay tuned!
        </p>
      </div>
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">Under Development</h3>
        <p className="mt-2 text-gray-500">
          This feature is being developed and will be available soon.
        </p>
      </div>
    </div>
  );
};

export default PlaceholderPage;