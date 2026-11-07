'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGym } from '../../context/GymContext';
import { THEME_PRESETS, applyThemeVariables } from '../../utils/themePresets';
import {
  Sliders,
  Palette,
  FileText,
  Bell,
  MessageSquare,
  Building,
  Save,
  CheckCircle2,
  Sparkles,
  DollarSign,
  Clock,
  ShieldCheck,
  Volume2,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Send,
  CheckCheck,
  QrCode,
  Tag,
  MapPin,
  Phone,
  Mail,
  Info,
  Download,
  Database,
  Instagram,
  CreditCard,
  Building2,
  Check,
  RotateCcw,
  X,
  XCircle,
  Upload,
  Trash2,
  Image as ImageIcon,
  Zap,
} from 'lucide-react';
import QRCode from 'qrcode';
import { uploadImageToCloudinary } from '../../utils/upload';
import { useLanguage } from '../../context/LanguageContext';

export default function SettingsPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('branding'); // 'branding' | 'invoicing' | 'notices' | 'templates' | 'kiosk' | 'backup'
  const [toast, setToast] = useState(null); // { type: 'success' | 'error' | 'warning', title: string, message: string }
  const [saving, setSaving] = useState(false);
  const [activeTemplateType, setActiveTemplateType] = useState('receipt'); // 'receipt' | 'dueReminder' | 'expiryAlert' | 'welcome'
  const [settingsThemeFilter, setSettingsThemeFilter] = useState('all'); // 'all' | 'light' | 'dark'

  const showToast = (type, message, title = '') => {
    setToast({ type, message, title });
    if (type === 'success') {
      setTimeout(() => {
        setToast((curr) => (curr?.message === message ? null : curr));
      }, 5000);
    }
  };
  const [receiptQrUrl, setReceiptQrUrl] = useState('');
  const [exportingType, setExportingType] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const logoFileInputRef = useRef(null);

  // Ref to active template textarea for inserting placeholders
  const templateTextareaRef = useRef(null);

  // Form states initialized from currentGym
  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    logoUrl: '',
    facilityType: 'Unisex Fitness Center & Gym',
    openingHours: 'Mon - Sat: 06:00 AM - 10:00 PM | Sun: 07:00 AM - 01:00 PM',
    phone: '',
    email: '',
    address: '',
    supportWhatsapp: '',
    instagram: '',
    website: '',
    taxNumber: '',
    taxRate: 18,
    taxLabel: 'GST',
    themePreset: 'midnight',
    primaryColor: '#6366f1',
    currencyCode: 'INR',
    currencySymbol: '₹',
    invoicePrefix: 'REC',
    enableDirectUpi: true,
    enableRazorpay: true,
    upiId: '',
    upiPayeeName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    receiptFooterNote: '',
    noticeTitle: '',
    noticeContent: '',
    noticeActive: true,
    noticePriority: 'info',
    templateWelcome: '',
    templateReceipt: '',
    templateDueReminder: '',
    templateExpiryAlert: '',
    kioskSound: true,
    kioskAutoCheckout: 2,
    kioskCooldown: 5,
    kioskWelcomeMessage: 'Welcome Champ! Have a killer workout!',
    kioskAnnouncementTicker: 'Hydrate well • Please re-rack your weights after use',
    kioskAllowMultipleCheckIns: true,
    language: 'en',
  });

  useEffect(() => {
    if (currentGym) {
      setFormData({
        name: currentGym.name || '',
        tagline: currentGym.tagline || 'Where Champions Train',
        logoUrl: currentGym.logoUrl || '',
        facilityType: currentGym.facilityType || 'Unisex Fitness Center & Gym',
        openingHours: currentGym.openingHours || 'Mon - Sat: 06:00 AM - 10:00 PM | Sun: 07:00 AM - 01:00 PM',
        phone: currentGym.phone || '',
        email: currentGym.email || '',
        address: currentGym.address || '',
        supportWhatsapp: currentGym.socialLinks?.supportWhatsapp || currentGym.phone || '',
        instagram: currentGym.socialLinks?.instagram || '',
        website: currentGym.socialLinks?.website || '',
        taxNumber: currentGym.taxNumber || '',
        taxRate: currentGym.taxRate !== undefined ? currentGym.taxRate : 18,
        taxLabel: currentGym.taxLabel || 'GST',
        themePreset: currentGym.themePreset || 'midnight',
        primaryColor:
          currentGym.primaryColor && currentGym.primaryColor !== '#a3e635'
            ? currentGym.primaryColor
            : '#6366f1',
        currencyCode: currentGym.currency?.code || 'INR',
        currencySymbol: currentGym.currency?.symbol || '₹',
        invoicePrefix: currentGym.invoicePrefix || 'REC',
        enableDirectUpi: currentGym.paymentSettings?.enableDirectUpi ?? true,
        enableRazorpay: currentGym.paymentSettings?.enableRazorpay ?? true,
        upiId: currentGym.upiId || '',
        upiPayeeName: currentGym.upiPayeeName || currentGym.name || '',
        bankName: currentGym.bankDetails?.bankName || '',
        accountNumber: currentGym.bankDetails?.accountNumber || '',
        ifscCode: currentGym.bankDetails?.ifscCode || '',
        receiptFooterNote:
          currentGym.receiptFooterNote ||
          'Thank you for training with us! Fees once paid are non-refundable. Please re-rack your weights.',
        noticeTitle: currentGym.noticeBoard?.title || 'Gym Announcements',
        noticeContent:
          currentGym.noticeBoard?.content ||
          'Welcome to our facility! Please sanitize equipment after heavy sets.',
        noticeActive: currentGym.noticeBoard?.isActive ?? true,
        noticePriority: currentGym.noticeBoard?.priority || 'info',
        templateWelcome:
          currentGym.templates?.welcome ||
          'Welcome to {gymName}, {memberName}! Your {planName} membership is now active. Let’s crush your fitness goals together!',
        templateReceipt:
          currentGym.templates?.receipt ||
          'Hi {memberName}, received payment of {currency}{amount} for {planName}. Receipt No: {receiptNo}. Thank you for choosing {gymName}!',
        templateDueReminder:
          currentGym.templates?.dueReminder ||
          'Dear {memberName}, your pending fee balance of {currency}{amount} for {planName} is due on {dueDate}. Please clear at the reception desk.',
        templateExpiryAlert:
          currentGym.templates?.expiryAlert ||
          'Hi {memberName}, your gym membership at {gymName} expires in {daysLeft} days on {expiryDate}. Renew today to continue uninterrupted access!',
        kioskSound: currentGym.kioskSettings?.soundEnabled ?? true,
        kioskAutoCheckout: currentGym.kioskSettings?.autoCheckoutHours ?? 2,
        kioskCooldown: currentGym.kioskSettings?.cooldownMinutes ?? 5,
        kioskWelcomeMessage: currentGym.kioskSettings?.welcomeMessage || 'Welcome Champ! Have a killer workout!',
        kioskAnnouncementTicker: currentGym.kioskSettings?.announcementTicker || 'Hydrate well • Please re-rack your weights after use',
        kioskAllowMultipleCheckIns: currentGym.kioskSettings?.allowMultipleCheckIns ?? true,
        language: 'en',
      });
    }
  }, [currentGym]);

  // Generate QR for Receipt preview
  useEffect(() => {
    const payload = formData.upiId
      ? `upi://pay?pa=${formData.upiId}&pn=${encodeURIComponent(formData.upiPayeeName || formData.name || 'Gym')}&am=1500&cu=${formData.currencyCode}&tn=Receipt-Preview`
      : `FEEORBIT-VERIFIED-RECEIPT|${formData.invoicePrefix}-2026-0042|Aman Verma|${formData.currencyCode}1500|${new Date().toLocaleDateString('en-IN')}|${formData.name || 'Gym'}`;

    QRCode.toDataURL(payload, {
      width: 140,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((url) => setReceiptQrUrl(url))
      .catch(() => {});
  }, [formData.upiId, formData.upiPayeeName, formData.invoicePrefix, formData.currencyCode, formData.name]);

  const colorPresets = [
    { name: 'FeeOrbit Indigo', hex: '#6366f1' },
    { name: 'Electric Sky', hex: '#0ea5e9' },
    { name: 'Emerald Green', hex: '#10b981' },
    { name: 'Royal Violet', hex: '#8b5cf6' },
    { name: 'Amber Gold', hex: '#f59e0b' },
    { name: 'Rose Crimson', hex: '#f43f5e' },
    { name: 'Teal Cyan', hex: '#06b6d4' },
  ];

  const currencyOptions = [
    { code: 'INR', symbol: '₹', label: 'Indian Rupee (₹)' },
    { code: 'USD', symbol: '$', label: 'US Dollar ($)' },
    { code: 'EUR', symbol: '€', label: 'Euro (€)' },
    { code: 'GBP', symbol: '£', label: 'British Pound (£)' },
    { code: 'AED', symbol: 'AED', label: 'UAE Dirham (AED)' },
    { code: 'CAD', symbol: 'CA$', label: 'Canadian Dollar (CA$)' },
    { code: 'AUD', symbol: 'A$', label: 'Australian Dollar (A$)' },
  ];

  const facilityTypeOptions = [
    'Unisex Fitness Center & Gym',
    'Strength & Bodybuilding Gym',
    'CrossFit Box & Functional Training',
    'Ladies Exclusive Fitness Club',
    'MMA, Boxing & Combat Arena',
    'Luxury Wellness & Health Club',
  ];

  const handleCurrencySelect = (code) => {
    const found = currencyOptions.find((c) => c.code === code);
    if (found) {
      setFormData({
        ...formData,
        currencyCode: found.code,
        currencySymbol: found.symbol,
      });
    }
  };

  const handleColorChange = (hex) => {
    setFormData((prev) => ({ ...prev, primaryColor: hex }));
    applyThemeVariables(formData.themePreset || 'midnight', hex);
  };

  const handleThemePresetSelect = async (preset) => {
    setFormData((prev) => ({
      ...prev,
      themePreset: preset.id,
      primaryColor: preset.primaryColor,
    }));
    applyThemeVariables(preset.id, preset.primaryColor);

    // Auto-save instantly so theme persists across refreshes and page navigations
    if (currentGym?._id) {
      updateCurrentGymSettings({
        themePreset: preset.id,
        primaryColor: preset.primaryColor,
      });
      showToast(
        'success',
        `Transformed to ${preset.name} atmosphere! Applied across all pages and saved.`,
        'Luxury Theme Active 🚀'
      );
    }
  };

  const uploadLogoFile = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Please select a valid image file (PNG, JPG, WEBP, SVG).', 'Invalid File');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('error', 'Image size exceeds 10MB limit. Please select a smaller file.', 'File Too Large');
      return;
    }

    setUploadingLogo(true);
    try {
      const res = await uploadImageToCloudinary(file, 'feeorbit/logos');
      setFormData((prev) => ({ ...prev, logoUrl: res.url }));
      showToast(
        'success',
        'Gym Logo uploaded successfully! Click "Save All Changes" below to save.',
        'Upload Successful! 🖼️'
      );
    } catch (err) {
      showToast(
        'error',
        err.message || 'Failed to upload logo image. Please try again.',
        'Upload Failed'
      );
    } finally {
      setUploadingLogo(false);
      if (logoFileInputRef.current) logoFileInputRef.current.value = '';
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadLogoFile(file);
  };

  const handleLogoDrop = (e) => {
    e.preventDefault();
    setIsDraggingLogo(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) uploadLogoFile(file);
  };

  const handleLogoDragOver = (e) => {
    e.preventDefault();
    setIsDraggingLogo(true);
  };

  const handleLogoDragLeave = (e) => {
    e.preventDefault();
    setIsDraggingLogo(false);
  };

  // Test Web Audio chime
  const testKioskSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  };

  // Insert template placeholder tag at cursor position
  const insertPlaceholder = (tag) => {
    let key = 'templateReceipt';
    if (activeTemplateType === 'dueReminder') key = 'templateDueReminder';
    else if (activeTemplateType === 'expiryAlert') key = 'templateExpiryAlert';
    else if (activeTemplateType === 'welcome') key = 'templateWelcome';

    const currentText = formData[key] || '';
    const textarea = templateTextareaRef.current;

    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = currentText.substring(0, start) + tag + currentText.substring(end);
      setFormData({ ...formData, [key]: newText });
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tag.length, start + tag.length);
      }, 50);
    } else {
      setFormData({ ...formData, [key]: currentText + ' ' + tag });
    }
  };

  // Compute live preview text for WhatsApp simulator
  const getSimulatedMessage = () => {
    let template = formData.templateReceipt;
    if (activeTemplateType === 'dueReminder') template = formData.templateDueReminder;
    else if (activeTemplateType === 'expiryAlert') template = formData.templateExpiryAlert;
    else if (activeTemplateType === 'welcome') template = formData.templateWelcome;

    const gymName = formData.name || 'FeeOrbit Fitness';
    let text = (template || '')
      .replace(/\{memberName\}/g, 'Aman Verma')
      .replace(/\{amount\}/g, '1500')
      .replace(/\{currency\}/g, formData.currencySymbol)
      .replace(/\{planName\}/g, 'Monthly Standard')
      .replace(/\{dueDate\}/g, '25 Sep 2026')
      .replace(/\{gymName\}/g, gymName)
      .replace(/\{receiptNo\}/g, `${formData.invoicePrefix}-2026-0042`)
      .replace(/\{daysLeft\}/g, '3')
      .replace(/\{expiryDate\}/g, '28 Sep 2026');

    if (activeTemplateType === 'dueReminder' && formData.upiId) {
      text += `\n\n💳 Direct UPI Pay: ${formData.upiId}`;
    }
    return text;
  };

  // Reset templates to FeeOrbit standard defaults
  const handleResetTemplates = () => {
    if (!confirm('Reset all message templates to standard FeeOrbit defaults?')) return;
    setFormData({
      ...formData,
      templateWelcome: 'Welcome to {gymName}, {memberName}! Your {planName} membership is now active. Let’s crush your fitness goals together!',
      templateReceipt: 'Hi {memberName}, received payment of {currency}{amount} for {planName}. Receipt No: {receiptNo}. Thank you for choosing {gymName}!',
      templateDueReminder: 'Dear {memberName}, your pending fee balance of {currency}{amount} for {planName} is due on {dueDate}. Please clear at the reception desk.',
      templateExpiryAlert: 'Hi {memberName}, your gym membership at {gymName} expires in {daysLeft} days on {expiryDate}. Renew today to continue uninterrupted access!',
    });
  };

  // Data Export Handlers
  const exportMembersCSV = async () => {
    setExportingType('members');
    try {
      const res = await fetch('/api/members?gymId=' + (currentGym?._id || ''));
      const data = await res.json();
      if (!data.success || !data.data) return alert('Failed to fetch members list.');

      const rows = [
        ['Member ID', 'Full Name', 'Phone', 'Email', 'Gender', 'Plan Name', 'Start Date', 'End Date', 'Status'],
        ...data.data.map((m) => [
          m.memberId || '',
          m.fullName || '',
          m.phone || '',
          m.email || '',
          m.gender || '',
          m.plan?.name || '',
          m.startDate ? new Date(m.startDate).toLocaleDateString('en-IN') : '',
          m.endDate ? new Date(m.endDate).toLocaleDateString('en-IN') : '',
          m.status || '',
        ]),
      ];

      const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.map((i) => `"${String(i).replace(/"/g, '""')}"`).join(',')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${(formData.name || 'gym').replace(/\s+/g, '_')}_members_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert('Error exporting members: ' + e.message);
    } finally {
      setExportingType(null);
    }
  };

  const exportPaymentsCSV = async () => {
    setExportingType('payments');
    try {
      const res = await fetch('/api/payments?gymId=' + (currentGym?._id || ''));
      const data = await res.json();
      if (!data.success || !data.data) return alert('Failed to fetch payments records.');

      const rows = [
        ['Receipt No', 'Member Name', 'Phone', 'Plan Name', 'Amount Paid', 'Total Amount', 'Due Amount', 'Payment Method', 'Transaction ID', 'Date', 'Status'],
        ...data.data.map((p) => [
          p.receiptNumber || '',
          p.memberName || p.member?.fullName || '',
          p.memberPhone || p.member?.phone || '',
          p.planName || p.plan?.name || '',
          p.amountPaid || 0,
          p.totalAmount || 0,
          p.dueAmount || 0,
          p.paymentMethod || '',
          p.transactionId || '',
          p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN') : '',
          p.status || '',
        ]),
      ];

      const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.map((i) => `"${String(i).replace(/"/g, '""')}"`).join(',')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${(formData.name || 'gym').replace(/\s+/g, '_')}_payments_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert('Error exporting payments: ' + e.message);
    } finally {
      setExportingType(null);
    }
  };

  const exportConfigJSON = () => {
    const jsonStr = JSON.stringify(formData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(formData.name || 'gym').replace(/\s+/g, '_')}_config_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();

    // 1. Client-Side Validation
    if (!formData.name || !formData.name.trim()) {
      showToast('error', 'Gym / Facility Name is required. Please provide a valid name before saving.', 'Facility Name Required');
      setActiveTab('branding');
      return;
    }

    if (!formData.phone || !formData.phone.trim()) {
      showToast('error', 'Contact Phone number is required for receipts and member communications.', 'Contact Phone Required');
      setActiveTab('branding');
      return;
    }

    setSaving(true);
    setToast(null);

    const payload = {
      name: formData.name.trim(),
      tagline: formData.tagline.trim(),
      logoUrl: formData.logoUrl.trim(),
      facilityType: formData.facilityType,
      openingHours: formData.openingHours,
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      address: formData.address.trim(),
      taxNumber: formData.taxNumber.trim(),
      taxRate: Number(formData.taxRate) || 0,
      taxLabel: formData.taxLabel.trim() || 'GST',
      primaryColor: formData.primaryColor,
      themePreset: formData.themePreset || 'midnight',
      currency: {
        code: formData.currencyCode,
        symbol: formData.currencySymbol,
      },
      invoicePrefix: formData.invoicePrefix.toUpperCase().trim() || 'REC',
      paymentSettings: {
        enableDirectUpi: formData.enableDirectUpi,
        enableRazorpay: formData.enableRazorpay,
        autoApproveDirectUpi: true,
      },
      upiId: formData.upiId.trim(),
      upiPayeeName: formData.upiPayeeName.trim(),
      bankDetails: {
        bankName: formData.bankName.trim(),
        accountNumber: formData.accountNumber.trim(),
        ifscCode: formData.ifscCode.trim(),
        accountHolder: formData.upiPayeeName.trim() || formData.name.trim(),
      },
      socialLinks: {
        supportWhatsapp: formData.supportWhatsapp.trim(),
        instagram: formData.instagram.trim(),
        website: formData.website.trim(),
      },
      receiptFooterNote: formData.receiptFooterNote.trim(),
      noticeBoard: {
        title: formData.noticeTitle.trim(),
        content: formData.noticeContent.trim(),
        isActive: formData.noticeActive,
        priority: formData.noticePriority,
      },
      templates: {
        welcome: formData.templateWelcome,
        receipt: formData.templateReceipt,
        dueReminder: formData.templateDueReminder,
        expiryAlert: formData.templateExpiryAlert,
      },
      kioskSettings: {
        soundEnabled: formData.kioskSound,
        autoCheckoutHours: Number(formData.kioskAutoCheckout) || 2,
        cooldownMinutes: Number(formData.kioskCooldown) || 5,
        welcomeMessage: formData.kioskWelcomeMessage,
        announcementTicker: formData.kioskAnnouncementTicker,
        allowMultipleCheckIns: formData.kioskAllowMultipleCheckIns,
      },
      language: 'en',
    };

    const res = await updateCurrentGymSettings(payload);
    setSaving(false);

    const isOk = (res && typeof res === 'object') ? res.success : Boolean(res);
    if (isOk) {
      showToast(
        'success',
        'All white-label settings, full-site theme atmosphere, brand accent theme, custom receipt prefixes, notice banners, and WhatsApp templates have been applied across FeeOrbit.',
        'Changes Saved Successfully! 🚀'
      );
      applyThemeVariables(formData.themePreset || 'midnight', formData.primaryColor);
    } else {
      const errMsg = (res && res.message) ? res.message : 'Unable to save gym settings. Please check your inputs and verify server connection.';
      showToast('error', errMsg, 'Failed to Save Settings');
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '50px' }}>
      {/* 1. HERO BANNER: Compact 96px Height matching FeeOrbit Aesthetics */}
      <div className="hero-banner-container" style={{ marginBottom: '14px' }}>
        <div className="hero-banner-left">
          <h1
            style={{
              fontSize: '1.28rem',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              lineHeight: 1.15,
            }}
          >
            FeeOrbit Settings & White-Label CMS ⚙️
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.74rem', marginTop: '3px', marginBottom: '8px' }}>
            Customize your brand identity, dynamic theme accent, invoice rules, UPI scan-to-pay & WhatsApp automations.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.09)',
                borderRadius: '5px',
                fontSize: '0.68rem',
                color: 'var(--text-secondary)',
                fontWeight: 600,
              }}
            >
              <Building2 size={11} style={{ color: '#94a3b8' }} />
              {formData.name || currentGym?.name || 'Active Gym'}
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 8px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.28)',
                borderRadius: '5px',
                fontSize: '0.68rem',
                color: '#34d399',
                fontWeight: 700,
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
              Live CMS Active
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                borderRadius: '5px',
                fontSize: '0.68rem',
                color: '#a5b4fc',
                fontWeight: 800,
              }}
            >
              <Tag size={11} />
              Currency: {formData.currencySymbol} ({formData.currencyCode})
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                background: `${formData.primaryColor}22`,
                border: `1px solid ${formData.primaryColor}66`,
                borderRadius: '5px',
                fontSize: '0.68rem',
                color: '#ffffff',
                fontWeight: 700,
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: formData.primaryColor }} />
              Theme: {formData.primaryColor}
            </div>
          </div>
        </div>

        {/* Right Side: Photo Banner with Quote */}
        <div className="hero-banner-right">
          <div className="hero-banner-overlay" />
          <div className="hero-banner-quote" style={{ position: 'relative', zIndex: 3, maxWidth: '290px' }}>
            <div
              style={{
                fontStyle: 'italic',
                fontSize: '0.88rem',
                fontWeight: 600,
                color: '#f1f5f9',
                lineHeight: 1.3,
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.95)',
              }}
            >
              &ldquo;Crafting Distinct Brand Identity for Modern Fitness Hubs&rdquo;
            </div>
            <div
              style={{
                fontSize: '0.66rem',
                fontWeight: 600,
                color: '#94a3b8',
                marginTop: '3px',
                textShadow: '0 1px 4px rgba(0, 0, 0, 0.95)',
              }}
            >
              — FeeOrbit White-Label CMS
            </div>
          </div>
        </div>
      </div>

      {/* Top Action & Save Bar */}
      <div
        className="responsive-top-action-bar"
        style={{
          marginBottom: '14px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '8px 14px',
        }}
      >
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          Configuring settings for: <strong style={{ color: 'var(--text-primary)' }}>{formData.name || 'FeeOrbit Gym'}</strong>
        </span>

        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={saving}
          className="btn btn-primary btn-sm"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 16px',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {saving ? (
            <>
              <RefreshCw size={14} className="spinning" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save size={15} />
              <span>Save All Changes</span>
            </>
          )}
        </button>
      </div>

      {/* Toast Notification Banner (Success / Error / Warning) */}
      {toast && (
        <div
          style={{
            background:
              toast.type === 'success'
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(5, 150, 105, 0.32) 100%)'
                : toast.type === 'warning'
                ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(180, 83, 9, 0.32) 100%)'
                : 'linear-gradient(135deg, rgba(239, 68, 68, 0.22) 0%, rgba(185, 28, 28, 0.32) 100%)',
            border:
              toast.type === 'success'
                ? '1.5px solid #10b981'
                : toast.type === 'warning'
                ? '1.5px solid #f59e0b'
                : '1.5px solid #ef4444',
            borderRadius: '12px',
            padding: '14px 18px',
            color: toast.type === 'success' ? '#6ee7b7' : toast.type === 'warning' ? '#fde68a' : '#fca5a5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            marginBottom: '16px',
            fontSize: '0.84rem',
            boxShadow:
              toast.type === 'success'
                ? '0 8px 32px rgba(16, 185, 129, 0.28)'
                : toast.type === 'warning'
                ? '0 8px 32px rgba(245, 158, 11, 0.28)'
                : '0 8px 32px rgba(239, 68, 68, 0.28)',
            animation: 'fadeIn 0.25s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {toast.type === 'success' ? (
              <CheckCircle2 size={22} style={{ color: '#10b981', flexShrink: 0 }} />
            ) : toast.type === 'warning' ? (
              <AlertTriangle size={22} style={{ color: '#f59e0b', flexShrink: 0 }} />
            ) : (
              <XCircle size={22} style={{ color: '#ef4444', flexShrink: 0 }} />
            )}
            <div>
              {toast.title && (
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#ffffff', marginBottom: '2px' }}>
                  {toast.title}
                </div>
              )}
              <div style={{ lineHeight: 1.4 }}>{toast.message}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setToast(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#cbd5e1')}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Navigation Tabs (6 Tabs) */}
      <div
        className="responsive-tabs-bar"
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '10px',
          marginBottom: '20px',
        }}
      >
        {[
          { id: 'branding', label: t('tab_branding', 'Branding & Profile'), icon: Palette },
          { id: 'invoicing', label: t('tab_invoicing', 'Receipts & UPI Payments'), icon: FileText },
          { id: 'notices', label: t('tab_notices', 'Public Notice Board'), icon: Bell },
          { id: 'templates', label: t('tab_templates', 'Message Templates CMS'), icon: MessageSquare },
          { id: 'kiosk', label: t('tab_kiosk', 'Kiosk & Automation'), icon: QrCode },
          { id: 'backup', label: t('tab_backup', 'Data Backup & Export'), icon: Download },
        ].map((tab) => {
          const isCurrent = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="responsive-tab-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: isCurrent ? 700 : 500,
                cursor: 'pointer',
                background: isCurrent ? 'linear-gradient(135deg, #4f46e5, #06b6d4)' : 'var(--bg-card-solid)',
                border: isCurrent ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid var(--border-subtle)',
                color: isCurrent ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: BRANDING & PROFILE */}
      {activeTab === 'branding' && (
        <div className="responsive-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '20px' }}>
          {/* Gym Details Card */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '20px',
              boxShadow: 'var(--shadow-card, 0 4px 20px rgba(0, 0, 0, 0.08))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#818cf8',
                }}
              >
                <Building size={16} />
              </div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Gym Profile Information
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Gym / Facility Name *
                  </label>
                  {currentGym?.name && formData.name !== currentGym.name && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, name: currentGym.name })}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#818cf8',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline',
                      }}
                    >
                      Restore &quot;{currentGym.name}&quot;
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="e.g. Phoenix Elite Fitness"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--bg-input, var(--bg-card-solid))',
                    border: (!formData.name.trim() && toast?.type === 'error') ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    outline: 'none',
                  }}
                />
                {!formData.name.trim() && (
                  <span style={{ fontSize: '0.68rem', color: '#f87171', marginTop: '4px', display: 'block' }}>
                    * Facility Name is required to save branding and generate receipts.
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  Tagline / Motto
                </label>
                <input
                  type="text"
                  placeholder="e.g. Where Champions Train"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--bg-input, var(--bg-card-solid))',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    <ImageIcon size={15} style={{ color: formData.primaryColor || '#818cf8' }} />
                    Gym Logo (Direct Image Upload)
                  </label>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8', background: 'rgba(255, 255, 255, 0.04)', padding: '2px 8px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                    PNG, JPG, WEBP, SVG • Max 10MB
                  </span>
                </div>

                {/* Hidden File Input */}
                <input
                  ref={logoFileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/svg+xml"
                  onChange={handleLogoUpload}
                  style={{ display: 'none' }}
                />

                {/* Main Logo Card / Drag & Drop Zone */}
                {formData.logoUrl ? (
                  /* State A: Logo already present -> Visual Showcase Card with Change & Remove */
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '14px',
                      padding: '12px 14px',
                      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, var(--bg-card-solid) 100%)',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                      borderRadius: '12px',
                    }}
                  >
                    {/* Left: Thumbnail & Status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '58px',
                          height: '58px',
                          borderRadius: '10px',
                          background: 'var(--bg-input, var(--bg-card-solid))',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          padding: '4px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={formData.logoUrl}
                          alt="Gym Logo"
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Current Gym Logo
                          </span>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: '0.66rem',
                              fontWeight: 700,
                              color: '#34d399',
                              background: 'rgba(52, 211, 153, 0.12)',
                              padding: '1px 6px',
                              borderRadius: '10px',
                              border: '1px solid rgba(52, 211, 153, 0.25)',
                            }}
                          >
                            <Check size={10} /> Active & Synced
                          </span>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>
                          Displayed on sidebar header, tax receipts, and member passes.
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <button
                        type="button"
                        disabled={uploadingLogo}
                        onClick={() => logoFileInputRef.current?.click()}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 12px',
                          borderRadius: '8px',
                          background: 'rgba(99, 102, 241, 0.2)',
                          border: '1px solid rgba(99, 102, 241, 0.4)',
                          color: '#c7d2fe',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: uploadingLogo ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {uploadingLogo ? (
                          <>
                            <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload size={13} />
                            <span>Change Image</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, logoUrl: '' });
                          showToast('info', 'Gym logo removed. Click "Save All Changes" to persist.', 'Logo Removed');
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '7px 10px',
                          borderRadius: '8px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          color: '#fca5a5',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        title="Remove Logo"
                      >
                        <Trash2 size={13} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* State B: No Logo yet -> Sleek Drag & Drop Zone + Native Upload Button */
                  <div
                    onDragOver={handleLogoDragOver}
                    onDragLeave={handleLogoDragLeave}
                    onDrop={handleLogoDrop}
                    onClick={() => !uploadingLogo && logoFileInputRef.current?.click()}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '24px 16px',
                      borderRadius: '12px',
                      border: isDraggingLogo
                        ? '2px dashed var(--brand-primary, #818cf8)'
                        : '2px dashed var(--border-subtle, rgba(99, 102, 241, 0.4))',
                      background: isDraggingLogo
                        ? 'var(--brand-primary-light, rgba(99, 102, 241, 0.15))'
                        : 'var(--bg-card, rgba(99, 102, 241, 0.03))',
                      cursor: uploadingLogo ? 'wait' : 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'center',
                    }}
                  >
                    {uploadingLogo ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <RefreshCw size={26} style={{ color: '#818cf8', animation: 'spin 1s linear infinite' }} />
                        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          Uploading Logo to Cloud...
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                          Please wait while your brand image is uploaded and optimized.
                        </span>
                      </div>
                    ) : (
                      <>
                        <div
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            background: 'rgba(99, 102, 241, 0.12)',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#818cf8',
                            marginBottom: '10px',
                          }}
                        >
                          <Upload size={20} />
                        </div>
                        <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' }}>
                          Click to browse image or drag & drop here
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '12px' }}>
                          Choose your high-resolution gym logo directly from your device
                        </div>
                        <button
                          type="button"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 14px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                            border: 'none',
                            color: '#ffffff',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 2px 10px rgba(99, 102, 241, 0.4)',
                            pointerEvents: 'none',
                          }}
                        >
                          <Upload size={13} />
                          <span>Choose Image File</span>
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Collapsible advanced option for manual URL pasting if ever desired */}
                <details style={{ marginTop: '8px' }}>
                  <summary
                    style={{
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                      color: '#64748b',
                      userSelect: 'none',
                    }}
                  >
                    Advanced: Or enter image URL manually
                  </summary>
                  <div style={{ marginTop: '6px', display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={formData.logoUrl}
                      onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        background: 'var(--bg-input, var(--bg-card-solid))',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        fontSize: '0.76rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                </details>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  Facility Category / Type
                </label>
                <select
                  value={formData.facilityType}
                  onChange={(e) => setFormData({ ...formData, facilityType: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--bg-input, var(--bg-card-solid))',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    outline: 'none',
                  }}
                >
                  {facilityTypeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="responsive-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                    Contact Phone *
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-input, var(--bg-card-solid))',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-input, var(--bg-card-solid))',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  Address / Facility Location
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--bg-input, var(--bg-card-solid))',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Social Channels & Helpdesk */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#a5b4fc', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Social Channels & Member Helpdesk
                </div>
                <div className="responsive-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>
                      Support WhatsApp No.
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 9876500011"
                      value={formData.supportWhatsapp}
                      onChange={(e) => setFormData({ ...formData, supportWhatsapp: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        background: 'var(--bg-input, var(--bg-card-solid))',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        fontSize: '0.78rem',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>
                      Instagram Handle
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. @fitnessclub"
                      value={formData.instagram}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        background: 'var(--bg-input, var(--bg-card-solid))',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        fontSize: '0.78rem',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Theme & Currency Customizer Card */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '20px',
              boxShadow: 'var(--shadow-card, 0 4px 20px rgba(0, 0, 0, 0.08))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38bdf8',
                }}
              >
                <Palette size={16} />
              </div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Theme & Currency Customizer
              </h2>
            </div>

            {/* Currency Selector */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Select Operating Currency
              </label>
              <select
                value={formData.currencyCode}
                onChange={(e) => handleCurrencySelect(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'var(--bg-input, var(--bg-card-solid))',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  outline: 'none',
                }}
              >
                {currencyOptions.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '3px', display: 'block' }}>
                Applies globally across all billing, payment receipts, financial P&L, and member plans.
              </span>
            </div>

            {/* Full Website Atmosphere Theme Presets (8 Curated Luxury Palettes) */}
            <div style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} style={{ color: '#38bdf8' }} />
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Full Website Atmosphere Theme (8 Ultra-Luxury Palettes)
                  </label>
                </div>
                <span
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: 'rgba(56, 189, 248, 0.12)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  ⚡ Live 1-Click Transformation
                </span>
              </div>
              <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                Transforms the visual atmosphere of the entire website — ambient cosmic gradients, sidebars, glass cards, inputs, buttons, and glowing halos.
              </p>

              {/* Filter Tabs in Settings */}
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  background: 'var(--bg-input, rgba(255, 255, 255, 0.04))',
                  padding: '4px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '14px',
                  maxWidth: '460px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setSettingsThemeFilter('all')}
                  style={{
                    flex: 1,
                    fontSize: '0.72rem',
                    fontWeight: settingsThemeFilter === 'all' ? 700 : 500,
                    padding: '5px 0',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    background: settingsThemeFilter === 'all' ? 'var(--brand-primary)' : 'transparent',
                    color: settingsThemeFilter === 'all' ? '#ffffff' : 'var(--text-muted)',
                    transition: 'all 0.14s ease',
                  }}
                >
                  All (12)
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsThemeFilter('light')}
                  style={{
                    flex: 1.4,
                    fontSize: '0.72rem',
                    fontWeight: settingsThemeFilter === 'light' ? 700 : 500,
                    padding: '5px 0',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    background: settingsThemeFilter === 'light' ? 'var(--brand-primary)' : 'transparent',
                    color: settingsThemeFilter === 'light' ? '#ffffff' : 'var(--text-muted)',
                    transition: 'all 0.14s ease',
                  }}
                >
                  ☀️ Light & White (4)
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsThemeFilter('dark')}
                  style={{
                    flex: 1.4,
                    fontSize: '0.72rem',
                    fontWeight: settingsThemeFilter === 'dark' ? 700 : 500,
                    padding: '5px 0',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    background: settingsThemeFilter === 'dark' ? 'var(--brand-primary)' : 'transparent',
                    color: settingsThemeFilter === 'dark' ? '#ffffff' : 'var(--text-muted)',
                    transition: 'all 0.14s ease',
                  }}
                >
                  🌙 Dark Luxury (8)
                </button>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '10px',
                  marginBottom: '10px',
                }}
              >
                {THEME_PRESETS.filter((preset) => {
                  if (settingsThemeFilter === 'light') return preset.mode === 'light';
                  if (settingsThemeFilter === 'dark') return preset.mode === 'dark';
                  return true;
                }).map((preset) => {
                  const isSelected = (formData.themePreset || 'midnight') === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleThemePresetSelect(preset)}
                      style={{
                        background: isSelected
                          ? 'var(--brand-primary-light, rgba(99, 102, 241, 0.12))'
                          : 'var(--bg-card, rgba(15, 23, 42, 0.55))',
                        border: isSelected
                          ? `2px solid ${preset.primaryColor}`
                          : '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                        borderRadius: '10px',
                        padding: '11px 12px',
                        cursor: 'pointer',
                        transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        boxShadow: isSelected
                          ? `0 0 18px ${preset.primaryGlow}, inset 0 0 12px ${preset.primaryLight}`
                          : 'none',
                        transform: isSelected ? 'translateY(-2px)' : 'none',
                      }}
                    >
                      {/* Top Row: Name & Active / Badge */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                            {preset.name}
                          </div>
                          <span
                            style={{
                              fontSize: '0.62rem',
                              fontWeight: 600,
                              color: 'var(--text-muted)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              marginTop: '2px',
                            }}
                          >
                            <span>{preset.mode === 'light' ? '☀️' : '🌙'}</span>
                            <span>{preset.badge}</span>
                          </span>
                        </div>

                        {isSelected ? (
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              background: preset.primaryColor,
                              color: '#ffffff',
                              fontSize: '0.64rem',
                              fontWeight: 800,
                              padding: '2px 7px',
                              borderRadius: '9999px',
                              boxShadow: `0 2px 8px ${preset.primaryGlow}`,
                            }}
                          >
                            <Check size={11} strokeWidth={3} />
                            <span>Active</span>
                          </div>
                        ) : (
                          <div
                            style={{
                              width: '14px',
                              height: '14px',
                              borderRadius: '50%',
                              border: '1.5px solid var(--border-hover, rgba(255, 255, 255, 0.25))',
                            }}
                          />
                        )}
                      </div>

                      {/* 4-Color Swatch Preview Bar */}
                      <div
                        style={{
                          display: 'flex',
                          height: '12px',
                          borderRadius: '5px',
                          overflow: 'hidden',
                          marginBottom: '8px',
                          border: '1px solid var(--border-subtle)',
                          boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
                        }}
                        title={`Palette: ${preset.previewSwatches.join(', ')}`}
                      >
                        {preset.previewSwatches.map((color, idx) => (
                          <div
                            key={idx}
                            style={{
                              flex: 1,
                              background: color,
                              position: 'relative',
                            }}
                          />
                        ))}
                      </div>

                      {/* Tagline / Atmosphere description */}
                      <div
                        style={{
                          fontSize: '0.68rem',
                          color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)',
                          lineHeight: 1.35,
                        }}
                      >
                        {preset.tagline}
                      </div>
                    </div>
                  );
                })}
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>
                💡 Click any theme card to preview live across the entire screen. Click <b>Save All Changes</b> to save permanently.
              </span>
            </div>

            {/* Accent Color Presets (Fine-Tuning) */}
            <div style={{ marginBottom: '18px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Primary Brand Accent Color (Custom Fine-Tuning)
              </label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {colorPresets.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => handleColorChange(preset.hex)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: preset.hex,
                      border: formData.primaryColor.toLowerCase() === preset.hex.toLowerCase() ? '3px solid #ffffff' : '2px solid transparent',
                      cursor: 'pointer',
                      boxShadow: formData.primaryColor.toLowerCase() === preset.hex.toLowerCase() ? `0 0 14px ${preset.hex}` : 'none',
                      transition: 'transform 0.15s ease',
                    }}
                    title={preset.name}
                  />
                ))}
              </div>

              {/* Color Picker + Hex Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  style={{
                    width: '42px',
                    height: '38px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    cursor: 'pointer',
                    background: 'transparent',
                  }}
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  style={{
                    width: '110px',
                    padding: '8px 10px',
                    background: 'var(--bg-input, var(--bg-card-solid))',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    fontFamily: 'monospace',
                    outline: 'none',
                  }}
                />
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  Accent color updates dynamically across buttons, badges & active glows.
                </span>
              </div>
            </div>

            {/* Operating Hours */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Standard Operating Hours & Timings
              </label>
              <input
                type="text"
                value={formData.openingHours}
                onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
                placeholder="e.g. Mon - Sat: 06:00 AM - 10:00 PM | Sun: 07:00 AM - 01:00 PM"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'var(--bg-input, var(--bg-card-solid))',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  outline: 'none',
                }}
              />
              <span style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '3px', display: 'block' }}>
                Shown prominently on the Check-in Kiosk desk and member portal.
              </span>
            </div>

            {/* Live Component Preview Card */}
            <div
              style={{
                marginTop: '20px',
                padding: '16px',
                borderRadius: '10px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                }}
              >
                <div
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  LIVE THEME ATMOSPHERE PREVIEW:
                </div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: formData.primaryColor,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <span>Preset:</span>
                  <span style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                    {THEME_PRESETS.find((t) => t.id === (formData.themePreset || 'midnight'))?.name || 'Midnight Orbit'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  style={{
                    padding: '7px 16px',
                    borderRadius: '8px',
                    background: formData.primaryColor,
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    boxShadow: `0 3px 12px ${formData.primaryColor}66`,
                    cursor: 'default',
                  }}
                >
                  Sample Primary Button
                </button>

                <button
                  type="button"
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'default',
                  }}
                >
                  Secondary Action
                </button>

                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    color: '#34d399',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '9999px',
                  }}
                >
                  Active Member
                </span>

                <span style={{ color: formData.primaryColor, fontWeight: 800, fontSize: '0.92rem', marginLeft: 'auto' }}>
                  {formData.currencySymbol} 4,500
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RECEIPTS, TAX & DUAL PAYMENT GATEWAYS */}
      {activeTab === 'invoicing' && (
        <div className="responsive-invoicing-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.28fr) minmax(min(100%, 320px), 0.92fr)', gap: '24px', alignItems: 'start' }}>
          {/* LEFT COLUMN: INVOICING & PAYMENT GATEWAY CONTROLS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Card 1: Invoicing & Tax Rules */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: '22px',
                boxShadow: 'var(--shadow-card, 0 4px 20px rgba(0, 0, 0, 0.08))',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'rgba(99, 102, 241, 0.15)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#818cf8',
                    }}
                  >
                    <FileText size={18} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      Invoice & Tax Specifications
                    </h2>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                      Automated receipt numbering, GSTIN registration, and tax compliance rates
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '0.64rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: '#a5b4fc',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                  }}
                >
                  GST COMPLIANT
                </span>
              </div>

              <div className="responsive-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Receipt Prefix *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. REC, TF, GYM"
                    value={formData.invoicePrefix}
                    onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value.toUpperCase() })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--bg-input, var(--bg-card-solid))',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: 'var(--brand-primary, #38bdf8)',
                      fontSize: '0.84rem',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      outline: 'none',
                    }}
                  />
                  <div style={{ fontSize: '0.66rem', color: '#64748b', marginTop: '4px' }}>
                    Preview: <strong style={{ color: '#94a3b8', fontFamily: 'monospace' }}>{formData.invoicePrefix || 'REC'}-2026-0042</strong>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Tax Label
                  </label>
                  <input
                    type="text"
                    placeholder="GST or VAT"
                    value={formData.taxLabel}
                    onChange={(e) => setFormData({ ...formData, taxLabel: e.target.value.toUpperCase() })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--bg-input, var(--bg-card-solid))',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.84rem',
                      outline: 'none',
                    }}
                  />
                  <div style={{ fontSize: '0.66rem', color: '#64748b', marginTop: '4px' }}>
                    Used on official invoice headers
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    GST / Tax Registration (GSTIN)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 07AAAAA0000A1Z5"
                    value={formData.taxNumber}
                    onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--bg-input, var(--bg-card-solid))',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                      fontFamily: 'monospace',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Tax Rate (%)
                  </label>
                  <select
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--bg-input, var(--bg-card-solid))',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      outline: 'none',
                    }}
                  >
                    <option value={0}>0% (Tax Exempt / Non-GST)</option>
                    <option value={5}>5% (Concessional)</option>
                    <option value={12}>12% (Standard)</option>
                    <option value={18}>18% (Gym Standard Rate)</option>
                    <option value={28}>28% (Luxury Fitness)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Card 2: Dual Payment Gateways & Collection Controls */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: '22px',
                boxShadow: 'var(--shadow-card, 0 4px 20px rgba(0, 0, 0, 0.08))',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#10b981',
                    }}
                  >
                    <Zap size={18} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      Dual Payment Methods & Gateway Controls
                    </h2>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                      Choose which payment options members can use online and customize your Direct UPI VPA
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '0.64rem',
                    fontWeight: 800,
                    padding: '3px 9px',
                    borderRadius: '9999px',
                    background: 'rgba(16, 185, 129, 0.18)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    textTransform: 'uppercase',
                  }}
                >
                  ⚡ Active & Configured
                </span>
              </div>

              {/* STACKED PAYMENT CARDS: Spacious, full-width breathability! */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                {/* OPTION 1: DIRECT GYM UPI QR (0% FEE) */}
                <div
                  style={{
                    background: formData.enableDirectUpi
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, var(--bg-card-solid) 100%)'
                      : 'var(--bg-card)',
                    border: formData.enableDirectUpi
                      ? '1.5px solid rgba(16, 185, 129, 0.45)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '16px 18px',
                    boxShadow: formData.enableDirectUpi ? '0 4px 20px -2px rgba(16, 185, 129, 0.15)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'rgba(16, 185, 129, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#34d399',
                          flexShrink: 0,
                        }}
                      >
                        <QrCode size={16} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            ⚡ Option 1: Direct Gym UPI QR
                          </span>
                          <span
                            style={{
                              fontSize: '0.6rem',
                              fontWeight: 800,
                              background: 'rgba(16, 185, 129, 0.25)',
                              color: '#34d399',
                              border: '1px solid rgba(16, 185, 129, 0.4)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            0% FEE (FREE)
                          </span>
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '1px' }}>
                          Direct bank credit via GPay / PhonePe / Paytm • Members submit 12-digit UTR
                        </div>
                      </div>
                    </div>

                    {/* Smooth Modern iOS Switch */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setFormData({ ...formData, enableDirectUpi: !formData.enableDirectUpi })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '20px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.66rem',
                          fontWeight: 800,
                          color: formData.enableDirectUpi ? '#34d399' : '#64748b',
                        }}
                      >
                        {formData.enableDirectUpi ? 'ACTIVE' : 'OFF'}
                      </span>
                      <div
                        style={{
                          width: '38px',
                          height: '20px',
                          borderRadius: '9999px',
                          background: formData.enableDirectUpi ? '#10b981' : '#334155',
                          position: 'relative',
                          transition: 'background 0.2s ease',
                          boxShadow: formData.enableDirectUpi ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none',
                        }}
                      >
                        <div
                          style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '50%',
                            background: '#ffffff',
                            position: 'absolute',
                            top: '3px',
                            left: formData.enableDirectUpi ? '21px' : '3px',
                            transition: 'left 0.2s ease',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Form fields for Direct UPI */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginTop: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                        Gym UPI ID (VPA) *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 9876500011@paytm or fitgym@okhdfcbank"
                        value={formData.upiId}
                        onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: '#070b14',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '8px',
                          color: '#38bdf8',
                          fontSize: '0.82rem',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          outline: 'none',
                        }}
                      />
                      <div style={{ fontSize: '0.64rem', color: '#64748b', marginTop: '3px' }}>
                        100% of member fees land directly in this UPI account.
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                        UPI Payee Display Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Phoenix Fitness Studio"
                        value={formData.upiPayeeName}
                        onChange={(e) => setFormData({ ...formData, upiPayeeName: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'var(--bg-input, var(--bg-card-solid))',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '8px',
                          color: 'var(--text-primary)',
                          fontSize: '0.82rem',
                          outline: 'none',
                        }}
                      />
                      <div style={{ fontSize: '0.64rem', color: '#64748b', marginTop: '3px' }}>
                        Visible to members on their Google Pay / PhonePe screen.
                      </div>
                    </div>
                  </div>
                </div>

                {/* OPTION 2: SMART GATEWAY (RAZORPAY) */}
                <div
                  style={{
                    background: formData.enableRazorpay
                      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, var(--bg-card-solid) 100%)'
                      : 'var(--bg-card)',
                    border: formData.enableRazorpay
                      ? '1.5px solid rgba(59, 130, 246, 0.45)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '16px 18px',
                    boxShadow: formData.enableRazorpay ? '0 4px 20px -2px rgba(59, 130, 246, 0.15)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'rgba(59, 130, 246, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#60a5fa',
                          flexShrink: 0,
                        }}
                      >
                        <CreditCard size={16} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            💳 Option 2: Razorpay Online Gateway
                          </span>
                          <span
                            style={{
                              fontSize: '0.6rem',
                              fontWeight: 800,
                              background: 'rgba(59, 130, 246, 0.25)',
                              color: '#60a5fa',
                              border: '1px solid rgba(59, 130, 246, 0.4)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            AUTO CAPTURE
                          </span>
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '1px' }}>
                          Debit/Credit Cards • NetBanking • Instant Auto-Verification & Automated Invoicing
                        </div>
                      </div>
                    </div>

                    {/* Smooth Modern iOS Switch */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setFormData({ ...formData, enableRazorpay: !formData.enableRazorpay })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '20px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.66rem',
                          fontWeight: 800,
                          color: formData.enableRazorpay ? '#60a5fa' : '#64748b',
                        }}
                      >
                        {formData.enableRazorpay ? 'ACTIVE' : 'OFF'}
                      </span>
                      <div
                        style={{
                          width: '38px',
                          height: '20px',
                          borderRadius: '9999px',
                          background: formData.enableRazorpay ? '#3b82f6' : '#334155',
                          position: 'relative',
                          transition: 'background 0.2s ease',
                          boxShadow: formData.enableRazorpay ? '0 0 10px rgba(59, 130, 246, 0.5)' : 'none',
                        }}
                      >
                        <div
                          style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '50%',
                            background: '#ffffff',
                            position: 'absolute',
                            top: '3px',
                            left: formData.enableRazorpay ? '21px' : '3px',
                            transition: 'left 0.2s ease',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Gateway Status Grid */}
                  <div
                    style={{
                      background: 'var(--bg-input, var(--bg-card-solid))',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      display: 'grid',
                      gridTemplateColumns: '1.2fr 1fr 1.4fr',
                      gap: '12px',
                      alignItems: 'center',
                      marginTop: '10px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.62rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                        Gateway Status
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#34d399', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                        Connected & Live
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.62rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                        Platform Key ID
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#60a5fa', fontFamily: 'monospace', fontWeight: 700, marginTop: '3px' }}>
                        rzp_test_Sw7o...
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.62rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                        Supported Modes
                      </div>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '3px' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 700, background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)', padding: '1px 6px', borderRadius: '3px' }}>
                          Cards
                        </span>
                        <span style={{ fontSize: '0.6rem', fontWeight: 700, background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)', padding: '1px 6px', borderRadius: '3px' }}>
                          NetBanking
                        </span>
                        <span style={{ fontSize: '0.6rem', fontWeight: 700, background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)', padding: '1px 6px', borderRadius: '3px' }}>
                          UPI
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Terms & Footer Note */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: 'var(--shadow-card, 0 4px 20px rgba(0, 0, 0, 0.08))',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#818cf8',
                    flexShrink: 0,
                  }}
                >
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Receipt Terms & Policy Note
                  </h3>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>
                    Printed at the bottom of all member payment receipts & tax invoices
                  </div>
                </div>
              </div>
              <textarea
                rows={2}
                value={formData.receiptFooterNote}
                onChange={(e) => setFormData({ ...formData, receiptFooterNote: e.target.value })}
                placeholder="e.g. Fees once paid are non-refundable. Please carry clean indoor training shoes."
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'var(--bg-input, var(--bg-card-solid))',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Save Button for Invoicing Tab */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={saving}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '11px 24px',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  boxShadow: '0 4px 18px rgba(16, 185, 129, 0.45)',
                }}
              >
                {saving ? (
                  <>
                    <RefreshCw size={15} className="spinning" />
                    <span>Saving Invoicing Settings...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Save Invoicing & Payment Settings</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: INTERACTIVE LIVE RECEIPT SIMULATOR */}
          <div
            style={{
              position: 'sticky',
              top: '20px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '22px',
              boxShadow: 'var(--shadow-card, 0 4px 20px rgba(0, 0, 0, 0.08))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="#38bdf8" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Live Receipt & QR Simulator
                </h3>
              </div>
              <span
                style={{
                  fontSize: '0.62rem',
                  color: '#34d399',
                  fontWeight: 800,
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                }}
              >
                ⚡ LIVE UPDATED
              </span>
            </div>

            {/* Printable Receipt Paper Mockup */}
            <div
              style={{
                background: '#fdfefe',
                borderRadius: '12px',
                padding: '22px',
                color: '#0f172a',
                fontFamily: 'system-ui, sans-serif',
                boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(0, 0, 0, 0.06)',
              }}
            >
              {/* Receipt Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '12px' }}>
                <div>
                  <h4 style={{ fontSize: '1.08rem', fontWeight: 900, margin: 0, color: '#0f172a', letterSpacing: '-0.01em' }}>
                    {formData.name || 'FeeOrbit Fitness Club'}
                  </h4>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>
                    {formData.tagline || 'Where Champions Train'}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: '4px' }}>
                    {formData.address || 'Main Branch Location, City Center'}
                  </div>
                  {formData.taxNumber && (
                    <div style={{ fontSize: '0.68rem', color: '#0f172a', fontWeight: 800, marginTop: '2px' }}>
                      {formData.taxLabel}: {formData.taxNumber}
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 900, color: '#4f46e5', letterSpacing: '0.04em' }}>TAX INVOICE</div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, marginTop: '2px', fontFamily: 'monospace' }}>
                    #{formData.invoicePrefix || 'REC'}-2026-0042
                  </div>
                  <div style={{ fontSize: '0.66rem', color: '#64748b', marginTop: '2px' }}>
                    Date: {new Date().toLocaleDateString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Itemized Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid #cbd5e1', textAlign: 'left' }}>
                    <th style={{ padding: '6px 0', color: '#475569', fontWeight: 700 }}>Description</th>
                    <th style={{ padding: '6px 0', textAlign: 'right', color: '#475569', fontWeight: 700 }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '7px 0', fontWeight: 600 }}>Monthly Fitness Plan (1 Month)</td>
                    <td style={{ padding: '7px 0', textAlign: 'right', fontWeight: 800 }}>
                      {formData.currencySymbol} 1,500.00
                    </td>
                  </tr>
                  {formData.taxRate > 0 && (
                    <tr style={{ color: '#64748b', fontSize: '0.7rem' }}>
                      <td style={{ padding: '3px 0' }}>{formData.taxLabel} ({formData.taxRate}% inclusive)</td>
                      <td style={{ padding: '3px 0', textAlign: 'right' }}>
                        {formData.currencySymbol} {((1500 * formData.taxRate) / (100 + formData.taxRate)).toFixed(2)}
                      </td>
                    </tr>
                  )}
                  <tr style={{ borderTop: '2px solid #0f172a', fontWeight: 900 }}>
                    <td style={{ padding: '8px 0', fontSize: '0.86rem' }}>Total Amount Paid</td>
                    <td style={{ padding: '8px 0', textAlign: 'right', fontSize: '0.86rem', color: '#059669' }}>
                      {formData.currencySymbol} 1,500.00
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* QR Code & Sign */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', borderTop: '1px dashed #cbd5e1', paddingTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {receiptQrUrl ? (
                    <img
                      src={receiptQrUrl}
                      alt="QR Code"
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                      }}
                    />
                  ) : (
                    <div style={{ width: '64px', height: '64px', background: '#e2e8f0', borderRadius: '6px' }} />
                  )}
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0f172a' }}>
                      {formData.enableDirectUpi && formData.upiId ? '⚡ Scan & Pay with UPI' : 'Digital QR Verification'}
                    </div>
                    <div style={{ fontSize: '0.64rem', color: '#64748b', maxWidth: '170px', marginTop: '2px' }}>
                      {formData.enableDirectUpi && formData.upiId
                        ? `Pay to ${formData.upiId}`
                        : 'Scan to verify receipt authenticity'}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.62rem', color: '#64748b', marginBottom: '14px' }}>
                    For {formData.name || 'Gym'}
                  </div>
                  <div style={{ borderTop: '1px solid #0f172a', fontSize: '0.68rem', fontWeight: 800 }}>
                    Authorized Signatory
                  </div>
                </div>
              </div>

              {/* Terms Note */}
              <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #f1f5f9', fontSize: '0.64rem', color: '#64748b', lineHeight: 1.35, textAlign: 'center' }}>
                {formData.receiptFooterNote || 'Thank you for choosing us! Fees once paid are non-refundable.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PUBLIC NOTICE BOARD CMS */}
      {activeTab === 'notices' && (
        <div className="responsive-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '20px' }}>
          {/* Notice Configuration */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '20px',
              boxShadow: 'var(--shadow-card, 0 4px 20px rgba(0, 0, 0, 0.08))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fbbf24',
                }}
              >
                <Bell size={16} />
              </div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Public Gym Notice Board CMS
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="noticeActive"
                  checked={formData.noticeActive}
                  onChange={(e) => setFormData({ ...formData, noticeActive: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#6366f1' }}
                />
                <label htmlFor="noticeActive" style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}>
                  Display Notice on Admin Dashboard & Kiosk Screen
                </label>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  Announcement Priority / Alert Level
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { id: 'info', label: 'General Info', color: '#38bdf8' },
                    { id: 'alert', label: 'Alert / Maintenance', color: '#fbbf24' },
                    { id: 'urgent', label: 'Urgent / Holiday', color: '#f87171' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, noticePriority: p.id })}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        borderRadius: '7px',
                        fontSize: '0.74rem',
                        fontWeight: formData.noticePriority === p.id ? 700 : 500,
                        cursor: 'pointer',
                        background: formData.noticePriority === p.id ? `${p.color}25` : 'var(--bg-input, var(--bg-card-solid))',
                        border: formData.noticePriority === p.id ? `1px solid ${p.color}` : '1px solid var(--border-subtle)',
                        color: formData.noticePriority === p.id ? p.color : '#94a3b8',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  Notice Headline / Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Holiday Schedule / Maintenance Alert"
                  value={formData.noticeTitle}
                  onChange={(e) => setFormData({ ...formData, noticeTitle: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--bg-input, var(--bg-card-solid))',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  Announcement Detailed Content
                </label>
                <textarea
                  rows={4}
                  placeholder="e.g. Gym will be closed this Sunday evening for deep sanitation. Regular timings resume Monday 6:00 AM."
                  value={formData.noticeContent}
                  onChange={(e) => setFormData({ ...formData, noticeContent: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--bg-input, var(--bg-card-solid))',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Live Notice Banner Simulator */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '20px',
              boxShadow: 'var(--shadow-card, 0 4px 20px rgba(0, 0, 0, 0.08))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Sparkles size={16} color="#fbbf24" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Live Notice Banner Preview
              </h3>
            </div>

            <p style={{ fontSize: '0.76rem', color: '#94a3b8', marginBottom: '16px' }}>
              Here is how your notice is displayed on the Admin Dashboard top header and Attendance Kiosk:
            </p>

            {formData.noticeActive ? (
              <div
                style={{
                  background:
                    formData.noticePriority === 'urgent'
                      ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(185, 28, 28, 0.25))'
                      : formData.noticePriority === 'alert'
                      ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(180, 83, 9, 0.25))'
                      : 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(3, 105, 161, 0.25))',
                  border:
                    formData.noticePriority === 'urgent'
                      ? '1px solid rgba(239, 68, 68, 0.4)'
                      : formData.noticePriority === 'alert'
                      ? '1px solid rgba(245, 158, 11, 0.4)'
                      : '1px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    color:
                      formData.noticePriority === 'urgent'
                        ? '#f87171'
                        : formData.noticePriority === 'alert'
                        ? '#fbbf24'
                        : '#38bdf8',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  {formData.noticePriority === 'urgent' ? (
                    <AlertTriangle size={18} />
                  ) : formData.noticePriority === 'alert' ? (
                    <Bell size={18} />
                  ) : (
                    <Info size={18} />
                  )}
                </div>

                <div>
                  <div
                    style={{
                      fontSize: '0.86rem',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {formData.noticeTitle || 'Gym Announcement'}
                  </div>
                  <div
                    style={{
                      fontSize: '0.76rem',
                      color: 'var(--text-secondary)',
                      marginTop: '4px',
                      lineHeight: 1.4,
                    }}
                  >
                    {formData.noticeContent || 'No notice content set.'}
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: 'var(--bg-input, var(--bg-card-solid))',
                  border: '1px dashed var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '24px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.78rem',
                }}
              >
                Notice Banner is currently <strong>disabled</strong>. Check the toggle above to publish it across the platform.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: COMMUNICATION TEMPLATES CMS */}
      {activeTab === 'templates' && (
        <div className="responsive-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '20px' }}>
          {/* Template Editor */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '20px',
              boxShadow: 'var(--shadow-card, 0 4px 20px rgba(0, 0, 0, 0.08))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#818cf8',
                  }}
                >
                  <MessageSquare size={16} />
                </div>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Automated WhatsApp & SMS Templates
                </h2>
              </div>

              <button
                type="button"
                onClick={handleResetTemplates}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.7rem', gap: '4px', padding: '4px 8px' }}
                title="Restore default templates"
              >
                <RotateCcw size={12} /> Reset
              </button>
            </div>

            {/* Template Selector Sub-tabs */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {[
                { id: 'receipt', label: 'Payment Receipt' },
                { id: 'dueReminder', label: 'Fee Due Reminder' },
                { id: 'expiryAlert', label: 'Membership Expiry' },
                { id: 'welcome', label: 'New Member Welcome' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTemplateType(t.id)}
                  style={{
                    padding: '6px 11px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: activeTemplateType === t.id ? 700 : 500,
                    cursor: 'pointer',
                    background: activeTemplateType === t.id ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'var(--bg-input, var(--bg-card-solid))',
                    border: activeTemplateType === t.id ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid var(--border-subtle)',
                    color: activeTemplateType === t.id ? '#ffffff' : '#94a3b8',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Placeholder Chips Bar */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, marginBottom: '6px' }}>
                CLICK TO INSERT DYNAMIC VARIABLES:
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  '{memberName}',
                  '{amount}',
                  '{currency}',
                  '{planName}',
                  '{dueDate}',
                  '{gymName}',
                  '{receiptNo}',
                  '{daysLeft}',
                  '{expiryDate}',
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => insertPlaceholder(tag)}
                    style={{
                      background: 'rgba(99, 102, 241, 0.12)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      color: '#a5b4fc',
                      fontSize: '0.68rem',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      padding: '3px 7px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                    }}
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Template Textarea */}
            <div>
              <textarea
                ref={templateTextareaRef}
                rows={6}
                value={
                  activeTemplateType === 'receipt'
                    ? formData.templateReceipt
                    : activeTemplateType === 'dueReminder'
                    ? formData.templateDueReminder
                    : activeTemplateType === 'expiryAlert'
                    ? formData.templateExpiryAlert
                    : formData.templateWelcome
                }
                onChange={(e) => {
                  if (activeTemplateType === 'receipt') setFormData({ ...formData, templateReceipt: e.target.value });
                  else if (activeTemplateType === 'dueReminder') setFormData({ ...formData, templateDueReminder: e.target.value });
                  else if (activeTemplateType === 'expiryAlert') setFormData({ ...formData, templateExpiryAlert: e.target.value });
                  else if (activeTemplateType === 'welcome') setFormData({ ...formData, templateWelcome: e.target.value });
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'var(--bg-input, var(--bg-card-solid))',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  outline: 'none',
                  lineHeight: 1.45,
                  resize: 'vertical',
                }}
              />
            </div>
          </div>

          {/* WhatsApp Dark Chat Simulator Card */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '20px',
              boxShadow: 'var(--shadow-card, 0 4px 20px rgba(0, 0, 0, 0.08))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: '#25d366',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                  }}
                >
                  <MessageSquare size={14} />
                </div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  WhatsApp Delivery Simulator
                </h3>
              </div>
              <span style={{ fontSize: '0.66rem', color: '#25d366', fontWeight: 700 }}>LIVE PREVIEW</span>
            </div>

            {/* Dark WhatsApp Chat Box Mockup */}
            <div
              style={{
                background: '#0b141a',
                borderRadius: '10px',
                padding: '16px',
                minHeight: '180px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                backgroundImage:
                  'radial-gradient(circle at center, rgba(255,255,255,0.02) 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
            >
              {/* WhatsApp Bubble */}
              <div
                style={{
                  background: '#005c4b',
                  borderRadius: '8px 8px 0px 8px',
                  padding: '10px 12px',
                  maxWidth: '92%',
                  alignSelf: 'flex-end',
                  color: '#e9edef',
                  fontSize: '0.8rem',
                  lineHeight: 1.45,
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
                  position: 'relative',
                  whiteSpace: 'pre-line',
                }}
              >
                <div>{getSimulatedMessage()}</div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.62rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    marginTop: '6px',
                  }}
                >
                  <span>10:45 PM</span>
                  <CheckCheck size={13} color="#53bdeb" />
                </div>
              </div>
            </div>

            {/* Test WhatsApp Action Button */}
            <div style={{ marginTop: '14px' }}>
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(getSimulatedMessage())}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '9px',
                  background: 'rgba(37, 211, 102, 0.15)',
                  border: '1px solid rgba(37, 211, 102, 0.35)',
                  borderRadius: '8px',
                  color: '#25d366',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <ExternalLink size={13} />
                <span>Test Live Message on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: KIOSK & AUTOMATION SETTINGS */}
      {activeTab === 'kiosk' && (
        <div className="responsive-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '20px' }}>
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '20px',
              boxShadow: 'var(--shadow-card, 0 4px 20px rgba(0, 0, 0, 0.08))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(6, 182, 212, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#22d3ee',
                }}
              >
                <QrCode size={16} />
              </div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Attendance Kiosk & Check-in Rules
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Sound toggle + Audio test button */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Volume2 size={15} style={{ color: '#22d3ee' }} />
                    Kiosk Audio Chime on Check-in
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                    Plays a crisp success tone when a member successfully scans their QR pass.
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={testKioskSound}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.68rem', padding: '3px 8px' }}
                  >
                    Test Tone
                  </button>
                  <input
                    type="checkbox"
                    checked={formData.kioskSound}
                    onChange={(e) => setFormData({ ...formData, kioskSound: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#6366f1' }}
                  />
                </div>
              </div>

              {/* Cooldown */}
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  Double-Tap Anti-Bounce Cooldown (Minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={formData.kioskCooldown}
                  onChange={(e) => setFormData({ ...formData, kioskCooldown: e.target.value })}
                  style={{
                    width: '120px',
                    padding: '8px 12px',
                    background: 'var(--bg-input, var(--bg-card-solid))',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    outline: 'none',
                  }}
                />
                <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '3px', display: 'block' }}>
                  Prevents a member from checking out immediately if they tap twice within 5 minutes.
                </span>
              </div>

              {/* Auto checkout */}
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  Automatic Workout Checkout (Hours)
                </label>
                <select
                  value={formData.kioskAutoCheckout}
                  onChange={(e) => setFormData({ ...formData, kioskAutoCheckout: e.target.value })}
                  style={{
                    width: '200px',
                    padding: '8px 12px',
                    background: 'var(--bg-input, var(--bg-card-solid))',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    outline: 'none',
                  }}
                >
                  <option value={1}>1 Hour</option>
                  <option value={2}>2 Hours (Recommended)</option>
                  <option value={3}>3 Hours</option>
                  <option value={4}>4 Hours</option>
                  <option value={0}>Manual Only (No Auto-Checkout)</option>
                </select>
                <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '3px', display: 'block' }}>
                  If a member forgets to scan out on leaving, system marks workout as completed.
                </span>
              </div>

              {/* Allow multiple check-ins */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Allow Multiple Workouts Per Day
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Allows dedicated athletes to scan in for morning cardio and evening lifting sessions.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.kioskAllowMultipleCheckIns}
                  onChange={(e) => setFormData({ ...formData, kioskAllowMultipleCheckIns: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#6366f1' }}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '20px',
              boxShadow: 'var(--shadow-card, 0 4px 20px rgba(0, 0, 0, 0.08))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <ShieldCheck size={16} color="#34d399" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Automated Kiosk Security Status
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.78rem' }}>
              <div style={{ padding: '12px', background: 'var(--bg-card-solid, rgba(255, 255, 255, 0.03))', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Live QR Encryption</div>
                <div style={{ color: '#94a3b8', marginTop: '2px', lineHeight: 1.35 }}>
                  Reception Standee uses FeeOrbit cryptographic payload with automatic gymId association.
                </div>
              </div>

              <div style={{ padding: '12px', background: 'var(--bg-card-solid, rgba(255, 255, 255, 0.03))', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Front Desk Kiosk Mode</div>
                <div style={{ color: '#94a3b8', marginTop: '2px', lineHeight: 1.35 }}>
                  Front desk tablets lock into full-screen Kiosk mode via <code style={{ color: '#818cf8' }}>/kiosk</code> with real-time web-camera QR scanner.
                </div>
              </div>

              <div style={{ padding: '12px', background: 'var(--bg-card-solid, rgba(255, 255, 255, 0.03))', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Live Headcount Sync</div>
                <div style={{ color: '#94a3b8', marginTop: '2px', lineHeight: 1.35 }}>
                  Realtime in-gym occupancy count automatically reconciles with dashboard analytics.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: DATA BACKUP & EXPORT (NEW HIGH-VALUE FEATURE) */}
      {activeTab === 'backup' && (
        <div className="responsive-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '20px' }}>
          {/* Export Cards */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '20px',
              boxShadow: 'var(--shadow-card, 0 4px 20px rgba(0, 0, 0, 0.08))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#34d399',
                }}
              >
                <Download size={16} />
              </div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Gym Data Backup & Export
              </h2>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '20px' }}>
              Download complete, audit-ready CSV exports of your gym data for accounting, offline records, and tax filings.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Export Members */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  background: 'var(--bg-input, var(--bg-card-solid))',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.84rem' }}>
                    Active Members Roster (CSV)
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Complete list of members with IDs, phones, plans, and expiry dates.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={exportMembersCSV}
                  disabled={exportingType === 'members'}
                  className="btn btn-primary btn-sm"
                  style={{ gap: '5px' }}
                >
                  <Download size={13} />
                  {exportingType === 'members' ? 'Exporting...' : 'Export CSV'}
                </button>
              </div>

              {/* Export Payments */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  background: 'var(--bg-input, var(--bg-card-solid))',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.84rem' }}>
                    Financial Fee Collections (CSV)
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    All paid receipts, transaction IDs, tax calculations, and pending balances.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={exportPaymentsCSV}
                  disabled={exportingType === 'payments'}
                  className="btn btn-primary btn-sm"
                  style={{ gap: '5px' }}
                >
                  <Download size={13} />
                  {exportingType === 'payments' ? 'Exporting...' : 'Export CSV'}
                </button>
              </div>

              {/* Export Config */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  background: 'var(--bg-input, var(--bg-card-solid))',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.84rem' }}>
                    Full Gym Configuration (JSON)
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                    Backup copy of all branding colors, receipt rules, templates, and kiosk settings.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={exportConfigJSON}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '5px' }}
                >
                  <Database size={13} /> Backup JSON
                </button>
              </div>
            </div>
          </div>

          {/* Cloud Status */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '20px',
              boxShadow: 'var(--shadow-card, 0 4px 20px rgba(0, 0, 0, 0.08))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Database size={16} color="#818cf8" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Cloud Database Architecture
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.78rem' }}>
              <div style={{ padding: '12px', background: 'var(--bg-card-solid, rgba(255, 255, 255, 0.03))', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>MongoDB Multi-Tenant Partitioning</div>
                <div style={{ color: '#94a3b8', marginTop: '2px', lineHeight: 1.35 }}>
                  Data is automatically isolated by gym ID. Your staff, members, and payment receipts are private to your business.
                </div>
              </div>

              <div style={{ padding: '12px', background: 'var(--bg-card-solid, rgba(255, 255, 255, 0.03))', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Zero-Downtime Settings Replication</div>
                <div style={{ color: '#94a3b8', marginTop: '2px', lineHeight: 1.35 }}>
                  Changes to brand colors, notice boards, and receipts synchronize instantly across all open browser tabs and mobile devices.
                </div>
              </div>

              <div style={{ padding: '12px', background: 'var(--bg-card-solid, rgba(255, 255, 255, 0.03))', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Cryptographic Data Integrity</div>
                <div style={{ color: '#94a3b8', marginTop: '2px', lineHeight: 1.35 }}>
                  Every receipt number is validated against the gym's official database records with unique transaction hashes.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
