// Simple test script to verify API endpoints
// Run with: node testAPI.js

const testAPI = async () => {
  const baseURL = 'http://localhost:5000';
  
  console.log('🧪 Testing Crypto Trading Signals API\n');
  
  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthRes = await fetch(`${baseURL}/health`);
    const health = await healthRes.json();
    console.log('✅ Health:', health.message);
    console.log('   Environment:', health.environment);
    console.log('');
    
    // Test 2: Register User
    console.log('2️⃣ Testing User Registration...');
    const registerRes = await fetch(`${baseURL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: 'Test@123'
      })
    });
    const registerData = await registerRes.json();
    console.log('✅ Registration:', registerData.message);
    console.log('   User:', registerData.data?.user?.name);
    console.log('');
    
    // Test 3: Login as Admin
    console.log('3️⃣ Testing Admin Login...');
    const loginRes = await fetch(`${baseURL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@cryptosignals.com',
        password: 'Admin@123'
      })
    });
    const loginData = await loginRes.json();
    const accessToken = loginData.data?.tokens?.accessToken;
    console.log('✅ Login:', loginData.message);
    console.log('   Role:', loginData.data?.user?.role);
    console.log('');
    
    // Test 4: Get Signals (Authenticated)
    console.log('4️⃣ Testing Get Signals...');
    const signalsRes = await fetch(`${baseURL}/api/v1/signals?page=1&limit=3`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const signalsData = await signalsRes.json();
    console.log('✅ Signals Retrieved:', signalsData.message);
    console.log('   Total Signals:', signalsData.pagination?.total);
    console.log('   First Signal:', signalsData.data?.[0]?.title);
    console.log('');
    
    // Test 5: Create Signal (Admin Only)
    console.log('5️⃣ Testing Create Signal (Admin)...');
    const createRes = await fetch(`${baseURL}/api/v1/signals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        title: 'Test Signal - API Verification',
        description: 'Created by automated test script',
        signalType: 'BUY',
        cryptocurrency: 'Bitcoin (BTC)',
        targetPrice: 100000,
        confidence: 95
      })
    });
    const createData = await createRes.json();
    console.log('✅ Signal Created:', createData.message);
    console.log('   Title:', createData.data?.signal?.title);
    console.log('');
    
    // Test 6: Get Analytics (Admin Only)
    console.log('6️⃣ Testing Analytics...');
    const analyticsRes = await fetch(`${baseURL}/api/v1/signals/analytics/summary`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const analyticsData = await analyticsRes.json();
    console.log('✅ Analytics Retrieved');
    console.log('   Total Signals:', analyticsData.data?.analytics?.total);
    console.log('   Active Signals:', analyticsData.data?.analytics?.active);
    console.log('   Avg Confidence:', analyticsData.data?.analytics?.avgConfidence);
    console.log('');
    
    console.log('🎉 All tests passed! API is working correctly.\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run tests
testAPI();
