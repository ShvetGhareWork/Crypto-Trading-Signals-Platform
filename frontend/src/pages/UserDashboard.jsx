import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const UserDashboard = () => {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    signalType: '',
    minConfidence: '',
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchSignals();
  }, [filters]);

  const fetchSignals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.signalType) params.append('signalType', filters.signalType);
      if (filters.minConfidence) params.append('minConfidence', filters.minConfidence);
      params.append('page', filters.page);
      params.append('limit', filters.limit);

      const { data } = await api.get(`/signals?${params}`);
      setSignals(data.data);
      setPagination(data.pagination);
    } catch (error) {
      toast.error('Failed to fetch signals');
    } finally {
      setLoading(false);
    }
  };

  const getSignalBadge = (type) => {
    const badges = {
      BUY: 'badge-buy',
      SELL: 'badge-sell',
      HOLD: 'badge-hold',
    };
    return badges[type] || 'badge';
  };

  return (
    <div className="min-h-screen bg-crypto-darker">
      {/* Mobile-first responsive container */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl mx-auto">
        
        {/* Header - Responsive text sizing */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
            Trading Signals
          </h1>
          <p className="text-sm sm:text-base text-gray-400">
            View and filter crypto trading signals
          </p>
        </div>

        {/* Filters - Responsive grid */}
        <div className="card mb-4 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                Signal Type
              </label>
              <select
                value={filters.signalType}
                onChange={(e) => setFilters({ ...filters, signalType: e.target.value, page: 1 })}
                className="input-field text-sm sm:text-base"
              >
                <option value="">All Types</option>
                <option value="BUY">Buy</option>
                <option value="SELL">Sell</option>
                <option value="HOLD">Hold</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                Min Confidence
              </label>
              <select
                value={filters.minConfidence}
                onChange={(e) => setFilters({ ...filters, minConfidence: e.target.value, page: 1 })}
                className="input-field text-sm sm:text-base"
              >
                <option value="">Any</option>
                <option value="80">80%+</option>
                <option value="70">70%+</option>
                <option value="60">60%+</option>
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                Per Page
              </label>
              <select
                value={filters.limit}
                onChange={(e) => setFilters({ ...filters, limit: e.target.value, page: 1 })}
                className="input-field text-sm sm:text-base"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-crypto-accent"></div>
          </div>
        ) : signals.length === 0 ? (
          <div className="card text-center py-8 sm:py-12">
            <p className="text-sm sm:text-base text-gray-400">No signals found</p>
          </div>
        ) : (
          <>
            {/* Signals Grid - Responsive columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
              {signals.map((signal) => (
                <div 
                  key={signal._id} 
                  className="card hover:border-crypto-accent transition-all duration-300 transform hover:scale-[1.02]"
                >
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-3 sm:mb-4">
                    <span className={`badge text-xs sm:text-sm ${getSignalBadge(signal.signalType)}`}>
                      {signal.signalType}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-400">
                      {new Date(signal.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: window.innerWidth < 640 ? '2-digit' : 'numeric'
                      })}
                    </span>
                  </div>

                  {/* Card Title & Description */}
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-2 line-clamp-2">
                    {signal.title}
                  </h3>
                  <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem]">
                    {signal.description || 'No description available'}
                  </p>

                  {/* Card Details */}
                  <div className="space-y-2 sm:space-y-2.5">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-400">Cryptocurrency:</span>
                      <span className="text-white font-medium truncate ml-2 max-w-[60%] text-right">
                        {signal.cryptocurrency}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-400">Target Price:</span>
                      <span className="text-crypto-accent font-semibold">
                        ${signal.targetPrice.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="text-gray-400">Confidence:</span>
                      <div className="flex items-center flex-1 ml-3 max-w-[60%]">
                        {/* Progress Bar */}
                        <div className="flex-1 h-1.5 sm:h-2 bg-gray-700 rounded-full mr-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              signal.confidence >= 80 
                                ? 'bg-green-500' 
                                : signal.confidence >= 60 
                                ? 'bg-crypto-accent' 
                                : 'bg-yellow-500'
                            }`}
                            style={{ width: `${signal.confidence}%` }}
                          ></div>
                        </div>
                        <span className="text-white font-semibold min-w-[2.5rem] text-right">
                          {signal.confidence}%
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    {signal.status && (
                      <div className="pt-2 border-t border-gray-800">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          signal.status === 'active' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {signal.status}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination - Responsive layout */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 mt-6 sm:mt-8">
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  disabled={!pagination.hasPrevPage}
                  className="btn-secondary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  ← Previous
                </button>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm text-gray-400">
                    Page <span className="text-white font-medium">{pagination.page}</span> of{' '}
                    <span className="text-white font-medium">{pagination.totalPages}</span>
                  </span>
                  
                  {/* Mobile: Show total results */}
                  <span className="hidden sm:inline text-xs text-gray-500">
                    ({pagination.total} total)
                  </span>
                </div>
                
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  disabled={!pagination.hasNextPage}
                  className="btn-secondary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  Next →
                </button>
              </div>
            )}

            {/* Mobile: Show results count below pagination */}
            {pagination && (
              <div className="sm:hidden text-center mt-3">
                <span className="text-xs text-gray-500">
                  Showing {signals.length} of {pagination.total} signals
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
