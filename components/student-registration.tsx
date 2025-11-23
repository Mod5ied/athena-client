'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useSessionStore } from '@/hooks/use-store';
import { X, Plus, ScanLine, Image as Img, Camera, FileText, Edit2, Check } from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';
import { useStudentForm, useCreateStudentsBatch } from '@/hooks/use-students';
import { useOCR } from '@/hooks/use-ocr';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { LoaderIcon } from 'lucide-react';

export function StudentRegistration() {
  const { schoolId, gradeLevel } = useSessionStore();
  const { showSuccess, showError } = useNotifications();
  
  // OCR hook
  const { 
    isProcessing: isOCRProcessing, 
    students: ocrStudents, 
    processImage, 
    resetOCR: resetOCRHook,
    hasStudents: hasOCRStudents,
    editingStudentIndex,
    updateStudent,
    setEditingStudent
  } = useOCR();
  
  // UI state management
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageBlob, setSelectedImageBlob] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCameraPreview, setShowCameraPreview] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Handle video stream setup
  useEffect(() => {
    if (cameraStream && videoRef.current && showCameraPreview) {
      const video = videoRef.current;
      
      const setupVideo = async () => {
        try {
          video.srcObject = cameraStream;
          await video.play();
        } catch (error) {
          console.error('Error setting up video:', error);
        }
      };
      
      setupVideo();
    }
  }, [cameraStream, showCameraPreview]);
  
  const {
    students,
    newStudent,
    addStudent,
    removeStudent,
    clearStudents,
    updateNewStudent,
    getClassLevelLabel,
    getStudentsForSubmission,
    classLevels
  } = useStudentForm();

  // Grade levels for display
  const GRADE_LEVELS = [
    { value: 'Basic_1', label: 'Primary 1' },
    { value: 'Basic_2', label: 'Primary 2' },
    { value: 'Basic_3', label: 'Primary 3' },
    { value: 'Basic_4', label: 'Primary 4' },
    { value: 'Basic_5', label: 'Primary 5' },
    { value: 'Basic_6', label: 'Primary 6' },
  ];

  const createStudentsBatch = useCreateStudentsBatch();

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (selectedImageBlob) {
        URL.revokeObjectURL(selectedImageBlob);
      }
    };
  }, [selectedImageBlob]);

  const handleAddStudent = (studentData?: Partial<typeof newStudent>) => {
    const success = addStudent(studentData);
    if (!success) {
      showError('Validation Error', 'Please fill in all required student fields');
    }
  };

  const handleAddStudentClick = () => {
    handleAddStudent();
  };

  const handleRegisterStudents = () => {
    if (students.length === 0) {
      showError('No Students', 'Please add at least one student before registering');
      return;
    }

    if (!schoolId) {
      showError('School Error', 'School ID is missing. Please log in again.');
      return;
    }

    createStudentsBatch.mutate(
      { 
        students: getStudentsForSubmission(),
        schoolId: schoolId
      },
      {
        onSuccess: () => {
          showSuccess('Success!', `Successfully registered ${students.length} student${students.length !== 1 ? 's' : ''}`);
          setTimeout(() => {
            clearStudents();
          }, 2000);
        },
        onError: (error) => {
          console.error('Registration error:', error);
          showError('Registration Failed', error.message || 'Failed to register students. Please try again.');
        }
      }
    );
  };

  const getButtonText = () => {
    if (createStudentsBatch.isPending) return 'Registering Students...';
    if (createStudentsBatch.isSuccess) return 'Students Registered ✓';
    return `Register ${students.length} Student${students.length !== 1 ? 's' : ''}`;
  };

  // OCR handlers
  const handleCameraCapture = async () => {
    try {
      setIsProcessing(true);
      
      // Mobile-optimized camera settings
      let stream;
      try {
        // Try back camera first (ideal for document scanning)
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      } catch {
        // Fallback to any available camera if back camera fails
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      }

      // Set camera stream and show preview - useEffect will handle video setup
      setCameraStream(stream);
      setShowCameraPreview(true);
      
      // Small delay to let the UI update then stop loading
      setTimeout(() => setIsProcessing(false), 500);

    } catch (error: unknown) {
      console.error('Camera access failed:', error);
      setIsProcessing(false);
      setShowCameraPreview(false);
      
      // Stop any streams that might have been created
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
      
      if (error instanceof Error && error.name === 'NotAllowedError') {
        showError('Camera Permission', 'Camera permission denied. Please allow camera access in your browser settings.');
      } else {
        showError('Camera Error', 'Unable to access camera. Make sure your device has a camera and try again.');
      }
    }
  };

  // Handle actual photo capture
  const handleTakeSnapshot = async () => {
    if (!videoRef.current || !cameraStream) return;
    
    const video = videoRef.current;
    
    // Create canvas to capture snapshot
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Create high-quality JPEG for OCR processing
    const imgDataJPEG = canvas.toDataURL('image/jpeg', 0.9);

    // Stop video stream and hide preview
    cameraStream.getTracks().forEach(track => track.stop());
    setCameraStream(null);
    setShowCameraPreview(false);

    // Process the captured image
    const file = await dataURLtoFile(imgDataJPEG, 'camera-capture.jpg');
    handleImageSelection(file);
  };

  const handleGallerySelection = () => {
    // Create file input for gallery selection
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleImageSelection(file);
      }
    };
    input.click();
  };

  const handleImageSelection = (file: File) => {
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageUrl = e.target?.result as string;
      setSelectedImage(imageUrl);
      // Convert to blob URL for Next.js Image compatibility
      const blobUrl = dataURLtoBlobURL(imageUrl);
      setSelectedImageBlob(blobUrl);
      setIsProcessing(false);
      
      // Process OCR automatically after image is set
      setTimeout(async () => {
        await processImage(imageUrl);
      }, 500);
    };
    reader.readAsDataURL(file);
  };

  const resetOCR = () => {
    // Cleanup blob URL to prevent memory leaks
    if (selectedImageBlob) {
      URL.revokeObjectURL(selectedImageBlob);
    }
    // Stop camera stream if active
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    // Reset OCR hook state
    resetOCRHook();
    
    setSelectedImage(null);
    setSelectedImageBlob(null);
    setShowCameraPreview(false);
    setIsProcessing(false);
  };

  // Helper function to convert data URL to File object
  const dataURLtoFile = (dataurl: string, filename: string): Promise<File> => {
    return new Promise((resolve) => {
      const arr = dataurl.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      resolve(new File([u8arr], filename, { type: mime }));
    });
  };

  // Helper function to convert data URL to blob URL for Next.js Image
  const dataURLtoBlobURL = (dataURL: string): string => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    const n = bstr.length;
    const u8arr = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      u8arr[i] = bstr.charCodeAt(i);
    }
    const blob = new Blob([u8arr], { type: mime });
    return URL.createObjectURL(blob);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Student Registration</h2>
        <p className="text-gray-600">Add and register students for your class</p>
      </div>

      <Accordion type="single" defaultValue="add-new" collapsible className="w-full space-y-4">
        <AccordionItem value="add-ai" className="bg-white rounded-lg shadow-sm border">
          <AccordionTrigger className="px-6 hover:no-underline">
            <div className="flex items-center gap-3">
              <ScanLine className="h-5 w-5 text-purple-600" />
              <span className="font-semibold">Add with OCR</span>
              {/* <span className="text-sm text-gray-500 font-normal">Extract from documents</span> */}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-0">
            <div className="px-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-50 rounded-lg p-6">
                  {/* OCR section */}
                  <div className="relative">
                    {/* Camera Preview or Initial State */}
                    {showCameraPreview ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-medium text-gray-900">Camera Preview</h3>
                          <Button onClick={resetOCR} variant="outline" size="sm">
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                        
                        {/* Video Preview */}
                        <div className="relative">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-64 object-cover bg-black rounded-lg"
                          />
                          {/* Loading overlay for camera */}
                          {isProcessing && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                              <div className="text-white text-center">
                                <LoaderIcon className="h-6 w-6 animate-spin mx-auto mb-2" />
                                <p className="text-sm">Starting camera...</p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Capture Button */}
                        <div className="flex gap-3 justify-center">
                          <Button
                            onClick={handleTakeSnapshot}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                          >
                            <Camera className="h-4 w-4" />
                            Capture Photo
                          </Button>
                        </div>
                      </div>
                    ) : !selectedImage ? (
                      <div className="text-center py-12">
                        <div className="relative mb-6">
                          <FileText className="h-16 w-16 mx-auto text-blue-400 mb-2" />
                          <ScanLine className="h-6 w-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-600" />
                        </div>
                        <h3 className="text-base font-medium text-gray-900 mb-2">Upload Student Register</h3>
                        <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                          Take a photo or select an image to extract text
                        </p>
                        
                        <div className="flex gap-3 justify-center">
                          <Button
                            onClick={handleCameraCapture}
                            disabled={isProcessing || isOCRProcessing}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                          >
                            <Camera className="h-4 w-4" />
                            Camera
                          </Button>
                          <Button
                            onClick={handleGallerySelection}
                            disabled={isProcessing || isOCRProcessing}
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            <Img className="h-4 w-4" />
                            Gallery
                          </Button>
                        </div>
                        
                        {isProcessing && (
                          <p className="text-sm text-gray-500 mt-4">Processing image...</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-medium text-gray-900">Scanned Document</h3>
                        </div>
                        
                        {/* Document Display */}
                        <div className="relative">
                          {selectedImageBlob ? (
                            <Image
                              src={selectedImageBlob}
                              unoptimized
                              width={400}
                              height={256}
                              alt="scanned_document"
                              className="w-full h-64 object-contain bg-white rounded-lg border"
                            />
                          ) : (
                            <Image
                              src={selectedImage!} 
                              unoptimized
                              width={400}
                              height={256}
                              alt="scanned_document"
                              className="w-full h-64 object-contain bg-white rounded-lg border"
                            />
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-3 justify-center">
                          <Button
                            onClick={handleCameraCapture}
                            disabled={isOCRProcessing}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                          >
                            <Camera className="h-4 w-4" />
                            Capture Again
                          </Button>
                          <Button 
                            onClick={resetOCR} 
                            variant="outline" 
                            disabled={isOCRProcessing}
                            className="flex items-center gap-2"
                          >
                            <X className="h-4 w-4" />
                            Reset
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Simple Loading Overlay */}
                    {isOCRProcessing && (
                      <div className="absolute inset-0 bg-black bg-opacity-30 rounded-lg flex items-center justify-center z-10 backdrop-blur-sm">
                        <div className="bg-white rounded-lg p-6 shadow-lg">
                          <div className="flex flex-col items-center gap-4">
                            <LoaderIcon className="h-8 w-8 animate-spin text-blue-600" />
                            <div className="text-center">
                              <h3 className="font-medium text-gray-900">Processing Document</h3>
                              <p className="text-sm text-gray-500 mt-1">Extracting student information...</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* OCR Extracted Students List */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-gray-900">
                      Extracted Students ({ocrStudents.length})
                    </h3>
                    {hasOCRStudents && gradeLevel && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {GRADE_LEVELS.find(g => g.value === gradeLevel)?.label}
                      </span>
                    )}
                  </div>
            
                  {!hasOCRStudents ? (
                    <p className="text-gray-500 text-center py-8">
                      {selectedImage ? 'Processing image...' : 'No students extracted yet'}
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {ocrStudents.map((student, index) => (
                        <div key={`ocr-${index}`} className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div className="flex-1">
                            {editingStudentIndex === index ? (
                              // Editing mode - show input field
                              <div className="space-y-2">
                                <Input
                                  value={`${student.firstName} ${student.lastName}`.trim()}
                                  onChange={(e) => {
                                    updateStudent(index, e.target.value);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      setEditingStudent(null);
                                    } else if (e.key === 'Escape') {
                                      setEditingStudent(null);
                                    }
                                  }}
                                  className="font-medium"
                                  autoFocus
                                />
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium text-blue-600">
                                    {GRADE_LEVELS.find(g => g.value === student.classLevel)?.label || student.classLevel}
                                  </span>
                                  {student.gender && <span> • {student.gender}</span>}
                                  {student.dateOfBirth && <span> • {student.dateOfBirth}</span>}
                                </div>
                                {student.guardianName && (
                                  <p className="text-sm text-gray-500">
                                    Guardian: {student.guardianName}
                                    {student.guardianPhone && ` • ${student.guardianPhone}`}
                                  </p>
                                )}
                              </div>
                            ) : (
                              // Display mode - show text with edit icon
                              <div className="group">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-gray-900">
                                    {student.firstName} {student.lastName}
                                  </p>
                                  <button
                                    onDoubleClick={() => setEditingStudent(index)}
                                    onClick={() => setEditingStudent(index)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                                    title="Edit name"
                                  >
                                    <Edit2 className="h-3 w-3 text-gray-500" />
                                  </button>
                                </div>
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium text-blue-600">
                                    {GRADE_LEVELS.find(g => g.value === student.classLevel)?.label || student.classLevel}
                                  </span>
                                  {student.gender && <span> • {student.gender}</span>}
                                  {student.dateOfBirth && <span> • {student.dateOfBirth}</span>}
                                </div>
                                {student.guardianName && (
                                  <p className="text-sm text-gray-500">
                                    Guardian: {student.guardianName}
                                    {student.guardianPhone && ` • ${student.guardianPhone}`}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {editingStudentIndex === index ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingStudent(null)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Add OCR student to manual students list
                                  const success = addStudent({
                                    ...student,
                                    classLevel: student.classLevel || 'Basic_1' // Default if not detected
                                  });
                                  if (success) {
                                    showSuccess('Student Added', `${student.firstName} ${student.lastName} added to registration list`);
                                  }
                                }}
                                className="ml-2"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {hasOCRStudents && (
                    <div className="mt-4 pt-4 border-t">
                      <Button
                        onClick={() => {
                          // Add all OCR students to the registration list
                          let addedCount = 0;
                          ocrStudents.forEach(student => {
                            const success = addStudent({
                              ...student,
                              classLevel: student.classLevel || 'Basic_1'
                            });
                            if (success) addedCount++;
                          });
                          
                          if (addedCount > 0) {
                            showSuccess('Students Added', `${addedCount} student${addedCount !== 1 ? 's' : ''} added to registration list`);
                          }
                        }}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add All {ocrStudents.length} Students
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="add-new" className="bg-white rounded-lg shadow-sm border">
          <AccordionTrigger className="px-6 hover:no-underline">
            <div className="flex items-center gap-3">
              <Plus className="h-5 w-5 text-blue-600" />
              <span className="font-semibold">Add New Students</span>
              {/* <span className="text-sm text-gray-500 font-normal">Manual student registration</span> */}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-6">
              {/* Add Student Form */}
              <div className="bg-gray-50 rounded-lg p-6">
                {/* <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Student</h3> */}
                <h4 className="text-sm font-medium text-gray-900 mb-3">Student Information (Required)</h4>
          
                <div className="space-y-4" suppressHydrationWarning={true}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="Enter first name"
                        value={newStudent.firstName}
                        onChange={(e) => updateNewStudent('firstName', e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Enter last name"
                        value={newStudent.lastName}
                        onChange={(e) => updateNewStudent('lastName', e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={newStudent.dateOfBirth}
                        onChange={(e) => updateNewStudent('dateOfBirth', e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <Select
                        value={newStudent.gender}
                        onValueChange={(value: 'MALE' | 'FEMALE') => updateNewStudent('gender', value)}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MALE">Male</SelectItem>
                          <SelectItem value="FEMALE">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="classLevel">Class Level</Label>
                    <Select
                      value={newStudent.classLevel}
                      onValueChange={(value) => updateNewStudent('classLevel', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select class level" />
                      </SelectTrigger>
                      <SelectContent>
                        {classLevels.map((classLevel) => (
                          <SelectItem key={classLevel.value} value={classLevel.value}>
                            {classLevel.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Guardian Information (Optional)</h4>
                    
                    <div className="space-y-3" suppressHydrationWarning>
                      <div>
                        <Label htmlFor="guardianName">Guardian Name</Label>
                        <Input
                          id="guardianName"
                          placeholder="Enter guardian name"
                          value={newStudent.guardianName || ''}
                          onChange={(e) => updateNewStudent('guardianName', e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="guardianPhone">Guardian Phone</Label>
                        <Input
                          id="guardianPhone"
                          placeholder="+234-xxx-xxx-xxxx"
                          value={newStudent.guardianPhone || ''}
                          onChange={(e) => updateNewStudent('guardianPhone', e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="guardianEmail">Guardian Email</Label>
                        <Input
                          id="guardianEmail"
                          type="email"
                          placeholder="guardian@example.com"
                          value={newStudent.guardianEmail || ''}
                          onChange={(e) => updateNewStudent('guardianEmail', e.target.value)}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleAddStudentClick}
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700 hover:cursor-pointer"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Student to List
                  </Button>
                </div>
              </div>

              {/* Students List */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  Students to Register ({students.length})
                </h3>
          
                {students.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No students added yet</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {students.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {getClassLevelLabel(student.classLevel)} • {student.gender} • {student.dateOfBirth}
                          </p>
                          {student.guardianName && (
                            <p className="text-sm text-gray-500">
                              Guardian: {student.guardianName}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => removeStudent(student.id)}
                          className="ml-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {students.length > 0 && (
                  <div className="mt-6 pt-4 border-t">
                    <Button
                      onClick={handleRegisterStudents}
                      disabled={createStudentsBatch.isPending}
                      className={`w-full py-3 ${createStudentsBatch.isSuccess 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-blue-600 hover:bg-blue-700'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {getButtonText()}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}