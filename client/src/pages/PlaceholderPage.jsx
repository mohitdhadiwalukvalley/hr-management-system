import { Card, Button } from '../components/common';

const PlaceholderPage = ({ title }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500 mt-1">This module is coming soon</p>
      </div>

      {/* Coming Soon Card */}
      <Card className="text-center py-16">
        <div className="max-w-md mx-auto">
          {/* Icon */}
          <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl mb-6">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          </div>

          {/* Content */}
          <h3 className="text-xl font-bold text-gray-900 mb-2">Under Development</h3>
          <p className="text-gray-500 mb-8">
            We're working hard to bring you this feature. It will be available in an upcoming release.
          </p>

          {/* Progress indicator */}
          <div className="bg-gray-100 rounded-full h-2 mb-4 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full w-3/5 animate-pulse" />
          </div>
          <p className="text-sm text-gray-500">Development in progress...</p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Button variant="outline" onClick={() => window.history.back()}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Go Back
            </Button>
            <Button onClick={() => window.location.href = '/dashboard'}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      </Card>

      {/* Feature Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Fast Performance</h4>
              <p className="text-sm text-gray-600 mt-1">Optimized for speed and efficiency</p>
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Secure & Reliable</h4>
              <p className="text-sm text-gray-600 mt-1">Enterprise-grade security built-in</p>
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Modern UI</h4>
              <p className="text-sm text-gray-600 mt-1">Clean and intuitive interface</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PlaceholderPage;