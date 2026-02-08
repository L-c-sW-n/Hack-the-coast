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

function BarcodeScanner() {
  const [sdk, setSdk] = useState(null);
  const [barcode, setBarcode] = useState('');
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [productData, setProductData] = useState(null);
  const [view, setView] = useState('main');

  useEffect(() => {
    ScanbotSDK.initialize({
      licenseKey: LICENSE_KEY,
      enginePath: '/bundle/bin/barcode-scanner'
    })
      .then(setSdk)
      .catch(err => console.error('SDK init failed:', err));
  }, []);

  const startScanning = async () => {
    if (!sdk) return;
    setScanning(true);
    setTimeout(async () => {
      const config = {
        containerId: 'scanner-container',
        onBarcodesDetected: (result) => {
          if (result.barcodes?.[0]) {
            const code = result.barcodes[0].text;
            setBarcode(code);
            stopScanning();
            fetchProductData(code);
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
    setError('');
    try {
      const response = await fetch(`http://localhost:8000/api/product/${code}`);
      if (!response.ok) throw new Error('Product not found');
      const data = await response.json();
      setProductData(data);
    } catch (err) {
      console.error("API error:", err);
      setError("Product not found in our database.");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score < 20) return '#27ae60'; // Green
    if (score < 50) return '#f1c40f'; // Yellow
    if (score < 80) return '#e67e22'; // Orange
    return '#e74c3c'; // Red
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      minHeight: '100vh', background: '#f0f2f0', padding: '20px',
      fontFamily: '-apple-system, system-ui, sans-serif'
    }}>
      <div style={{
        width: '393px', height: '852px', position: 'relative',
        overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.3)',
        borderRadius: '50px', background: '#fff', border: '12px solid #1a1a1a'
      }}>

        {/* 1. INITIAL START SCREEN */}
        {!scanning && !barcode && (
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(180deg, #6b9175 0%, #4a6d53 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-around', color: 'white', padding: '60px 0'
          }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '70px' }}>🍃</div>
                <h1 style={{ fontWeight: '200', fontSize: '32px', letterSpacing: '3px', margin: '10px 0' }}>ECOSCAN</h1>
            </div>
            
            <div style={{
              width: '260px', height: '260px', border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '30px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(5px)'
            }}>
              <p style={{ fontSize: '16px', lineHeight: '1.5', opacity: 0.8 }}>Ready to check the environmental impact? <br/><br/><strong>Align barcode within frame.</strong></p>
            </div>

            <button onClick={startScanning} disabled={!sdk} style={{
              width: '90px', height: '90px', background: 'white',
              border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: '38px',
              boxShadow: '0 15px 30px rgba(0,0,0,0.3)', transition: '0.2s'
            }}>
              📷
            </button>
          </div>
        )}

        {/* 2. SCANNING MODE */}
        {scanning && (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <div id="scanner-container" style={{ width: '100%', height: '100%' }} />
            <button onClick={stopScanning} style={{
              position: 'absolute', bottom: '60px', left: '50%', transform: 'translateX(-50%)',
              padding: '15px 40px', background: 'rgba(255,50,50,0.8)', color: 'white',
              border: 'none', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', backdropFilter: 'blur(5px)'
            }}>
              CANCEL SCAN
            </button>
          </div>
        )}

        {/* 3. MAIN RESULTS VIEW */}
        {barcode && !scanning && view === 'main' && (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
            <div style={{ padding: '60px 30px 20px', textAlign: 'center' }}>
              <h2 style={{ margin: 0, color: '#333', fontSize: '24px', fontWeight: '700' }}>
                {loading ? 'Analyzing...' : productData?.name || 'Processing...'}
              </h2>
              <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#aaa', letterSpacing: '1px' }}>UPC: {barcode}</p>
            </div>

            <div style={{ flex: 1, padding: '0 30px', overflowY: 'auto' }}>
              {loading ? (
                <div style={{ textAlign: 'center', marginTop: '100px' }}>
                  <div style={{ fontSize: '40px', animation: 'spin 2s linear infinite' }}>⏳</div>
                  <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                </div>
              ) : productData ? (
                <div>
                  {/* PRETTY SCORE CIRCLE */}
                  <div style={{ 
                    width: '180px', height: '180px', borderRadius: '50%', 
                    margin: '40px auto', display: 'flex', flexDirection: 'column', 
                    alignItems: 'center', justifyContent: 'center',
                    border: `12px solid ${getScoreColor(productData.score)}`,
                    boxShadow: `0 10px 25px -10px ${getScoreColor(productData.score)}`
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#999' }}>IMPACT</div>
                    <div style={{ fontSize: '56px', fontWeight: '900', color: '#222', lineHeight: '1' }}>{productData.score}</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: getScoreColor(productData.score) }}>GRADE {productData.grade}</div>
                  </div>

                  <div style={{ marginTop: '40px' }}>
                    <h3 style={{ fontSize: '12px', color: '#bbb', letterSpacing: '2px', marginBottom: '15px', textTransform: 'uppercase' }}>Environmental Factors</h3>
                    {productData.top_factors?.map((item, i) => (
                      <div key={i} style={{ 
                        padding: '16px 20px', background: '#f8f9f8', borderRadius: '18px', 
                        marginBottom: '12px', fontSize: '14px', display: 'flex', alignItems: 'center',
                        color: '#444', border: '1px solid #f0f0f0'
                      }}>
                        <span style={{ marginRight: '12px', fontSize: '18px' }}>🌍</span> 
                        {typeof item === 'object' ? item.factor : item}
                      </div>
                    ))}
                  </div>

                  {productData.advanced_data_available && (
                    <button 
                      onClick={() => setView('details')}
                      style={{
                        width: '100%', marginTop: '25px', padding: '16px',
                        background: '#fff', border: `1.5px solid #4a6d53`,
                        borderRadius: '16px', color: '#4a6d53', fontWeight: 'bold', cursor: 'pointer'
                      }}
                    >
                      View Detailed Breakdown →
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#e74c3c', marginTop: '60px' }}>
                  <p>{error || "Product info unavailable."}</p>
                </div>
              )}
            </div>

            {!loading && (
              <div style={{ padding: '30px' }}>
                <button 
                  onClick={() => { setBarcode(''); setProductData(null); setError(''); }}
                  style={{
                    width: '100%', padding: '20px', background: '#222', color: 'white',
                    border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                  }}
                >
                  SCAN ANOTHER
                </button>
              </div>
            )}
          </div>
        )}

        {/* 4. DETAILS VIEW */}
        {view === 'details' && (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
            <div style={{ padding: '60px 30px 30px', background: '#4a6d53', color: 'white', borderRadius: '0 0 40px 40px' }}>
              <button onClick={() => setView('main')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 15px', borderRadius: '12px', cursor: 'pointer', marginBottom: '20px' }}>← Back</button>
              <h2 style={{ margin: 0, fontSize: '26px' }}>Deep Dive</h2>
              <p style={{ margin: '5px 0 0', opacity: 0.8 }}>Impact Breakdown</p>
            </div>

            <div style={{ flex: 1, padding: '40px 30px', overflowY: 'auto' }}>
              <div style={{ marginBottom: '30px' }}>
                <h4 style={{ color: '#4a6d53', fontSize: '18px', marginBottom: '10px' }}>Carbon & Water</h4>
                <p style={{ fontSize: '15px', color: '#666', lineHeight: '1.6' }}>
                  Analysis for <strong>{productData?.name}</strong> shows that the score of {productData?.score} is primarily driven by logistics and manufacturing overhead.
                </p>
              </div>
              
              <div style={{ background: '#f4fbf6', padding: '20px', borderRadius: '20px', borderLeft: `6px solid ${getScoreColor(productData?.score)}` }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#2d4a36', lineHeight: '1.5' }}>
                  <strong>Did you know?</strong> Lower scores (Green) indicate a smaller footprint. This product is currently rated as Grade {productData?.grade}.
                </p>
              </div>
            </div>

            <div style={{ padding: '30px' }}>
              <button onClick={() => setView('main')} style={{ width: '100%', padding: '20px', background: '#f0f2f0', color: '#4a6d53', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}>
                CLOSE DETAILS
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BarcodeScanner;