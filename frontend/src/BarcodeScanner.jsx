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
    setTimeout(async () => {
      const config = {
        containerId: 'scanner-container',
        onBarcodesDetected: (result) => {
          if (result.barcodes?.[0]) {
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
    const response = await fetch(
        `https://greenscan-backend.onrender.com/api/product/${code}`
    );

        if (!response.ok) {
            throw new Error('Product not found');
        }

        const data = await response.json();

        console.log("Name:", data.name);
        console.log("Score:", data.score);
        console.log("Grade:", data.grade);
        console.log("Top Factors:", data.top_factors);
        console.log("Advanced Data Available:", data.advanced_data_available);
        console.log("Brand:", data.brand)

            setProductData(data);
            setTimeout(() => setOpacity(1), 50)

        }
     catch (err) {
        setError(err.message || "Unable to connect. Please try again later.");
        console.error("API Error:", err)
    } finally {
      setLoading(false);
      setError("Unknown Item");
      setTimeout(() => { setBarcode(''); setError(''); }, 2200);
    }
  };

  const getScoreColor = (score) => {
    if (score < 25) return '#27ae60';
    if (score < 55) return '#f1c40f';
    if (score < 85) return '#e67e22';
    return '#e74c3c';
  };

  const getFactorStyles = (text) => {
    const lowerText = text.toLowerCase();
    let styles = { bg: '#f8f9f8', text: '#444', icon: '🌍' };
    if (lowerText.includes('beef') || lowerText.includes('meat')) styles.icon = '🥩';
    else if (lowerText.includes('palm oil')) styles.icon = '🌴';
    else if (lowerText.includes('plastic') || lowerText.includes('packaging')) styles.icon = '🥤';
    else if (lowerText.includes('local')) styles.icon = '🚜';
    else if (lowerText.includes('organic')) styles.icon = '🍏';
    else if (lowerText.includes('water')) styles.icon = '💧';

    if (lowerText.includes('high') || lowerText.includes('ultra') || lowerText.includes('heavy')) {
      styles.bg = '#fff5f5';
      styles.text = '#c53030';
    }
    return styles;
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      minHeight: '100vh', background: '#e0e0e0', padding: '20px'
    }}>
      <div style={{
        width: '393px', height: '852px', position: 'relative',
        overflow: 'hidden', borderRadius: '50px', background: '#fff', 
        border: '12px solid #1a1a1a', boxSizing: 'border-box'
      }}>

        {/* 1. HOME SCREEN */}
        {!scanning && !barcode && !loading && !error && (
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(180deg, #6b9175 0%, #4a6d53 100%)',
            display: 'flex', flexDirection: 'column', 
            alignItems: 'center', justifyContent: 'center', 
            gap: '50px', color: 'white', padding: '20px', boxSizing: 'border-box'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '80px', marginBottom: '10px' }}>🍃</div>
              <h1 style={{ fontWeight: '200', fontSize: '32px', letterSpacing: '4px', margin: 0 }}>ECOSCAN</h1>
            </div>
            <div style={{
              width: '310px', height: '280px', border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '35px', textAlign: 'center', background: 'rgba(255,255,255,0.08)', 
              backdropFilter: 'blur(10px)', boxSizing: 'border-box'
            }}>
              <p style={{ fontSize: '18px', lineHeight: '1.6', margin: 0 }}>
                Ready to check the environmental impact? <br/><br/>
                <strong>Press the button and align barcode within frame.</strong>
              </p>
            </div>
            <button onClick={startScanning} style={{
              width: '110px', height: '110px', background: 'white', border: 'none', 
              borderRadius: '50%', cursor: 'pointer', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', fontSize: '50px', 
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)', animation: 'pulse 2s infinite'
            }}>
              <span style={{ transform: 'translateY(-2px)' }}>📷</span>
            </button>
          </div>
        )}

        {/* 2. LOADING STATE */}
        {loading && (
          <div style={{ 
            width: '100%', height: '100%', display: 'flex', flexDirection: 'column', 
            alignItems: 'center', justifyContent: 'center', background: '#fff', gap: '30px'
          }}>
            <div style={{ fontSize: '60px', animation: 'spin 2s linear infinite' }}>🍃</div>
            <h2 style={{ color: '#333', margin: 0 }}>Analyzing...</h2>
            <div style={{ width: '80%', padding: '30px', background: '#f9f9f9', borderRadius: '30px', textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: '#4a6d53', fontWeight: 'bold', marginBottom: '10px' }}>ECO TIP</p>
                <p style={{ margin: 0 }}>"{currentTip}"</p>
            </div>
          </div>
        )}

        {/* 3. RESULTS VIEW (Restored to fix white screen) */}
        {barcode && !scanning && !loading && !error && (
          <div style={{ 
            width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#fff',
            opacity: opacity, transition: 'opacity 0.4s ease-out'
          }}>
            <div style={{ padding: '60px 30px 10px', textAlign: 'center' }}>
              <h2 style={{ margin: 0, color: '#333', fontSize: '24px' }}>{productData?.name || 'Product'}</h2>
            </div>
            
            <div style={{ flex: 1, padding: '0 30px', overflowY: 'auto' }}>
              <div style={{ 
                width: '180px', height: '180px', borderRadius: '50%', margin: '30px auto', 
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                border: `12px solid ${getScoreColor(productData?.score)}` 
              }}>
                <div style={{ fontSize: '56px', fontWeight: '900' }}>{productData?.score}</div>
                <div style={{ fontWeight: 'bold', color: getScoreColor(productData?.score) }}>GRADE {productData?.grade}</div>
              </div>

              {productData?.top_factors?.map((item, i) => {
                const text = typeof item === 'object' ? item.factor : item;
                const styles = getFactorStyles(text);
                return (
                  <div key={i} style={{ 
                    padding: '14px 18px', background: styles.bg, borderRadius: '16px', 
                    marginBottom: '10px', display: 'flex', alignItems: 'center', color: styles.text 
                  }}>
                    <span style={{ marginRight: '10px', fontSize: '20px' }}>{styles.icon}</span> {text}
                  </div>
                );
              })}
            </div>

            <div style={{ padding: '20px 30px 40px' }}>
              <button onClick={() => { setBarcode(''); setProductData(null); }} style={{ 
                width: '100%', padding: '20px', background: '#222', color: 'white', 
                border: 'none', borderRadius: '20px', fontWeight: 'bold' 
              }}>SCAN ANOTHER</button>
            </div>
          </div>
        )}

        {/* 4. SCANNING VIEW */}
        {scanning && (
          <div id="scanner-container" style={{ width: '100%', height: '100%', background: '#000' }} />
        )}

        {/* 5. ERROR STATE */}
        {error && (
          <div style={{ 
            width: '100%', height: '100%', display: 'flex', flexDirection: 'column', 
            alignItems: 'center', justifyContent: 'center', background: '#fff' 
          }}>
            <div style={{ fontSize: '70px', marginBottom: '20px' }}>🔎</div>
            <h2 style={{ color: '#333', fontWeight: '700' }}>{error}</h2>
            <p style={{ color: '#999' }}>Returning to Home...</p>
          </div>
        )}
        
        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.08); } 100% { transform: scale(1); } }
        `}</style>
      </div>
    </div>
  );
}

export default BarcodeScanner;