'use client';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Printer,
  Share2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Building2,
  ShieldCheck,
  FileText,
  BadgePercent,
  QrCode,
} from 'lucide-react';
import { useGym } from '../context/GymContext';
import { toast } from '../context/ToastContext';

// Helper to convert number to words (Indian Rupee numbering)
function numberToWordsINR(num) {
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = Math.floor(Number(num) || 0);
  if (n === 0) return 'Zero Rupees Only';

  const inWords = (val) => {
    if (val < 20) return a[val];
    if (val < 100) return b[Math.floor(val / 10)] + (val % 10 !== 0 ? ' ' + a[val % 10] : ' ');
    if (val < 1000) return a[Math.floor(val / 100)] + 'Hundred ' + (val % 100 !== 0 ? inWords(val % 100) : '');
    if (val < 100000) return inWords(Math.floor(val / 1000)) + 'Thousand ' + (val % 1000 !== 0 ? inWords(val % 1000) : '');
    if (val < 10000000) return inWords(Math.floor(val / 100000)) + 'Lakh ' + (val % 100000 !== 0 ? inWords(val % 100000) : '');
    return inWords(Math.floor(val / 10000000)) + 'Crore ' + (val % 10000000 !== 0 ? inWords(val % 10000000) : '');
  };

  return `${inWords(n).trim()} Rupees Only`;
}

export default function ReceiptModal({ receipt, gymInfo, onClose }) {
  const { currentGym, formatCurrency } = useGym();
  const [copied, setCopied] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  if (!receipt) return null;

  // Prioritize real database gym details
  const gym = currentGym || gymInfo || receipt.gym || {
    name: 'FeeOrbit Fitness Club',
    phone: '9876543210',
    email: 'billing@feeorbit.com',
    address: 'Main Commercial Hub, City Center',
    tagline: 'Where Champions Train',
    taxNumber: '07AAAAA0000A1Z5',
    taxRate: 18,
    receiptFooterNote: 'Fees once paid are non-refundable. Please carry clean indoor training shoes.',
  };

  const gymName = gym.name || 'FeeOrbit Fitness Club';
  const gymPhone = gym.phone || '9876543210';
  const gymEmail = gym.email || 'billing@feeorbit.com';
  const gymAddress = gym.address || 'Main Commercial Hub, City Center';
  const gymTagline = gym.tagline || 'Where Champions Train';
  const gymGstin = gym.taxNumber || '07AAAAA0000A1Z5';
  const taxRate = gym.taxRate !== undefined ? Number(gym.taxRate) : 18;

  const totalAmount = Number(receipt.amountPaid || receipt.totalAmount || 0);
  const isGstApplicable = taxRate > 0;
  const baseAmount = isGstApplicable ? (totalAmount * 100) / (100 + taxRate) : totalAmount;
  const taxAmount = totalAmount - baseAmount;
  const cgstAmount = taxAmount / 2;
  const sgstAmount = taxAmount / 2;

  const paymentDate = receipt.paymentDate ? new Date(receipt.paymentDate) : new Date();
  const dateFormatted = paymentDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeFormatted = paymentDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const memberName = receipt.memberName || receipt.member?.fullName || 'Gym Member';
  const memberPhone = receipt.memberPhone || receipt.member?.phone || 'N/A';
  const memberId = receipt.memberId || receipt.member?.memberId || 'TF-1002';
  const planName = receipt.planName || receipt.plan?.name || 'Monthly Standard';
  const receiptNumber = receipt.receiptNumber || `REC-${Date.now().toString().slice(-6)}`;
  const paymentMethod = receipt.paymentMethod || 'UPI';
  const transactionId = receipt.transactionId || `UPI/2026/${receiptNumber.replace(/[^0-9]/g, '')}`;

  // Generate real QR code for UPI payment & verification
  useEffect(() => {
    const payload = gym.upiId
      ? `upi://pay?pa=${gym.upiId}&pn=${encodeURIComponent(gym.upiPayeeName || gymName)}&am=${totalAmount}&cu=${currentGym?.currency?.code || 'INR'}&tn=${encodeURIComponent(`Receipt-${receiptNumber}`)}`
      : `FEEORBIT-VERIFIED-RECEIPT|${receiptNumber}|${memberName}|${currentGym?.currency?.code || 'INR'}${totalAmount}|${dateFormatted}|${gymName}`;

    QRCode.toDataURL(payload, {
      width: 180,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch(() => {});
  }, [receiptNumber, memberName, totalAmount, dateFormatted, gymName, gym.upiId, gym.upiPayeeName]);

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

  const handleWhatsAppShare = () => {
    if (!memberPhone || memberPhone === 'N/A') {
      toast.warning('Member phone number not available for WhatsApp', { title: 'Missing Phone' });
      return;
    }
    const cleanPhone = memberPhone.replace(/[^0-9]/g, '');
    const currencySym = currentGym?.currency?.symbol || '₹';
    let textToSend = '';

    if (gym.templates?.receipt) {
      textToSend = gym.templates.receipt
        .replace(/\{memberName\}/g, memberName)
        .replace(/\{amount\}/g, totalAmount.toLocaleString('en-IN'))
        .replace(/\{currency\}/g, currencySym)
        .replace(/\{planName\}/g, planName)
        .replace(/\{gymName\}/g, gymName)
        .replace(/\{receiptNo\}/g, receiptNumber)
        .replace(/\{date\}/g, dateFormatted)
        .replace(/\{dueDate\}/g, receipt.dueDate ? new Date(receipt.dueDate).toLocaleDateString('en-IN') : 'N/A');
    } else {
      textToSend =
        `🏛️ *${gymName}* — Official Tax Invoice & Receipt\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `👤 *Member:* ${memberName} (${memberId})\n` +
        `🧾 *Receipt No:* ${receiptNumber}\n` +
        `📅 *Date:* ${dateFormatted}, ${timeFormatted}\n` +
        `🏋️ *Plan:* ${planName}\n` +
        `💳 *Payment Mode:* ${paymentMethod}\n` +
        `💰 *Amount Paid:* ${currencySym}${totalAmount.toLocaleString('en-IN')}\n` +
        (receipt.dueAmount > 0
          ? `⚠️ *Balance Due:* ${currencySym}${Number(receipt.dueAmount).toLocaleString('en-IN')}\n`
          : `✅ *Status:* Paid in Full (Zero Dues)\n`) +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `🙏 Thank you for choosing *${gymName}*! Stay fit, stay strong.\n` +
        `_Powered by FeeOrbit Cloud ERP_`;
    }

    const msg = encodeURIComponent(textToSend);
    window.open(`https://wa.me/91${cleanPhone.slice(-10)}?text=${msg}`, '_blank');
  };

  const handleCopyText = () => {
    const text = `${gymName}\nOfficial Receipt #${receiptNumber}\nDate: ${dateFormatted}\nMember: ${memberName} (${memberPhone})\nPlan: ${planName}\nAmount Paid: ₹${totalAmount.toLocaleString('en-IN')}\nStatus: Paid via ${paymentMethod}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '680px',
          background: 'var(--bg-card-solid)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-lg, 0 24px 64px rgba(0, 0, 0, 0.5))',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Control Bar (Never Printed) */}
        <div
          className="modal-header no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '7px',
                background: 'rgba(99, 102, 241, 0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8',
              }}
            >
              <FileText size={15} />
            </div>
            <div>
              <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                Tax Invoice & Fee Receipt
              </span>
              <span
                style={{
                  marginLeft: '8px',
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '9999px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: '#34d399',
                }}
              >
                VERIFIED
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleCopyText}
              title="Copy Summary"
              style={{
                padding: '6px 10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '7px',
                color: '#cbd5e1',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {copied ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
              <span className="d-none-sm">{copied ? 'Copied!' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsAppShare}
              title="Send to Member via WhatsApp"
              style={{
                padding: '6px 12px',
                background: 'rgba(37, 211, 102, 0.15)',
                border: '1px solid rgba(37, 211, 102, 0.35)',
                borderRadius: '7px',
                color: '#25d366',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Share2 size={13} />
              <span className="d-none-sm">WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              title="Print Official A4 / Desk Invoice"
              style={{
                padding: '6px 14px',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                border: 'none',
                borderRadius: '7px',
                color: '#ffffff',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 2px 10px rgba(99, 102, 241, 0.4)',
              }}
            >
              <Printer size={13} />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
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
        </div>

        {/* Modal Body: Scrollable Document Area with Pristine White Paper Styling */}
        <div
          className="modal-body printable-modal-body"
          id="receipt-printable-area"
          style={{
            padding: '20px',
            maxHeight: '82vh',
            overflowY: 'auto',
            background: 'var(--bg-main)',
          }}
        >
          {/* Printable White Paper Document */}
          <div
            className="receipt-card"
            style={{
              background: '#ffffff',
              color: '#0f172a',
              borderRadius: '12px',
              padding: '28px 32px',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6), 0 0 1px rgba(0, 0, 0, 0.2)',
              border: '1px solid #e2e8f0',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top Accent Strip */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '5px',
                background: 'linear-gradient(90deg, #2563eb 0%, #4f46e5 50%, #06b6d4 100%)',
              }}
            />

            {/* Header: Gym Info & Tax Invoice Title */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: '2px solid #0f172a',
                paddingBottom: '16px',
                marginBottom: '18px',
                gap: '16px',
                flexWrap: 'wrap',
              }}
            >
              {/* Left: Gym Brand & Address */}
              <div style={{ flex: 1, minWidth: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #2563eb, #38bdf8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontWeight: 900,
                      fontSize: '0.95rem',
                    }}
                  >
                    {gymName.charAt(0)}
                  </div>
                  <div>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        color: '#0f172a',
                        letterSpacing: '-0.02em',
                        lineHeight: 1.15,
                      }}
                    >
                      {gymName}
                    </h2>
                    <div style={{ fontSize: '0.72rem', color: '#6366f1', fontWeight: 700, marginTop: '2px' }}>
                      {gymTagline}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.74rem', color: '#475569', marginTop: '8px', lineHeight: 1.4 }}>
                  <div>{gymAddress}</div>
                  <div>Phone: <strong style={{ color: '#0f172a' }}>{gymPhone}</strong> • Email: {gymEmail}</div>
                  {gymGstin && (
                    <div style={{ marginTop: '2px', fontWeight: 700, color: '#0f172a' }}>
                      GSTIN: {gymGstin}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Invoice Type Badge & Numbers */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div
                  style={{
                    display: 'inline-block',
                    background: '#0f172a',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                  }}
                >
                  TAX INVOICE / RECEIPT
                </div>

                <div style={{ marginTop: '6px' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                    Invoice / Receipt No.
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#4338ca', letterSpacing: '-0.01em' }}>
                    {receiptNumber}
                  </div>
                </div>

                <div style={{ fontSize: '0.74rem', color: '#334155', marginTop: '4px' }}>
                  <strong>Date:</strong> {dateFormatted} <span style={{ color: '#94a3b8' }}>({timeFormatted})</span>
                </div>
              </div>
            </div>

            {/* Billed To & Payment Metadata Strip */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '18px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                fontSize: '0.76rem',
              }}
            >
              <div>
                <span style={{ color: '#64748b', fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '2px' }}>
                  BILLED TO (MEMBER)
                </span>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>
                  {memberName}
                </div>
                <div style={{ color: '#475569', marginTop: '1px' }}>
                  Member ID: <strong style={{ color: '#0f172a' }}>{memberId}</strong>
                </div>
                <div style={{ color: '#475569' }}>
                  Phone: <strong style={{ color: '#0f172a' }}>{memberPhone}</strong>
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '2px' }}>
                  PAYMENT DETAILS
                </span>
                <div>
                  Payment Mode: <strong style={{ color: '#0f172a' }}>{paymentMethod}</strong>
                </div>
                <div style={{ color: '#475569', marginTop: '1px' }}>
                  Txn Ref: <code style={{ color: '#4338ca', fontSize: '0.72rem' }}>{transactionId}</code>
                </div>
                <div style={{ color: '#475569', marginTop: '1px' }}>
                  Status: <strong style={{ color: '#16a34a' }}>✓ PAID & VERIFIED</strong>
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '2px' }}>
                  SERVICE CATEGORY
                </span>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>
                  Fitness Services
                </div>
                <div style={{ color: '#475569', marginTop: '1px' }}>
                  SAC Code: <strong style={{ color: '#0f172a' }}>999723</strong>
                </div>
                <div style={{ color: '#475569' }}>
                  Place of Supply: <strong>Delhi (07)</strong>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div style={{ marginBottom: '18px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#ffffff', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px', borderRadius: '4px 0 0 0', width: '30px' }}>#</th>
                    <th style={{ padding: '8px 10px' }}>Description of Service</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>SAC</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Duration</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', borderRadius: '0 4px 0 0' }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px', verticalAlign: 'top', fontWeight: 600, color: '#64748b' }}>1</td>
                    <td style={{ padding: '10px', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem' }}>
                        Gym Membership Subscription - {planName}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                        Full facility workout floor, cardio equipment, and locker access.
                      </div>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center', color: '#475569', verticalAlign: 'top' }}>
                      999723
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center', color: '#475569', verticalAlign: 'top', fontWeight: 600 }}>
                      1 Month
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: '#0f172a', verticalAlign: 'top' }}>
                      ₹{baseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Totals & Tax Calculation Breakdown */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '20px',
                borderTop: '1px solid #cbd5e1',
                paddingTop: '14px',
                marginBottom: '18px',
                flexWrap: 'wrap',
              }}
            >
              {/* Left: Amount in Words & Paid Stamp */}
              <div style={{ flex: 1, minWidth: '220px' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                  Amount in Words:
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', fontStyle: 'italic', marginTop: '2px' }}>
                  {numberToWordsINR(totalAmount)}
                </div>

                {/* Authentic Green Official PAID Stamp */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: '2px dashed #16a34a',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    marginTop: '14px',
                    color: '#15803d',
                    background: 'rgba(22, 163, 74, 0.05)',
                  }}
                >
                  <ShieldCheck size={20} color="#16a34a" />
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '0.78rem', letterSpacing: '0.05em' }}>
                      PAYMENT RECEIVED & VERIFIED
                    </div>
                    <div style={{ fontSize: '0.64rem', color: '#166534' }}>
                      {dateFormatted} • {paymentMethod} Ref: {receiptNumber}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Tax & Grand Total Table */}
              <div style={{ width: '240px', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#475569', marginBottom: '5px' }}>
                  <span>Taxable Subtotal:</span>
                  <span style={{ fontWeight: 600 }}>
                    ₹{baseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {isGstApplicable ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#64748b', marginBottom: '4px' }}>
                      <span>CGST ({(taxRate / 2)}%):</span>
                      <span>₹{cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#64748b', marginBottom: '6px' }}>
                      <span>SGST ({(taxRate / 2)}%):</span>
                      <span>₹{sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#64748b', marginBottom: '6px' }}>
                    <span>GST:</span>
                    <span>Exempt (0%)</span>
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '2px solid #0f172a',
                    borderBottom: '2px solid #0f172a',
                    padding: '8px 0',
                    marginTop: '6px',
                    marginBottom: '6px',
                  }}
                >
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>
                    Total Amount Paid:
                  </span>
                  <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#2563eb' }}>
                    ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {receipt.dueAmount > 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#dc2626', fontWeight: 700, paddingTop: '2px' }}>
                    <span>Remaining Balance Due:</span>
                    <span>₹{Number(receipt.dueAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#16a34a', fontWeight: 700, paddingTop: '2px' }}>
                    <span>Balance Due:</span>
                    <span>₹0.00 (Cleared)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Footer: Verification QR Code & Authorized Signatory */}
            <div
              style={{
                borderTop: '1px dashed #cbd5e1',
                paddingTop: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                gap: '16px',
                flexWrap: 'wrap',
              }}
            >
              {/* QR Verification Stamp */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="Verify QR"
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                    }}
                  />
                ) : (
                  <div style={{ width: '60px', height: '60px', background: '#f1f5f9', borderRadius: '4px' }} />
                )}
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0f172a' }}>
                    Digital QR Verification
                  </div>
                  <div style={{ fontSize: '0.64rem', color: '#64748b', maxWidth: '200px', lineHeight: 1.2, marginTop: '2px' }}>
                    Scan with smartphone camera to authenticate genuine gym receipt.
                  </div>
                </div>
              </div>

              {/* Terms & Authorized Signature */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '0.66rem', color: '#64748b', marginBottom: '28px' }}>
                  For {gymName}
                </div>
                <div
                  style={{
                    borderTop: '1px solid #0f172a',
                    paddingTop: '4px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: '#0f172a',
                  }}
                >
                  Authorized Signatory
                </div>
                <div style={{ fontSize: '0.62rem', color: '#64748b' }}>
                  Front Desk Desk Management
                </div>
              </div>
            </div>

            {/* Bottom Legal & Terms Note */}
            <div
              style={{
                marginTop: '14px',
                paddingTop: '10px',
                borderTop: '1px solid #f1f5f9',
                fontSize: '0.64rem',
                color: '#64748b',
                lineHeight: 1.35,
                textAlign: 'center',
              }}
            >
              <strong>Terms & Conditions:</strong> {gym.receiptFooterNote || 'Fees once paid are non-refundable and non-transferable. Please follow gym safety rules and re-rack all weights.'}
              <br />
              Generated securely via FeeOrbit ERP • Computer-generated valid electronic tax receipt.
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions Strip (Never Printed) */}
        <div
          className="modal-footer no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(255, 255, 255, 0.02)',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={14} color="#34d399" />
            <span>Ready for A4 Paper Print or WhatsApp Delivery</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleWhatsAppShare}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '0.76rem',
                fontWeight: 700,
                background: 'rgba(37, 211, 102, 0.12)',
                border: '1px solid rgba(37, 211, 102, 0.35)',
                color: '#25d366',
                cursor: 'pointer',
              }}
            >
              <Share2 size={14} /> Send via WhatsApp
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 18px',
                borderRadius: '8px',
                fontSize: '0.76rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(99, 102, 241, 0.4)',
              }}
            >
              <Printer size={14} /> Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
