"use client";

import { useState } from "react";
import PhotoUploader from "../PhotoUploader";
import { getPetAvatarUploadOptions } from "../../lib/storage";

export default function StorageTest() {
  const [uploadResults, setUploadResults] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadStart = () => {
    setIsUploading(true);
    console.log("Upload started...");
  };

  const handleUploadComplete = (result: any) => {
    setIsUploading(false);
    setUploadResults(prev => [...prev, { ...result, timestamp: new Date().toISOString() }]);
    console.log("Upload completed:", result);
  };

  const clearResults = () => {
    setUploadResults([]);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Supabase Storage Test</h2>
      
      {/* Upload Area */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Test Image Upload</h3>
        <PhotoUploader
          uploadOptions={getPetAvatarUploadOptions("test-pet-123")}
          onUploadStart={handleUploadStart}
          onUploadComplete={handleUploadComplete}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6"
        />
      </div>

      {/* Results */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">Upload Results</h3>
          {uploadResults.length > 0 && (
            <button
              onClick={clearResults}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear
            </button>
          )}
        </div>
        
        {uploadResults.length === 0 ? (
          <p className="text-gray-500 italic">No uploads yet</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {uploadResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.success 
                    ? "bg-green-50 border-green-200" 
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-medium ${
                    result.success ? "text-green-800" : "text-red-800"
                  }`}>
                    {result.success ? "✅ Success" : "❌ Failed"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                {result.success ? (
                  <div className="space-y-2">
                    <div className="text-sm">
                      <strong>URL:</strong>{" "}
                      <a 
                        href={result.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all"
                      >
                        {result.url}
                      </a>
                    </div>
                    <div className="text-sm">
                      <strong>Path:</strong> <code className="bg-gray-100 px-1 rounded">{result.path}</code>
                    </div>
                    {result.url && (
                      <div className="mt-2">
                        <img 
                          src={result.url} 
                          alt="Uploaded" 
                          className="max-w-xs max-h-32 object-cover rounded border"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-red-700">
                    <strong>Error:</strong> {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status */}
      {isUploading && (
        <div className="text-center py-4">
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-lg">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-blue-800">Uploading...</span>
          </div>
        </div>
      )}
    </div>
  );
}
