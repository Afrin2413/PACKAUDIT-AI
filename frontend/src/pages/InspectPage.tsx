import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  Camera,
  Image as ImageIcon,
  Trash2,
  Scan,
  AlertCircle,
  CheckCircle2,
  FileCheck,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { CameraModal } from '../components/CameraModal';
import { InspectionTimeline } from '../components/InspectionTimeline';

export const InspectPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Optional metadata fields
  const [productName, setProductName] = useState<string>('');
  const [brand, setBrand] = useState<string>('');
  const [category, setCategory] = useState<string>('General Packaged Commodity');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPG, PNG, WEBP).');
      return;
    }
    setError(null);
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setError(null);
  };

  // Helper to load bundled test scenario
  const loadScenario = async (scenarioType: 'A' | 'B' | 'C') => {
    handleRemove();
    try {
      let filename = 'sample_a_compliant_biscuits.png';
      let title = 'NutriBake Almond Crunch Biscuits';
      let cat = 'Packaged Food & Confectionery';
      let brandName = 'NutriBake India Ltd';

      if (scenarioType === 'B') {
        filename = 'sample_b_missing_care_spices.png';
        title = 'Royal Kashmiri Garam Masala';
        cat = 'Spices & Condiments';
        brandName = 'Royal Spices';
      } else if (scenarioType === 'C') {
        filename = 'sample_c_non_compliant_beverage.png';
        title = 'VoltMax Energy Drink';
        cat = 'Beverages & Energy Drinks';
        brandName = 'VoltMax Global';
      }

      setProductName(title);
      setBrand(brandName);
      setCategory(cat);

      // Fetch sample from backend uploads
      const res = await fetch(`/api/uploads/${filename}`);
      if (!res.ok) {
        throw new Error(`Failed to load preset ${filename}`);
      }
      const blob = await res.blob();
      const file = new File([blob], filename, { type: 'image/png' });
      handleFileChange(file);
    } catch (err: any) {
      console.error('Error loading preset scenario:', err);
      setError('Could not load preset label image. You can upload any package photo directly.');
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setError(null);
    setIsAnalyzing(true);
    setCurrentStage(1);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('product_name', productName.trim() || 'Packaged Commodity');
    if (brand.trim()) formData.append('brand', brand.trim());
    formData.append('category', category);

    try {
      // Advance stages smoothly alongside the genuine API execution
      const stageTimer1 = setTimeout(() => setCurrentStage(2), 250);
      const stageTimer2 = setTimeout(() => setCurrentStage(3), 500);
      const stageTimer3 = setTimeout(() => setCurrentStage(4), 800);
      const stageTimer4 = setTimeout(() => setCurrentStage(5), 1100);

      const inspection = await apiClient.createAndAnalyze(formData);

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      clearTimeout(stageTimer4);

      setCurrentStage(6);

      // Transition to results page
      setTimeout(() => {
        navigate(`/inspection/${inspection.id}`);
      }, 600);
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setIsAnalyzing(false);
      setCurrentStage(0);
      setError(
        err.message ||
          'Analysis service could not process image. Ensure label is well-lit and mandatory declaration text is readable.'
      );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Inspect a Product</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
          Upload a clear photo of the package label. PackAudit AI will extract mandatory declarations and evaluate them against configured Legal Metrology compliance rules.
        </p>
      </div>

      {/* Preset Scenarios Selector for instant test drive */}
      <div className="p-4 rounded-xl bg-dark-surface border border-dark-border space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-semibold">
            <Sparkles className="w-4 h-4 text-brand-emerald" />
            <span>Try Pre-Configured Test Scenarios:</span>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Official PCR 2011 benchmarks
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => loadScenario('A')}
            disabled={isAnalyzing}
            className="p-3 rounded-lg bg-dark-card hover:bg-dark-hover border border-dark-border text-left transition-all group disabled:opacity-50"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
              <span>Scenario A: Compliant</span>
              <span className="w-2 h-2 rounded-full bg-brand-emerald" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              NutriBake Biscuits (100% declarations valid)
            </p>
          </button>

          <button
            type="button"
            onClick={() => loadScenario('B')}
            disabled={isAnalyzing}
            className="p-3 rounded-lg bg-dark-card hover:bg-dark-hover border border-dark-border text-left transition-all group disabled:opacity-50"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
              <span>Scenario B: Review Needed</span>
              <span className="w-2 h-2 rounded-full bg-brand-amber" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Garam Masala (Missing consumer care helpline)
            </p>
          </button>

          <button
            type="button"
            onClick={() => loadScenario('C')}
            disabled={isAnalyzing}
            className="p-3 rounded-lg bg-dark-card hover:bg-dark-hover border border-dark-border text-left transition-all group disabled:opacity-50"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
              <span>Scenario C: Non-Compliant</span>
              <span className="w-2 h-2 rounded-full bg-brand-crimson" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              VoltMax Drink (Missing importer & invalid units)
            </p>
          </button>
        </div>
      </div>

      {/* Error alert banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-rose-200">
            <AlertCircle className="w-4 h-4" />
            <span>Inspection Error</span>
          </div>
          <p>{error}</p>
          <div className="pt-2 border-t border-rose-900/60 text-[11px] text-rose-400 flex flex-wrap gap-4">
            <span>• Tips: Use good lighting</span>
            <span>• Avoid glare & reflections</span>
            <span>• Keep package label flat</span>
            <span>• Capture entire declaration panel</span>
          </div>
        </div>
      )}

      {/* Upload Box or Live Analysis Progression */}
      {isAnalyzing ? (
        <div className="p-8 rounded-2xl bg-dark-surface border border-dark-border shadow-card-dark text-center space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">
              Processing Legal Metrology Inspection
            </h3>
            <p className="text-xs text-slate-400">
              Executing OpenCV enhancement, OCR parsing, and Rule 6 evaluation pipeline...
            </p>
          </div>

          <InspectionTimeline currentStage={currentStage} isComplete={currentStage === 6} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Dropzone */}
          <div className="lg:col-span-2 space-y-4">
            {!previewUrl ? (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[340px] rounded-2xl border-2 border-dashed border-dark-border hover:border-brand-emerald/60 bg-dark-surface/60 hover:bg-dark-surface transition-all flex flex-col items-center justify-center p-8 text-center cursor-pointer group select-none"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-2xl bg-dark-card border border-dark-border flex items-center justify-center text-slate-400 group-hover:text-brand-emerald group-hover:border-brand-emerald/40 transition-colors mb-4 shadow-lg">
                  <UploadCloud className="w-8 h-8 stroke-[1.5]" />
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-brand-emerald transition-colors">
                  Drag & Drop Product Label Image
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  or <span className="text-brand-emerald font-semibold underline">browse files</span> from your computer
                </p>

                <div className="mt-6 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCameraOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-card hover:bg-dark-hover border border-dark-border text-slate-300 hover:text-white text-xs font-semibold transition-colors"
                  >
                    <Camera className="w-4 h-4 text-brand-emerald" />
                    <span>Use Camera</span>
                  </button>
                </div>

                <div className="mt-6 text-[11px] text-slate-500 font-mono">
                  Supported: JPG, JPEG, PNG, WEBP (Max 15MB)
                </div>
              </div>
            ) : (
              /* Image Preview Panel */
              <div className="rounded-2xl bg-dark-surface border border-dark-border overflow-hidden space-y-4 p-4">
                <div className="relative rounded-xl overflow-hidden bg-black/60 max-h-[400px] flex items-center justify-center border border-dark-border">
                  <img
                    src={previewUrl}
                    alt="Package Preview"
                    className="max-h-[380px] w-auto object-contain"
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <button
                      onClick={handleRemove}
                      className="p-2 rounded-lg bg-black/70 hover:bg-rose-950 text-slate-300 hover:text-rose-400 border border-slate-700 transition-colors"
                      title="Remove Image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>File: <strong className="text-slate-200">{selectedFile?.name}</strong></span>
                  <span>Size: {Math.round((selectedFile?.size || 0) / 1024)} KB</span>
                </div>
              </div>
            )}
          </div>

          {/* Inspection Metadata Panel */}
          <div className="p-6 rounded-2xl bg-dark-surface border border-dark-border flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-dark-border">
                <FileCheck className="w-4 h-4 text-brand-emerald" />
                <h3 className="text-sm font-bold text-white">Inspection Details</h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Product / Commodity Name
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Auto-detected if left empty"
                  className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-emerald"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Brand / Manufacturer Name
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. NutriBake Foods Ltd"
                  className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-emerald"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Commodity Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded-xl text-xs text-white focus:outline-none focus:border-brand-emerald"
                >
                  <option value="Packaged Food & Confectionery">Packaged Food & Confectionery</option>
                  <option value="Beverages & Energy Drinks">Beverages & Energy Drinks</option>
                  <option value="Spices & Condiments">Spices & Condiments</option>
                  <option value="Edible Oils & Ghee">Edible Oils & Ghee</option>
                  <option value="Personal Care & Cosmetics">Personal Care & Cosmetics</option>
                  <option value="Grains & Cereals">Grains & Cereals</option>
                  <option value="General Packaged Commodity">General Packaged Commodity</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-dark-card border border-dark-border/60 text-[11px] text-slate-400 space-y-1">
                <div className="font-semibold text-slate-300 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-brand-emerald" />
                  <span>Rule Engine Active</span>
                </div>
                <p>
                  Scans for Rule 6(1)(a)-(g) declarations including MRP, Net Qty standard metric units, MFD/PKD, and consumer care redressal contacts.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!selectedFile || isAnalyzing}
                className="w-full py-3.5 px-4 rounded-xl bg-brand-emerald text-black font-bold text-sm hover:bg-emerald-400 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-glow-emerald disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Scan className="w-4 h-4 stroke-[2.5]" />
                <span>Analyze Product Label</span>
              </button>

              {selectedFile && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="w-full py-2 px-4 rounded-xl bg-dark-card hover:bg-dark-hover border border-dark-border text-slate-400 hover:text-white text-xs font-semibold transition-colors"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleFileChange}
      />
    </div>
  );
};
