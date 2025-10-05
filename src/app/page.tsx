'use client';
import { useState, useEffect } from 'react';

interface Document {
  id: string;
  filename: string;
  content: string;
  file_type?: string;
}

interface ChatMessage {
  question: string;
  answer: string;
  sources: any[];
}

export default function Home() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Check if backend is running
  useEffect(() => {
    checkApiStatus();
    fetchDocuments();
  }, []);

  const checkApiStatus = async () => {
    try {
      const response = await fetch('https://knowledgescout-backend.onrender.com/');
      if (response.ok) {
        setApiStatus('online');
      } else {
        setApiStatus('offline');
      }
    } catch (error) {
      setApiStatus('offline');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const fileName = file.name.toLowerCase();
    const allowedTypes = ['.txt', '.pdf', '.doc', '.docx'];
    const isValidType = allowedTypes.some(type => fileName.endsWith(type));
    
    if (!isValidType) {
      alert('Please upload .txt, .pdf, .doc, or .docx files only');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      const response = await fetch('https://knowledgescout-backend.onrender.com/upload/', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`✅ ${result.filename} uploaded successfully! (${result.file_type})`);
        fetchDocuments();
      } else {
        alert('Upload failed. Please try again.');
      }
    } catch (error) {
      alert('Upload failed: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await fetch('https://knowledgescout-backend.onrender.com/documents/');
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  const askQuestion = async () => {
    if (!question.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('https://knowledgescout-backend.onrender.com/ask/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });
      
      if (!response.ok) {
        throw new Error('Backend not responding');
      }
      
      const data = await response.json();
      
      setChatHistory(prev => [...prev, {
        question,
        answer: data.answer,
        sources: data.sources || []
      }]);
      
      setQuestion('');
    } catch (error) {
      alert('❌ Failed to get answer. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const createSampleDocument = () => {
    const sampleContent = `KnowledgeScout - Document Q&A System

Welcome to KnowledgeScout! This is a sample document.

Features:
- Upload and analyze documents
- Ask questions about your documents
- Get instant answers with sources
- Support for multiple file formats

Try asking:
- "What is this document about?"
- "What features does KnowledgeScout have?"
- "What file types are supported?"`;

    // Simulate file upload
    const blob = new Blob([sampleContent], { type: 'text/plain' });
    const file = new File([blob], 'welcome-to-knowledgescout.txt', { type: 'text/plain' });
    
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e) => handleFileUpload(e as any);
    
    // Create a data transfer to simulate file selection
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    input.files = dataTransfer.files;
    
    input.click();
  };

  const getFileIcon = (filename: string) => {
    if (filename.toLowerCase().endsWith('.pdf')) return '📄';
    if (filename.toLowerCase().endsWith('.doc') || filename.toLowerCase().endsWith('.docx')) return '📋';
    return '📝';
  };

  const getFileType = (filename: string) => {
    if (filename.toLowerCase().endsWith('.pdf')) return 'PDF';
    if (filename.toLowerCase().endsWith('.doc')) return 'DOC';
    if (filename.toLowerCase().endsWith('.docx')) return 'DOCX';
    return 'TXT';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">KnowledgeScout</h1>
          <p className="text-xl text-gray-600 mb-2">Document Q&A System</p>
          <p className="text-lg text-gray-500 mb-4">Upload documents and ask questions</p>
          
          {/* API Status */}
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
            apiStatus === 'online' ? 'bg-green-100 text-green-800' : 
            apiStatus === 'offline' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              apiStatus === 'online' ? 'bg-green-500' : 
              apiStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
            }`}></div>
            Backend: {apiStatus === 'online' ? 'Connected' : apiStatus === 'offline' ? 'Disconnected' : 'Checking...'}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Documents */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
              <h2 className="text-2xl font-semibold mb-6 text-gray-800">📁 Documents</h2>
              
              {/* File Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Upload Document
                </label>
                <div className="flex flex-col space-y-3">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept=".txt,.pdf,.doc,.docx"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    disabled={loading}
                  />
                  
                  <button
                    onClick={createSampleDocument}
                    className="text-sm bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition-colors flex items-center justify-center"
                    disabled={loading}
                  >
                    <span className="mr-2">+</span>
                    Add Sample Document
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Supported: .txt, .pdf, .doc, .docx files</p>
              </div>

              {/* Documents List */}
              <div>
                <h3 className="font-medium text-gray-700 mb-3">Uploaded Files ({documents.length}):</h3>
                {documents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📄</div>
                    <p>No documents yet</p>
                    <p className="text-sm">Upload a file to get started</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-start space-x-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border">
                        <div className="text-blue-500 mt-0.5 text-lg">
                          {getFileIcon(doc.filename)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">{doc.filename}</p>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {getFileType(doc.filename)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 truncate mt-1">
                            {doc.content.length > 50 ? doc.content.substring(0, 50) + '...' : doc.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg p-6 h-[600px] flex flex-col">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-6">
                {chatHistory.length === 0 ? (
                  <div className="text-center text-gray-500 mt-16">
                    <div className="text-6xl mb-4">🤔</div>
                    <h3 className="text-xl font-semibold mb-2">Welcome to KnowledgeScout!</h3>
                    <p className="text-gray-600 mb-2">Upload documents and ask questions to get started.</p>
                    <p className="text-sm text-gray-500">Try: "What is this document about?" or upload a file and ask questions</p>
                  </div>
                ) : (
                  chatHistory.map((chat, index) => (
                    <div key={index} className="space-y-3">
                      {/* Question */}
                      <div className="flex justify-end">
                        <div className="bg-blue-500 text-white rounded-2xl px-4 py-2 max-w-[80%]">
                          {chat.question}
                        </div>
                      </div>
                      
                      {/* Answer */}
                      <div className="flex justify-start">
                        <div className="bg-gray-100 text-gray-800 rounded-2xl px-4 py-2 max-w-[80%]">
                          <div className="whitespace-pre-wrap">{chat.answer}</div>
                          
                          {/* Sources */}
                          {chat.sources && chat.sources.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="text-xs font-semibold text-gray-500 mb-1">📚 Sources:</div>
                              <div className="space-y-1">
                                {chat.sources.map((source, idx) => (
                                  <div key={idx} className="text-xs text-gray-600 bg-white px-2 py-1 rounded border flex items-center">
                                    <span className="mr-2">{getFileIcon(source.filename)}</span>
                                    {source.filename}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input Area */}
              <div className="border-t pt-4">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !loading && askQuestion()}
                    placeholder="Ask anything about your documents..."
                    className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  />
                  <button
                    onClick={askQuestion}
                    disabled={loading || !question.trim()}
                    className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Asking...
                      </div>
                    ) : 'Ask'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Tip: Upload a document first, then ask questions about its content
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pb-8 text-gray-500">
          <p>Built with ❤️ for the hackathon | KnowledgeScout Document Q&A System</p>
        </div>
      </div>
    </div>
  );
}