import { useEffect, useRef, useState } from 'react';
import ScanbotSDK from 'scanbot-web-sdk';

const LICENSE_KEY =  "iWnayRfTw+/1KWIA/+Ldm3TxVNtDew" +
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

  useEffect(() => {
    ScanbotSDK.initialize({ licenseKey: LICENSE_KEY,
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
        //   returnBarcodeImage: false,
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
    try {
        const response = await fetch(
            `https://world.openfoodfacts.org/api/v2/product/${code}.json`
        );
        const data = await response.json();

        if (data.status === 1) {
            const product = data.product;
            console.log("Product Found:", product);
            console.log("Eco-score:", product.ecoscore_grade);
            console.log("Product Name:", product.product_name);
        } else {
            console.log("Product not found for barcode:", code);
        }
    } catch (err) {
        console.error("API error:", err)
    }
  }

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Green Scanner</h1>
      
      <div
        id="scanner-container"
        style={{
          width: '100%',
          maxWidth: '500px',
          height: scanning ? '400px' : '0',
          margin: '20px auto',
        }}
      />

      {barcode && (
        <div style={{ 
          padding: '20px', 
          background: '#e7f5e7', 
          borderRadius: '8px',
          margin: '20px auto',
          maxWidth: '500px'
        }}>
          <h3>Scanned: {barcode}</h3>
        </div>
      )}

      <button
        onClick={scanning ? stopScanning : startScanning}
        disabled={!sdk}
        style={{
          padding: '15px 40px',
          fontSize: '18px',
          background: scanning ? '#dc3545' : '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      >
        {!sdk ? 'Loading...' : scanning ? 'Stop' : 'Scan Barcode'}
      </button>
    </div>
  );
}

export default BarcodeScanner;