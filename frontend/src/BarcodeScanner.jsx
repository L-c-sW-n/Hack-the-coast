import { useEffect, useRef, useState } from 'react';
import ScanbotSDK from 'scanbot-web-sdk';

const LICENSE_KEY = "iWnayRfTw+/1KWIA/+Ldm3TxVNtDew" +
  "Y0uP/lxzokaowvgHEW4+d72oljWcrh" +
  "bN1eDrMLd53cefirqPp7avUd52eX9l" +
  "MHuF7zPrFrtZbTU3jewjyNEpp8OA/X" +
  "ozHrqiRxAKj7zPR3DI3C0UrMEHDFQI" +
  "hj92izZ46/GGJVlAbSRtD8u6dWmbMV" +
  "tM9Q1VXZZRAg5bA8BS1pZZ8Khgd6Hh" +
  "5o+T+VY+0K33Rk4JGYsz9dcV93JMqC" +
  "uR+DjckCI6+hbQm7Ukj70OSCS350Yg" +
  "NWVq0ajKDmqmKksfBdPBO73o6qxdhQ" +
  "0RKxtnyT0PDk7qw6Mvtwy9EBHfAOfb" +
  "4/LvIGOJF0qw==\nU2NhbmJvdFNESw" +
  "psb2NhbGhvc3R8Z3JlZW4tc2Nhbm5l" +
  "ci1tdS52ZXJjZWwuYXBwCjE3NzExMT" +
  "M1OTkKODM4ODYwNwo4\n";

const SUSTAINABLE_TIPS = [
  "Eating one plant-based meal a day can save 3,000 liters of water.",
  "Beef production requires 20x more land than growing beans.",
  "Shopping local reduces 'food miles' and carbon emissions.",
  "Roughly 1/3 of all food produced globally is wasted.",
  "Almond milk requires significantly more water than oat or soy milk.",
  "A meat-free Monday can reduce your annual carbon footprint by 15%."
];

function BarcodeScanner() {
  const [sdk, setSdk] = useState(null);
  const [barcode, setBarcode] = useState('');
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [productData, setProductData] = useState(null);
  const [currentTip, setCurrentTip] = useState(SUSTAINABLE_TIPS[0]);
  const [opacity, setOpacity] = useState(0);
  const [view, setView] = useState('home'); 
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    ScanbotSDK.initialize({
      licenseKey: LICENSE_KEY,
      enginePath: '/bundle/bin/barcode-scanner'
    }).then(setSdk).catch(console.error);
  }, []);

  const rotateTip = () => {
    const randomIndex = Math.floor(Math.random() * SUSTAINABLE_TIPS.length);
    setCurrentTip(SUSTAINABLE_TIPS[randomIndex]);
  };

  const startScanning = async () => {
    if (!sdk) return;
    setScanning(true);
    setError('');
    setProductData(null);
    setBarcode('');
    setOpacity(0);
    setView('home');

    let hasDetected = false;
    setTimeout(async () => {
      const config = {
        containerId: 'scanner-container',
        onBarcodesDetected: (result) => {
          if (!hasDetected && result.barcodes?.[0]) {
            hasDetected = true;
            if (navigator.vibrate) { navigator.vibrate(100); }
            const code = result.barcodes[0].text;
            setBarcode(code);
            stopScanning();
            fetchProductData(code);
            rotateTip();
          }
        },
      };
      scannerRef.current = await sdk.createBarcodeScanner(config);
    }, 0);
  };

  const stopScanning = () => {
    scannerRef.current?.dispose();
    setScanning(false);
  };

  const fetchProductData = async (code) => {
    setLoading(true);
    try {
      const response = await fetch(`https://greenscan-backend.onrender.com/api/product/${code}`);
      if (!response.ok) { throw new Error('Product not found'); }
      const data = await response.json();
      setProductData(data);

        console.log("Name:", data.name);
        console.log("Score:", data.score);
        console.log("Grade:", data.grade);
        console.log("Top Factors:", data.top_factors);
        console.log("Advanced Data Available:", data.advanced_data_available);
        console.log("Brand:", data.brand)

      setView('results');
      setTimeout(() => setOpacity(1), 150);
    } catch (err) {
      setError(err.message || "Unable to connect.");
      setTimeout(() => { setBarcode(''); setError(''); }, 2200);
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setView('home');
    setBarcode('');
    setProductData(null);
    setOpacity(0);
    setShowBreakdown(false);
  };

  const getScoreColor = (score) => {
    if (score < 25) return '#27ae60';
    if (score < 55) return '#f1c40f';
    if (score < 85) return '#e67e22';
    return '#e74c3c';
  };

  const getFactorStyles = (text) => {
    const lowerText = text.toLowerCase();
    let styles = { bg: '#f8f9f8', text: '#444', icon: '📦' };
    if (lowerText.includes('processed')) { styles.icon = '👎'; styles.bg = '#fff5f5'; styles.text = '#c53030'; }
    else if (lowerText.includes('vegan') || lowerText.includes('plant-based')) { styles.icon = '🌱'; styles.bg = '#f0fff4'; styles.text = '#2f855a'; }
    else if (lowerText.includes('organic')) styles.icon = '🍏';
    else if (lowerText.includes('beef') || lowerText.includes('meat')) styles.icon = '🥩';
    else if (lowerText.includes('palm oil')) styles.icon = '🌴';
    else if (lowerText.includes('plastic') || lowerText.includes('packaging')) styles.icon = '♻️';
    else if (lowerText.includes('local') || lowerText.includes('miles')) styles.icon = '📍';
    else if (lowerText.includes('water')) styles.icon = '💧';
    else if (lowerText.includes('carbon')) styles.icon = '☁️';
    else if (lowerText.includes('sugar') || lowerText.includes('additive')) styles.icon = '🧪';
    
    if (styles.bg === '#f8f9f8') {
        if (lowerText.includes('high') || lowerText.includes('heavy') || lowerText.includes('poor')) {
            styles.bg = '#fff5f5'; styles.text = '#c53030';
        } else if (lowerText.includes('low') || lowerText.includes('good') || lowerText.includes('sustainable')) {
            styles.bg = '#f0fff4'; styles.text = '#2f855a';
        }
    }
    return styles;
  };

  return (
    <div style={{ 
      width: '100vw', 
      height: '100dvh', 
      background: '#fff', 
      overflow: 'hidden', 
      position: 'fixed', 
      top: 0, 
      left: 0,
      // Added padding for notched phones
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)',
      boxSizing: 'border-box'
    }}>
      <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>

        {/* 1. HOME SCREEN */}
        {view === 'home' && !scanning && !loading && !error && (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(180deg, #6b9175 0%, #4a6d53 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '30px', color: 'white', padding: '20px', boxSizing: 'border-box' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(50px, 10vh, 80px)', marginBottom: '10px' }}>🍃</div>
              <h1 style={{ fontWeight: '200', fontSize: 'clamp(24px, 5vw, 32px)', letterSpacing: '4px', margin: 0 }}>ECOSCAN</h1>
            </div>
            <div style={{ width: '100%', maxWidth: '350px', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '25px', textAlign: 'center', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', boxSizing: 'border-box' }}>
              <p style={{ fontSize: '16px', lineHeight: '1.6', margin: 0 }}>Ready to check the environmental impact? <br/><br/><strong>Press the button and align barcode within frame.</strong></p>
            </div>
            <button onClick={startScanning} style={{ width: '100px', height: '100px', background: 'white', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', animation: 'pulse 2s infinite' }}>
              <span style={{ transform: 'translateY(-2px)' }}>📷</span>
            </button>
          </div>
        )}

       {/* 2. LOADING STATE */}
{loading && (
  <div style={{ 
    width: '100%', 
    height: '100%', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    background: '#fff', 
    gap: '30px', 
    padding: '20px', 
    boxSizing: 'border-box' 
  }}>
    <div style={{ fontSize: '60px', animation: 'spin 2s linear infinite' }}>🍃</div>
    <h2 style={{ color: '#333', margin: 0, fontWeight: '600' }}>Analyzing...</h2>
    
    <div style={{ 
      width: '100%', 
      maxWidth: '400px', 
      padding: '30px', 
      background: '#f9f9f9', 
      borderRadius: '30px', 
      textAlign: 'center', 
      boxSizing: 'border-box',
      boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
    }}>
      <p style={{ 
        fontSize: '12px', 
        color: '#4a6d53', 
        fontWeight: 'bold', 
        marginBottom: '10px', 
        letterSpacing: '1px' 
      }}>ECO TIP</p>
      
      {/* THE FUN FOOD FACT / ECO TIP IN BLACK */}
      <p style={{ 
        margin: 0, 
        color: '#000',           // Explicitly set to Black
        fontSize: '18px', 
        lineHeight: '1.5',
        fontWeight: '500'
      }}>
        "{currentTip}"
      </p>
    </div>
  </div>
)}

        {/* 3. MAIN RESULTS VIEW */}
        {view === 'results' && productData && (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#fff', opacity: opacity, transform: `translateY(${opacity === 1 ? '0px' : '30px'})`, transition: 'opacity 0.8s ease-out, transform 0.6s ease-out' }}>
            <div style={{ padding: '20px 30px 10px', textAlign: 'center' }}>
              <h2 style={{ margin: 0, color: '#333', fontSize: '22px' }}>{productData.name}</h2>
              <p style={{ color: '#888', marginTop: '4px', fontSize: '14px' }}>{productData.brand}</p>
            </div>
            
            <div style={{ flex: 1, padding: '0 30px', overflowY: 'auto' }}>
              <div style={{ width: '160px', height: '160px', borderRadius: '50%', margin: '20px auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: `10px solid ${getScoreColor(productData.score)}`, boxShadow: `0 10px 25px ${getScoreColor(productData.score)}33` }}>
                <div style={{ fontSize: '48px', fontWeight: '900', color: '#333' }}>{productData.score}</div>
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: getScoreColor(productData.score) }}>GRADE {productData.grade}</div>
              </div>

              <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                {productData.top_factors?.map((item, i) => {
                  const text = typeof item === 'object' ? item.factor : item;
                  const s = getFactorStyles(text);
                  return (
                    <div key={i} style={{ padding: '14px 18px', background: s.bg, borderRadius: '18px', marginBottom: '10px', display: 'flex', alignItems: 'center', color: s.text, border: '1px solid rgba(0,0,0,0.02)' }}>
                      <span style={{ marginRight: '12px', fontSize: '20px' }}>{s.icon}</span> 
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>{text}</span>
                    </div>
                  );
                })}

                {productData.advanced_data_available && (
                  <button 
                    onClick={() => setView('metrics')}
                    style={{ width: '100%', padding: '15px', background: '#f0f7f2', color: '#4a6d53', border: '2px dashed #4a6d53', borderRadius: '18px', fontWeight: 'bold', marginTop: '5px', cursor: 'pointer' }}
                  >
                    📊 View Detailed Metrics
                  </button>
                )}
              </div>
            </div>

            <div style={{ padding: '20px 30px', width: '100%', maxWidth: '500px', margin: '0 auto', boxSizing: 'border-box' }}>
              <button onClick={resetScanner} style={{ width: '100%', padding: '18px', background: '#222', color: 'white', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}>SCAN ANOTHER</button>
            </div>
          </div>
        )}

        {/* 4. DETAILED METRICS VIEW */}
        {view === 'metrics' && productData && (
          <div style={{ width: '100%', height: '100%', background: '#fdfdfd', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 25px 15px', display: 'flex', alignItems: 'center', gap: '15px', maxWidth: '500px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
              <button onClick={() => { setView('results'); setShowBreakdown(false); }} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>←</button>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#333' }}>Environmental Impact</h2>
            </div>

            <div style={{ flex: 1, padding: '0 25px', overflowY: 'auto' }}>
              <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                <div style={{ background: '#fff', padding: '20px', borderRadius: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '20px', border: '1px solid #eee' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                    <span style={{ fontSize: '24px' }}>☁️</span>
                    <span style={{ fontWeight: 'bold', color: '#555' }}>Carbon Footprint</span>
                  </div>
                  
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#333' }}>
                    {productData.carbon_footprint?.total_kg_per_kg?.toFixed(2) || 0} <span style={{ fontSize: '16px', fontWeight: '400' }}>kg CO2e</span>
                  </div>

                  <div style={{ marginTop: '15px', padding: '12px', background: '#f5f7ff', borderRadius: '12px', fontSize: '13px', color: '#4a5568' }}>
                    🚗 Equivalent to driving a car for <strong>{((productData.carbon_footprint?.total_kg_per_kg || 0) / 0.4).toFixed(1)} miles</strong>.
                  </div>

                  <button 
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    style={{ width: '100%', marginTop: '15px', padding: '10px 0', background: 'none', border: 'none', borderTop: '1px solid #eee', color: '#4a6d53', fontWeight: '600', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }}
                  >
                    {showBreakdown ? 'Hide Details ▲' : 'Show CO2 Breakdown ▼'}
                  </button>

                  {showBreakdown && (
                    <div style={{ marginTop: '10px', padding: '10px', background: '#fafafa', borderRadius: '12px', border: '1px solid #f0f0f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                        <span style={{ color: '#666' }}>🚜 Agriculture</span>
                        <span style={{ fontWeight: 'bold' }}>{productData.carbon_footprint?.agriculture_kg?.toFixed(3) || 0} kg</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                        <span style={{ color: '#666' }}>📦 Packaging</span>
                        <span style={{ fontWeight: 'bold' }}>{productData.carbon_footprint?.packaging_kg?.toFixed(3) || 0} kg</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                        <span style={{ color: '#666' }}>🚛 Transportation</span>
                        <span style={{ fontWeight: 'bold' }}>{productData.carbon_footprint?.transportation_kg?.toFixed(3) || 0} kg</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', paddingTop: '8px', borderTop: '1px dashed #ddd' }}>
                        <span style={{ color: '#666' }}>🔍 Other Factors</span>
                        <span style={{ fontWeight: 'bold' }}>
                          {Math.max(0, (
                            (productData.carbon_footprint?.total_kg_per_kg || 0) - 
                            ((productData.carbon_footprint?.agriculture_kg || 0) + 
                             (productData.carbon_footprint?.packaging_kg || 0) + 
                             (productData.carbon_footprint?.transportation_kg || 0))
                          )).toFixed(3)} kg
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ padding: '20px 30px', width: '100%', maxWidth: '500px', margin: '0 auto', boxSizing: 'border-box' }}>
              <button onClick={resetScanner} style={{ width: '100%', padding: '18px', background: '#222', color: 'white', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}>SCAN ANOTHER</button>
            </div>
          </div>
        )}

        {scanning && <div id="scanner-container" style={{ width: '100%', height: '100%', background: '#000', position: 'absolute', top: 0, left: 0 }} />}

        {error && (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', padding: '20px' }}>
            <div style={{ fontSize: '60px', marginBottom: '20px' }}>🔎</div>
            <h2 style={{ color: '#333', textAlign: 'center' }}>{error}</h2>
            <p style={{ color: '#999' }}>Returning to Home...</p>
          </div>
        )}
        
        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
          ::-webkit-scrollbar { width: 0px; background: transparent; }
        `}</style>
      </div>
    </div>
  );
}

export default BarcodeScanner;