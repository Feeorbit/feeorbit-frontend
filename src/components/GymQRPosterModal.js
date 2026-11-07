'use client';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Printer,
  Download,
  Sparkles,
  ShieldCheck,
  QrCode,
  Building,
  Phone,
  MapPin,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';

export default function GymQRPosterModal({ gymId, onClose }) {
  const [gymData, setGymData] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloadingPoster, setDownloadingPoster] = useState(false);
  const posterRef = useRef(null);

  useEffect(() => {
    const fetchGymQR = async () => {
      try {
        const id = gymId || 'default';
        const res = await fetch(`/api/attendance/gym-qr/${id}`);
        const data = await res.json();
        if (data.success && data.gym) {
          setGymData(data.gym);

          // Generate high-resolution QR data URL (500x500 px with highest error correction)
          const targetUrl =
            typeof window !== 'undefined'
              ? `${window.location.origin}/scan?gym=${data.gym._id}`
              : data.gym.scanUrl;

          const url = await QRCode.toDataURL(targetUrl, {
            width: 500,
            margin: 2,
            color: {
              dark: '#0b0f19',
              light: '#ffffff',
            },
            errorCorrectionLevel: 'H',
          });
          setQrDataUrl(url);
        }
      } catch (err) {
        console.error('Error fetching gym QR details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGymQR();
  }, [gymId]);

  const handlePrint = () => {
    document.body.classList.add('printing-modal-open');
    window.print();
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

  // 1. Download Just the High-Resolution QR Code (PNG)
  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `${(gymData?.name || 'gym').replace(/\s+/g, '_')}_attendance_qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 2. Download Full Printable Standee Poster (High-Res 1200x1600 Canvas PNG)
  const handleDownloadPoster = () => {
    if (!qrDataUrl) return;
    setDownloadingPoster(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1600;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setDownloadingPoster(false);
        return;
      }

      // 1. Solid White Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Decorative Outer Border
      ctx.lineWidth = 14;
      ctx.strokeStyle = '#6366f1';
      ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);

      // 3. Official Front-Desk Standee Pill Badge
      ctx.fillStyle = '#6366f1';
      ctx.beginPath();
      ctx.roundRect(380, 75, 440, 52, 26);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('OFFICIAL ATTENDANCE STANDEE', 600, 109);

      // 4. Gym Name & Tagline
      ctx.fillStyle = '#0f172a';
      ctx.font = '900 48px system-ui, -apple-system, sans-serif';
      ctx.fillText(gymData?.name || 'FeeOrbit Fitness Club', 600, 195);

      ctx.fillStyle = '#64748b';
      ctx.font = '600 24px system-ui, -apple-system, sans-serif';
      ctx.fillText(gymData?.tagline || 'Scan to Check-In & Check-Out', 600, 240);

      // 5. Draw QR Code Container Box & Image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Light container box
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(260, 290, 680, 680);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 4;
        ctx.strokeRect(260, 290, 680, 680);

        // QR Image
        ctx.drawImage(img, 290, 320, 620, 620);

        // Security pill
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(430, 935, 340, 42, 8);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('FEEORBIT SECURE SCAN', 600, 962);

        // 6. Instructions Box
        ctx.fillStyle = '#f1f5f9';
        ctx.beginPath();
        ctx.roundRect(140, 1030, 920, 370, 20);
        ctx.fill();

        ctx.textAlign = 'left';
        ctx.fillStyle = '#334155';
        ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
        ctx.fillText('HOW TO MARK ATTENDANCE:', 180, 1085);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
        ctx.fillText('1. Check-In:', 180, 1140);
        ctx.fillStyle = '#475569';
        ctx.font = '20px system-ui, -apple-system, sans-serif';
        ctx.fillText('Open your phone camera or web app, scan QR to start workout.', 325, 1140);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
        ctx.fillText('2. Cooldown:', 180, 1205);
        ctx.fillStyle = '#475569';
        ctx.font = '20px system-ui, -apple-system, sans-serif';
        ctx.fillText('System protects against double-taps (checkout unlocks after 5 min).', 335, 1205);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
        ctx.fillText('3. Check-Out:', 180, 1270);
        ctx.fillStyle = '#475569';
        ctx.font = '20px system-ui, -apple-system, sans-serif';
        ctx.fillText('Scan again on your way out to record workout duration.', 345, 1270);

        // 7. Footer Contact & Branding
        ctx.textAlign = 'center';
        ctx.fillStyle = '#64748b';
        ctx.font = '20px system-ui, -apple-system, sans-serif';
        const contactText = [
          gymData?.phone && `Phone: ${gymData.phone}`,
          gymData?.address,
        ]
          .filter(Boolean)
          .join('  •  ');
        if (contactText) ctx.fillText(contactText, 600, 1475);

        ctx.fillStyle = '#6366f1';
        ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
        ctx.fillText('Powered by FeeOrbit Gym OS', 600, 1520);

        // Trigger Download
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = `${(gymData?.name || 'gym').replace(/\s+/g, '_')}_standee_poster.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setDownloadingPoster(false);
      };
      img.src = qrDataUrl;
    } catch (e) {
      console.error('Error generating poster canvas:', e);
      setDownloadingPoster(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '580px',
          width: '95%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-card-solid, var(--bg-card))',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-modal, 0 25px 60px rgba(0, 0, 0, 0.4))',
          borderRadius: '16px',
          overflow: 'hidden',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header: Always Pinned with Direct Action Buttons */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)',
            flexShrink: 0,
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '7px',
                background: 'var(--brand-primary-light, rgba(99, 102, 241, 0.15))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-primary, #6366f1)',
                flexShrink: 0,
              }}
            >
              <QrCode size={16} />
            </div>
            <span
              style={{
                fontWeight: 800,
                fontSize: '0.9rem',
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Gym Attendance Standee
            </span>
          </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#94a3b8',
                borderRadius: '6px',
                cursor: 'pointer',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

        {/* Poster Scrollable Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Generating high-resolution standee QR...
            </div>
          ) : (
            <div
              ref={posterRef}
              className="printable-poster-area"
              style={{
                background: '#ffffff',
                color: '#0f172a',
                borderRadius: '16px',
                padding: '24px 20px',
                textAlign: 'center',
                boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                border: '4px solid #6366f1',
                position: 'relative',
              }}
            >
              {/* Top Accent Pill */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#6366f1',
                  color: '#ffffff',
                  padding: '4px 14px',
                  borderRadius: '20px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '12px',
                }}
              >
                <Sparkles size={13} /> Official Front-Desk Standee
              </div>

              {/* Gym Name & Tagline */}
              <h2
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 900,
                  color: '#0f172a',
                  marginBottom: '3px',
                  letterSpacing: '-0.02em',
                }}
              >
                {gymData?.name || 'FeeOrbit Fitness Club'}
              </h2>
              <p
                style={{
                  fontSize: '0.82rem',
                  color: '#64748b',
                  fontWeight: 600,
                  marginBottom: '14px',
                }}
              >
                {gymData?.tagline || 'Scan to Check-In & Check-Out'}
              </p>

              {/* QR Container Box */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '2.5px dashed #cbd5e1',
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'inline-block',
                  margin: '0 auto 10px auto',
                  position: 'relative',
                }}
              >
                {qrDataUrl && (
                  <img
                    src={qrDataUrl}
                    alt="Gym Attendance QR"
                    style={{
                      width: '210px',
                      height: '210px',
                      display: 'block',
                      borderRadius: '8px',
                    }}
                  />
                )}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#0f172a',
                    color: '#fff',
                    padding: '2px 10px',
                    borderRadius: '4px',
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                  }}
                >
                  FEEORBIT SECURE SCAN
                </div>
              </div>

              {/* Instructions */}
              <div
                style={{
                  background: '#f1f5f9',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  marginBottom: '14px',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    color: '#334155',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <ShieldCheck size={16} color="#6366f1" /> How to Mark Attendance:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem', color: '#475569' }}>
                  <div>
                    <strong style={{ color: '#0f172a' }}>1. Check-In:</strong> Open phone camera or web app, scan this QR to start workout.
                  </div>
                  <div>
                    <strong style={{ color: '#0f172a' }}>2. 5-Min Cooldown:</strong> System protects against accidental double-taps (checkout unlocks after 5 min).
                  </div>
                  <div>
                    <strong style={{ color: '#0f172a' }}>3. Check-Out:</strong> Scan again on your way out to record workout duration.
                  </div>
                </div>
              </div>

              {/* Gym Details Footer */}
              <div
                style={{
                  borderTop: '1px solid #e2e8f0',
                  paddingTop: '8px',
                  fontSize: '0.7rem',
                  color: '#64748b',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '6px',
                }}
              >
                {gymData?.phone && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Phone size={11} /> {gymData.phone}
                  </span>
                )}
                {gymData?.address && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={11} /> {gymData.address}
                  </span>
                )}
                <span style={{ fontWeight: 700, color: '#6366f1' }}>Powered by FeeOrbit</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls: Always Sticky at the Bottom */}
        <div
          className="no-print"
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: '#090e1b',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div
            style={{
              fontSize: '0.72rem',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <Printer size={13} style={{ color: '#818cf8' }} />
            <span>Ready to Print on A4 or Desk Card</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleDownloadQR}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                background: 'rgba(6, 182, 212, 0.12)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                borderRadius: '8px',
                color: '#22d3ee',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Download size={13} />
              <span>Save QR Code</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPoster}
              disabled={downloadingPoster}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                background: 'rgba(168, 85, 247, 0.15)',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                borderRadius: '8px',
                color: '#d8b4fe',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <ImageIcon size={13} />
              <span>{downloadingPoster ? 'Exporting...' : 'Download Poster (PNG)'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.45)',
                transition: 'all 0.15s ease',
              }}
            >
              <Printer size={14} />
              <span>Print Standee</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
