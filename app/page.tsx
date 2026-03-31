'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/remove-bg', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process image');
      }

      const data = await response.json();
      setOriginalImage(data.originalImage);
      setProcessedImage(data.processedImage);
    } catch (err) {
      setError('处理图片时出错，请检查 API Key 配置');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
    },
    maxFiles: 1,
  });

  const downloadImage = () => {
    if (!processedImage) return;
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = `bg-removed-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white text-center mb-8">
          🎨 智能去背景工具
        </h1>

        {!originalImage ? (
          <div
            {...getRootProps()}
            className={`border-4 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
              isDragActive
                ? 'border-green-400 bg-green-400/10'
                : 'border-white/30 bg-white/5 hover:border-white/50 hover:bg-white/10'
            }`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                input?.click();
              }
            }}
          >
            <input {...getInputProps()} className="cursor-pointer" />
            <div className="text-6xl mb-4">📁</div>
            <p className="text-xl text-white mb-2">
              {isDragActive ? '放开图片开始处理...' : '拖拽图片到这里，或点击选择'}
            </p>
            <p className="text-white/60">支持 JPG、PNG、GIF 格式</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 原图 */}
              <div className="bg-white/10 rounded-2xl p-4">
                <h2 className="text-xl font-semibold text-white mb-4 text-center">
                  🖼️ 原图
                </h2>
                <div className="relative bg-gray-800 rounded-lg overflow-hidden">
                  <canvas
                    id="originalCanvas"
                    className="w-full h-auto"
                    style={{ maxHeight: '400px' }}
                  />
                </div>
              </div>

              {/* 去背景后 */}
              <div className="bg-white/10 rounded-2xl p-4">
                <h2 className="text-xl font-semibold text-white mb-4 text-center">
                  ✨ 去背景后
                </h2>
                <div className="relative bg-gray-800 rounded-lg overflow-hidden">
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage:
                        'linear-gradient(45deg, #374151 25%, transparent 25%), linear-gradient(-45deg, #374151 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #374151 75%), linear-gradient(-45deg, transparent 75%, #374151 75%)',
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                    }}
                  />
                  <canvas
                    id="processedCanvas"
                    className="w-full h-auto relative z-10"
                    style={{ maxHeight: '400px' }}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setOriginalImage(null);
                  setProcessedImage(null);
                  setError(null);
                }}
                className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
              >
                🔄 重新上传
              </button>
              <button
                onClick={downloadImage}
                disabled={!processedImage}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
              >
                📥 下载 PNG
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 text-center">
              <div className="text-4xl mb-4 animate-spin">⏳</div>
              <p className="text-gray-700 text-lg">正在处理图片...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 bg-red-500/20 border border-red-500 rounded-lg p-4 text-center">
            <p className="text-red-300">⚠️ {error}</p>
          </div>
        )}
      </div>

      {/* Canvas 渲染逻辑 */}
      <ImageRenderer originalImage={originalImage} processedImage={processedImage} />
    </div>
  );
}

function ImageRenderer({
  originalImage,
  processedImage,
}: {
  originalImage: string | null;
  processedImage: string | null;
}) {
  const originalRenderedRef = useRef(false);
  const processedRenderedRef = useRef(false);

  // 渲染原图
  useEffect(() => {
    if (!originalImage || originalRenderedRef.current) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.getElementById('originalCanvas') as HTMLCanvasElement;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const maxWidth = 600;
          const maxHeight = 400;
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (maxWidth / width) * height;
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = (maxHeight / height) * width;
            height = maxHeight;
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          originalRenderedRef.current = true;
        }
      }
    };
    img.src = originalImage;
  }, [originalImage]);

  // 渲染处理后的图
  useEffect(() => {
    if (!processedImage || processedRenderedRef.current) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.getElementById('processedCanvas') as HTMLCanvasElement;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const maxWidth = 600;
          const maxHeight = 400;
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (maxWidth / width) * height;
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = (maxHeight / height) * width;
            height = maxHeight;
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          processedRenderedRef.current = true;
        }
      }
    };
    img.src = processedImage;
  }, [processedImage]);

  // 重置渲染标记
  useEffect(() => {
    if (!originalImage) {
      originalRenderedRef.current = false;
    }
    if (!processedImage) {
      processedRenderedRef.current = false;
    }
  }, [originalImage, processedImage]);

  return null;
}
