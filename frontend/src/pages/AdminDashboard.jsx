import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSignal, setEditingSignal] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    signalType: 'BUY',
    cryptocurrency: '',
    targetPrice: '',
    confidence: '',
  });

  useEffect(() => {
    fetchSignals();
  }, []);

  const fetchSignals = async () => {
    try {
      const { data } = await api.get('/signals?limit=50');
      setSignals(data.data);
    } catch (error) {
      toast.error('Failed to fetch signals');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        targetPrice: Number(formData.targetPrice),
        confidence: Number(formData.confidence),
      };

      if (editingSignal) {
        await api.put(`/signals/${editingSignal._id}`, payload);
        toast.success('Signal updated successfully');
      } else {
        await api.post('/signals', payload);
        toast.success('Signal created successfully');
      }
      
      setShowModal(false);
      resetForm();
      fetchSignals();
    } catch (error) {
      if (error.response?.data?.data?.errors) {
        const errors = error.response.data.data.errors;
        errors.forEach(err => {
          toast.error(`${err.field}: ${err.message}`);
        });
      } else {
        const errorMsg = error.response?.data?.message || 'Failed to save signal';
        toast.error(errorMsg);
      }
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this signal?')) return;

    try {
      await api.delete(`/signals/${id}`);
      toast.success('Signal deleted successfully');
      fetchSignals();
    } catch (error) {
      toast.error('Failed to delete signal');
    }
  };

  const openEditModal = (signal) => {
    setEditingSignal(signal);
    setFormData({
      title: signal.title,
      description: signal.description || '',
      signalType: signal.signalType,
      cryptocurrency: signal.cryptocurrency,
      targetPrice: signal.targetPrice,
      confidence: signal.confidence,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingSignal(null);
    setFormData({
      title: '',
      description: '',
      signalType: 'BUY',
      cryptocurrency: '',
      targetPrice: '',
      confidence: '',
    });
  };

  return (
    <div className="min-h-screen bg-crypto-darker">
      {/* Mobile-first responsive container */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl mx-auto">
        
        {/* Header - Stacks on mobile, horizontal on desktop */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
              Admin Dashboard
            </h1>
            <p className="text-sm sm:text-base text-gray-400">Manage trading signals</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn-primary w-full sm:w-auto whitespace-nowrap"
          >
            + Create Signal
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-crypto-accent"></div>
          </div>
        ) : (
          <>
            {/* Desktop Table View - Hidden on mobile */}
            <div className="hidden lg:block card overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Title</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Type</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Crypto</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Price</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Confidence</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {signals.map((signal) => (
                    <tr key={signal._id} className="border-b border-gray-800 hover:bg-white/5">
                      <td className="py-3 px-4 text-white">{signal.title}</td>
                      <td className="py-3 px-4">
                        <span className={`badge ${signal.signalType === 'BUY' ? 'badge-buy' : signal.signalType === 'SELL' ? 'badge-sell' : 'badge-hold'}`}>
                          {signal.signalType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-300">{signal.cryptocurrency}</td>
                      <td className="py-3 px-4 text-crypto-accent">${signal.targetPrice.toLocaleString()}</td>
                      <td className="py-3 px-4 text-white">{signal.confidence}%</td>
                      <td className="py-3 px-4">
                        <span className={`badge ${signal.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                          {signal.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(signal)}
                            className="text-crypto-accent hover:text-crypto-accent-dark text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(signal._id)}
                            className="text-crypto-danger hover:text-red-600 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Card View - Visible on mobile and tablet */}
            <div className="lg:hidden space-y-4">
              {signals.map((signal) => (
                <div key={signal._id} className="card p-4 sm:p-5">
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-white font-semibold text-base sm:text-lg pr-2 flex-1">
                      {signal.title}
                    </h3>
                    <span className={`badge ${signal.signalType === 'BUY' ? 'badge-buy' : signal.signalType === 'SELL' ? 'badge-sell' : 'badge-hold'} flex-shrink-0`}>
                      {signal.signalType}
                    </span>
                  </div>

                  {/* Card Details - Grid layout for better mobile organization */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-400 mb-1">Cryptocurrency</p>
                      <p className="text-sm sm:text-base text-gray-300 font-medium">
                        {signal.cryptocurrency}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-400 mb-1">Target Price</p>
                      <p className="text-sm sm:text-base text-crypto-accent font-semibold">
                        ${signal.targetPrice.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-400 mb-1">Confidence</p>
                      <p className="text-sm sm:text-base text-white font-medium">
                        {signal.confidence}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-400 mb-1">Status</p>
                      <span className={`badge text-xs ${signal.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {signal.status}
                      </span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex gap-2 pt-3 border-t border-gray-800">
                    <button
                      onClick={() => openEditModal(signal)}
                      className="flex-1 py-2 px-4 bg-crypto-accent/10 text-crypto-accent hover:bg-crypto-accent/20 rounded-lg text-sm font-medium transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(signal._id)}
                      className="flex-1 py-2 px-4 bg-crypto-danger/10 text-crypto-danger hover:bg-crypto-danger/20 rounded-lg text-sm font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Create/Edit Modal - Responsive */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
                {editingSignal ? 'Edit Signal' : 'Create New Signal'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input-field"
                    placeholder="Minimum 5 characters"
                    required
                    minLength={5}
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field"
                    rows="3"
                  />
                </div>

                {/* Responsive Grid - Stacks on mobile, side-by-side on tablet+ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Signal Type
                    </label>
                    <select
                      value={formData.signalType}
                      onChange={(e) => setFormData({ ...formData, signalType: e.target.value })}
                      className="input-field"
                    >
                      <option value="BUY">Buy</option>
                      <option value="SELL">Sell</option>
                      <option value="HOLD">Hold</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Cryptocurrency
                    </label>
                    <input
                      type="text"
                      value={formData.cryptocurrency}
                      onChange={(e) => setFormData({ ...formData, cryptocurrency: e.target.value })}
                      className="input-field"
                      placeholder="Bitcoin (BTC)"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Target Price ($)
                    </label>
                    <input
                      type="number"
                      value={formData.targetPrice}
                      onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
                      className="input-field"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Confidence (%)
                    </label>
                    <input
                      type="number"
                      value={formData.confidence}
                      onChange={(e) => setFormData({ ...formData, confidence: e.target.value })}
                      className="input-field"
                      required
                      min="1"
                      max="100"
                    />
                  </div>
                </div>

                {/* Responsive Button Layout */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                  <button type="submit" className="btn-primary flex-1 w-full sm:w-auto">
                    {editingSignal ? 'Update Signal' : 'Create Signal'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="btn-secondary flex-1 w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
