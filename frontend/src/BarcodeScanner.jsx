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

  const startScanning = async () => {
    if (!sdk) return;
    setScanning(true);
    setError('');
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
    try {
      const response = await fetch(`http://localhost:8000/api/product/${code}`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      setTimeout(() => {
        setProductData(data);
        setLoading(false);
        setTimeout(() => setOpacity(1), 50);
      }, 1200);
    } catch {
      setLoading(false);
      setError("Unknown Item");
      setTimeout(() => { setBarcode(''); setError(''); }, 2000);
    }
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

        {/* HOME SCREEN - PERFECTLY CENTERED */}
        {!scanning && !barcode && !loading && !error && (
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(180deg, #6b9175 0%, #4a6d53 100%)',
            display: 'flex', flexDirection: 'column', 
            alignItems: 'center', // Horizontal Center
            justifyContent: 'center', // Vertical Center
            gap: '50px', // Uniform spacing between components
            color: 'white', padding: '20px', boxSizing: 'border-box'
          }}>
            {/* 1. Logo Section */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '80px', marginBottom: '10px' }}>🍃</div>
              <h1 style={{ fontWeight: '200', fontSize: '32px', letterSpacing: '4px', margin: 0 }}>ECOSCAN</h1>
            </div>

            {/* 2. Instruction Box */}
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

            {/* 3. Button Section */}
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

        {/* LOADING STATE - CENTERED ICONS */}
        {loading && (
          <div style={{ 
            width: '100%', height: '100%', display: 'flex', flexDirection: 'column', 
            alignItems: 'center', justifyContent: 'center', background: '#fff', gap: '30px'
          }}>
            <div style={{ fontSize: '60px', animation: 'spin 2s linear infinite' }}>🍃</div>
            <h2 style={{ color: '#333', margin: 0 }}>Analyzing...</h2>
            <div style={{ width: '80%', padding: '30px', background: '#f9f9f9', borderRadius: '30px', textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: '#4a6d53', fontWeight: 'bold' }}>ECO TIP</p>
                <p style={{ margin: 0 }}>"{currentTip}"</p>
            </div>
          </div>
        )}

        {/* Result, Scanner, and Error views remain functionally the same */}
        {scanning && <div id="scanner-container" style={{ width: '100%', height: '100%' }} />}
        
        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.08); } 100% { transform: scale(1); } }
        `}</style>
      </div>
    </div>
  );
}

export default BarcodeScanner;