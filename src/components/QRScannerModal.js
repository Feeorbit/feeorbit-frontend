'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

export default function QRScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [errorMessage, setErrorMessage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);
  const qrRegionId = 'html5qr-code-full-region';

  useEffect(() => {
    if (!isOpen) return;

    let html5QrCode = null;

    const startScanner = async () => {
      setErrorMessage(null);
      try {
        html5QrCode = new Html5Qrcode(qrRegionId);
        scannerRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        await html5QrCode.start(
          { facingMode: 'environment' }, // Prefer rear/back camera on phones
          config,
          (decodedText) => {
            // Successful scan
            if (html5QrCode && html5QrCode.isScanning) {
              html5QrCode.stop().then(() => {
                onScanSuccess(decodedText);
              }).catch(() => {
                onScanSuccess(decodedText);
              });
            } else {
              onScanSuccess(decodedText);
            }
          },
          (errorMessage) => {
            // Ignore frame-by-frame non-detection parse warnings
          }
        );
        setIsScanning(true);
      } catch (err) {
        console.error('QR Scanner init error:', err);
        setErrorMessage(
          err?.message || 'Unable to access device camera. Please check camera permissions or use manual entry.'
        );
        setIsScanning(false);
      }
    };

    // Small delay to ensure modal DOM is mounted
    const timer = setTimeout(() => {
      startScanner();
    }, 200);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current.clear())
          .catch((err) => console.log('Scanner cleanup:', err));
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <style>{`
        @keyframes scanLaser {
          0% { top: 10%; opacity: 0.8; }
          50% { top: 90%; opacity: 1; }
          100% { top: 10%; opacity: 0.8; }
        }
        #${qrRegionId} video {
          border-radius: 12px;
          object-fit: cover !important;
          width: 100% !important;
        }
        #${qrRegionId} img {
          display: none !important;
        }
      `}</style>

      <div
        className="modal-content"
        style={{
          maxWidth: '420px',
          width: '95%',
          background: '#0e1424',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px rgba(0,0,0,0.8)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Camera size={18} color="var(--brand-primary)" />
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
              Scan Reception QR Standee
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scanner Viewport */}
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Point your mobile camera directly at the gym's reception QR code poster.
          </p>

          <div
            style={{
              position: 'relative',
              width: '100%',
              minHeight: '280px',
              background: '#070a12',
              borderRadius: '14px',
              overflow: 'hidden',
              border: '2px solid rgba(99, 102, 241, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div id={qrRegionId} style={{ width: '100%' }} />

            {/* Scanning Laser Line Overlay */}
            {isScanning && !errorMessage && (
              <div
                style={{
                  position: 'absolute',
                  left: '15%',
                  right: '15%',
                  height: '3px',
                  background: 'linear-gradient(90deg, transparent, #38bdf8, #6366f1, transparent)',
                  boxShadow: '0 0 12px #38bdf8, 0 0 20px #6366f1',
                  animation: 'scanLaser 2.2s ease-in-out infinite',
                  pointerEvents: 'none',
                  zIndex: 10,
                }}
              />
            )}

            {/* Error Message */}
            {errorMessage && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px',
                  background: 'rgba(14, 20, 36, 0.95)',
                  color: '#f87171',
                  fontSize: '0.85rem',
                  gap: '8px',
                  zIndex: 20,
                }}
              >
                <AlertCircle size={28} />
                <div style={{ fontWeight: 600 }}>Camera Access Required</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  {errorMessage}
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              marginTop: '12px',
            }}
          >
            <Sparkles size={12} color="var(--brand-cyan)" />
            <span>Align QR code within the square frame to check in/out</span>
          </div>
        </div>
      </div>
    </div>
  );
}
