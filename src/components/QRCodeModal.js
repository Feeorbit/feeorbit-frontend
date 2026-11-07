'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, QrCode, Download, ShieldCheck, Orbit, Printer, CheckCircle2 } from 'lucide-react';

export default function QRCodeModal({ member, onClose }) {
  if (!member) return null;

  const [qrDataUrl, setQrDataUrl] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const generateQR = async () => {
      try {
        const payload = member.memberId || 'TF-1002';
        const url = await QRCode.toDataURL(payload, {
          width: 400,
          margin: 1,
          color: {
            dark: '#070a13',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'H',
        });
        if (isMounted) setQrDataUrl(url);
      } catch (err) {
        console.error('Failed to generate pass QR:', err);
      }
    };
    generateQR();
    return () => {
      isMounted = false;
    };
  }, [member.memberId]);

  const handlePrint = () => {
    document.body.classList.add('printing-modal-open');
    window.print();
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    setDownloading(true);
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `FeeOrbit-Pass-${member.memberId || 'VIP'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloading(false), 800);
  };

  useEffect(() => {
    const cleanup = () => {
      document.body.classList.remove('printing-modal-open');
    };
    window.addEventListener('afterprint', cleanup);
    return () => {
      window.removeEventListener('afterprint', cleanup);
      cleanup();
    };
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ padding: '12px' }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '430px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-card-solid, var(--bg-card))',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-modal, 0 30px 70px rgba(0, 0, 0, 0.5))',
          borderRadius: '20px',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="modal-header no-print"
          style={{
            flexShrink: 0,
            borderBottom: '1px solid var(--border-subtle)',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
              Official Member Digital Pass
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div
          className="modal-body"
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '12px 16px',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* Executive VIP Member Card */}
          <div
            className="digital-pass-card"
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #070a13 0%, #0d1527 38%, #162038 72%, #080d1a 100%)',
              borderRadius: '16px',
              border: '1.5px solid rgba(255, 255, 255, 0.18)',
              padding: '16px 18px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow:
                'inset 0 1px 1px 0 rgba(255, 255, 255, 0.35), inset 0 -1px 2px 0 rgba(0, 0, 0, 0.6), 0 16px 36px -10px rgba(0, 0, 0, 0.8), 0 0 25px rgba(99, 102, 241, 0.2)',
            }}
          >
            {/* Guilloché Security Pattern Watermark */}
            <svg
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                opacity: 0.08,
                pointerEvents: 'none',
              }}
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern id="modalVipPattern" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M 0 30 Q 15 0 30 30 T 60 30" fill="none" stroke="#ffffff" strokeWidth="0.8" />
                  <path d="M 0 15 Q 15 45 30 15 T 60 15" fill="none" stroke="#ffffff" strokeWidth="0.6" />
                  <circle cx="30" cy="30" r="20" fill="none" stroke="#ffffff" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#modalVipPattern)" />
            </svg>

            {/* Specular Light Sheen Overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(115deg, transparent 30%, rgba(255, 255, 255, 0.05) 45%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.04) 55%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            {/* Card Header */}
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                    borderRadius: '9999px',
                    padding: '2px 8px',
                    marginBottom: '4px',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <span
                    style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      background: '#10b981',
                      boxShadow: '0 0 6px #10b981',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.58rem',
                      fontWeight: 800,
                      color: 'rgba(255, 255, 255, 0.95)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    VIP ACCESS PASS
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '1.08rem',
                    fontWeight: 900,
                    color: '#ffffff',
                    letterSpacing: '-0.02em',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.6)',
                  }}
                >
                  {member.gymName || 'FeeOrbit Fitness Club'}
                </div>
              </div>

              {/* 24K Gold EMV Microchip + NFC */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    color: 'rgba(255, 255, 255, 0.65)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: 'rotate(90deg)',
                  }}
                  title="Contactless RFID Access"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                    <path d="M8.5 16.5a5 5 0 0 1 7 0" />
                    <path d="M5.5 13.5a9 9 0 0 1 13 0" />
                    <path d="M2.5 10.5a13 13 0 0 1 19 0" />
                  </svg>
                </div>
                <div
                  style={{
                    width: '36px',
                    height: '26px',
                    borderRadius: '5px',
                    background: 'linear-gradient(135deg, #fef08a 0%, #f59e0b 35%, #d97706 70%, #fbbf24 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.45)',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.7)',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div style={{ position: 'absolute', inset: '3px', border: '1px solid rgba(120, 53, 15, 0.65)', borderRadius: '2px' }} />
                  <div style={{ position: 'absolute', width: '100%', height: '1px', background: 'rgba(120, 53, 15, 0.65)' }} />
                  <div style={{ position: 'absolute', height: '100%', width: '1px', background: 'rgba(120, 53, 15, 0.65)' }} />
                  <div
                    style={{
                      width: '12px',
                      height: '8px',
                      borderRadius: '1px',
                      border: '1px solid rgba(120, 53, 15, 0.75)',
                      background: 'rgba(245, 158, 11, 0.55)',
                      zIndex: 1,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Member Details */}
            <div style={{ position: 'relative', zIndex: 1, marginBottom: '12px' }}>
              <div style={{ fontSize: '0.55rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                CARDHOLDER NAME
              </div>
              <div
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                  marginTop: '1px',
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.7)',
                }}
              >
                {member.fullName}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                <div>
                  <div style={{ fontSize: '0.54rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    MEMBER ID
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace', marginTop: '1px' }}>
                    {member.memberId || 'TF-1002'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.54rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    VALID THRU
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#34d399', fontFamily: 'monospace', marginTop: '1px' }}>
                    {member.endDate ? new Date(member.endDate).toLocaleDateString('en-IN') : 'ACTIVE'}
                  </div>
                </div>
              </div>
            </div>

            {/* Scannable High-Definition QR Code */}
            <div
              style={{
                position: 'relative',
                zIndex: 1,
                background: '#ffffff',
                padding: '10px 14px',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.45)',
              }}
            >
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code for ${member.memberId}`}
                  style={{ width: '130px', height: '130px', objectFit: 'contain', display: 'block' }}
                />
              ) : (
                <div style={{ width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <QrCode size={40} style={{ color: '#000', opacity: 0.3 }} />
                </div>
              )}
              <div
                style={{
                  marginTop: '4px',
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  color: '#070a13',
                  letterSpacing: '0.1em',
                }}
              >
                {member.memberId || 'TF-1002'}
              </div>
              <div style={{ fontSize: '0.58rem', color: '#64748b', fontWeight: 600, marginTop: '1px' }}>
                Present at Kiosk Scanner or Turnstile
              </div>
            </div>

            {/* Bottom Security Notice */}
            <div
              style={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                marginTop: '10px',
                fontSize: '0.64rem',
                color: 'rgba(255, 255, 255, 0.7)',
              }}
            >
              <ShieldCheck size={13} style={{ color: '#10b981' }} />
              <span>Cryptographically Secured • Official Gym Entry Pass</span>
            </div>
          </div>
        </div>

        <div
          className="modal-footer no-print"
          style={{
            flexShrink: 0,
            borderTop: '1px solid var(--border-subtle)',
            padding: '12px 18px',
            display: 'flex',
            gap: '10px',
            background: 'var(--bg-card-solid, var(--bg-card))',
          }}
        >
          <button
            className="btn btn-secondary"
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '9px 14px',
              fontSize: '0.82rem',
              fontWeight: 700,
            }}
            onClick={handleDownload}
          >
            <Download size={14} />
            {downloading ? 'Saved!' : 'Save QR'}
          </button>
          <button
            className="btn btn-primary"
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '9px 14px',
              fontSize: '0.82rem',
              fontWeight: 700,
            }}
            onClick={handlePrint}
          >
            <Printer size={14} />
            Print Pass
          </button>
        </div>
      </div>
    </div>
  );
}

